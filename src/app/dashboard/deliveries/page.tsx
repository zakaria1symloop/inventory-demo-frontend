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
import { PageHeader, FilterBar } from '@/components/dashboard';
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

  // Accepts ISO timestamps ("2026-05-28T15:06:14.000000Z") or plain "HH:MM:SS".
  // Always returns HH:MM in the user's locale.
  const formatTime = (value?: string | null) => {
    if (!value) return '';
    const d = new Date(value.includes('T') ? value : `1970-01-01T${value}Z`);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'ar-DZ', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { dot: string; text: string; icon: React.ReactNode }> = {
      preparing: {
        dot: 'metric-dot-orange',
        text: t('deliveries.preparing'),
        icon: <ClockIcon className="w-4 h-4" />,
      },
      in_progress: {
        dot: 'metric-dot-blue',
        text: t('deliveries.inProgress'),
        icon: <TruckIcon className="w-4 h-4" />,
      },
      completed: {
        dot: 'metric-dot-green',
        text: t('deliveries.completed'),
        icon: <CheckCircleIcon className="w-4 h-4" />,
      },
      cancelled: {
        dot: 'metric-dot-red',
        text: t('deliveries.cancelled'),
        icon: <XCircleIcon className="w-4 h-4" />,
      },
    };
    return configs[status] || { dot: 'metric-dot-neutral', text: status, icon: null };
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
    <div className="space-y-4">
      {showTour && (
        <GuidedTour
          steps={deliveryTourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="deliveries_tour_step"
        />
      )}

      {/* ─── Header ─── */}
      <div data-tour="deliveries-title">
        <PageHeader title={t('deliveries.title')} subtitle={t('deliveries.subtitle')}>
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={t('deliveries.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('deliveries.tourButton')}</span>
          </button>
          <Link
            href="/dashboard/deliveries/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            data-tour="deliveries-add"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('deliveries.addNew')}</span>
            <span className="sm:hidden">{t('deliveries.addNewShort')}</span>
            <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd>
          </Link>
        </PageHeader>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5" data-tour="deliveries-kpis">
        {[
          { label: t('deliveries.kpiTotal'),       value: kpis.totalDeliveries,            dot: 'metric-dot-neutral', currency: false },
          { label: t('deliveries.kpiSuccessRate'), value: `${kpis.successRate}%`,          dot: 'metric-dot-green',   currency: false },
          { label: t('deliveries.kpiDelivered'),   value: `${kpis.deliveredOrders} / ${kpis.totalOrders}`, dot: 'metric-dot-blue', currency: false },
          { label: t('deliveries.kpiFailed'),      value: kpis.failedOrders,               dot: 'metric-dot-red',     currency: false },
          { label: t('deliveries.kpiCollected'),   value: formatCurrency(kpis.collectedAmount), dot: 'metric-dot-violet', currency: true },
          { label: t('deliveries.kpiUnassigned'),  value: kpis.unassignedOrders,           dot: 'metric-dot-orange',  currency: false },
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

      {/* ─── Search + Filter Chips + Toggle ─── */}
      <div data-tour="deliveries-chips">
        <FilterBar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t('deliveries.searchPlaceholder')}
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
                {t('deliveries.advancedFilters')}
                {showFilters ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[12px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-semibold flex items-center gap-1">
                  <XCircleIcon className="w-3.5 h-3.5" />
                  {t('deliveries.clearAll')}
                </button>
              )}
            </>
          }
        >
          {/* Status chips inline */}
          {([
            { v: '',            label: t('deliveries.chipAll'),        count: kpis.totalDeliveries },
            { v: 'preparing',   label: t('deliveries.chipPreparing'),  count: kpis.preparingCount },
            { v: 'in_progress', label: t('deliveries.chipInProgress'), count: kpis.inProgressCount },
            { v: 'completed',   label: t('deliveries.chipCompleted'),  count: kpis.completedCount },
            { v: 'cancelled',   label: t('deliveries.chipCancelled'),  count: kpis.cancelledCount },
          ] as const).map((c) => (
            <button
              key={c.v}
              onClick={() => setStatusFilter(statusFilter === c.v ? '' : c.v)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                statusFilter === c.v
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {c.label} <span className={`${statusFilter === c.v ? 'text-orange-200' : 'text-gray-400 dark:text-gray-500'} tnum`}>({c.count})</span>
            </button>
          ))}
        </FilterBar>
      </div>

      {/* ─── Expanded Filters ─── */}
      {showFilters && (
        <div className="surface-pro p-4 space-y-4">
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
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-md">
              <span className="metric-dot metric-dot-blue" aria-hidden />
              {t('deliveries.todayBadge', { count: kpis.todayDeliveries, active: kpis.todayInProgress })}
            </span>
          )}
        </div>

        {paginatedDeliveries.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <TruckIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('deliveries.noResults')}</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-2 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 font-bold">
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
              // Cap at 100% — when livreur collects old debt on top of the
              // current delivery, raw ratio can exceed 100% which is confusing.
              const collectionPercent = totalAmt > 0
                ? Math.min(100, Math.round((collectedAmt / totalAmt) * 100))
                : 0;

              return (
                <div
                  key={delivery.id}
                  className="group rounded-md border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Main content */}
                    <div className="flex-1 p-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Left: Reference + Status */}
                        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                          <div className="w-9 h-9 rounded-md bg-gray-100 dark:bg-gray-700/60 flex items-center justify-center text-gray-600 dark:text-gray-300">
                            {status.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-gray-900 dark:text-white">{delivery.reference}</span>
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                <span className={`metric-dot ${status.dot}`} aria-hidden />
                                {status.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                {formatDate(delivery.date)}
                              </span>
                              {delivery.start_time && (
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3 h-3" />
                                  {formatTime(delivery.start_time)}
                                  {delivery.end_time && ` - ${formatTime(delivery.end_time)}`}
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
                            <div className="flex items-center justify-center gap-1.5 text-xs mb-1 tnum">
                              <span className="text-gray-800 dark:text-gray-100 font-semibold">{delivery.delivered_count}</span>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <span className="text-gray-600 dark:text-gray-300">{delivery.total_orders}</span>
                              {delivery.failed_count > 0 && (
                                <span className="text-red-500 dark:text-red-400 text-[10px] font-semibold">({delivery.failed_count} {t('deliveries.failed')})</span>
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
                              <div className="text-xs font-semibold text-gray-800 dark:text-gray-100 tnum">{formatCurrency(totalAmt)}</div>
                              {collectedAmt > 0 && (
                                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5 tnum">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-md bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                    className={`w-9 h-9 text-sm font-bold rounded-md transition-colors ${
                      page === currentPage
                        ? 'bg-orange-600 text-white'
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
