'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { vanSessionsApi, usersApi, vehiclesApi, warehousesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import {
  PlusIcon,
  TruckIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface VanSession {
  id: number;
  reference: string;
  livreur_id: number;
  vehicle_id?: number;
  warehouse_id: number;
  date: string;
  start_time?: string;
  end_time?: string;
  status: 'preparing' | 'active' | 'completed' | 'cancelled';
  total_loaded_value: number;
  total_sales: number;
  total_collected: number;
  total_credit: number;
  total_returned_value: number;
  sales_count: number;
  notes?: string;
  livreur?: { id: number; name: string };
  vehicle?: { id: number; plate_number: string; model: string };
  warehouse?: { id: number; name: string };
}

interface User {
  id: number;
  name: string;
}

interface Vehicle {
  id: number;
  plate_number: string;
  model: string;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function VanSalesPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const [sessions, setSessions] = useState<VanSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [livreurFilter, setLivreurFilter] = useState('');
  const [showTour, setShowTour] = useState(false);

  // Data for filters and form
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    livreur_id: '',
    vehicle_id: '',
    warehouse_id: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="vs-header"]',
      title: t('vanSales.tourListHeaderTitle'),
      desc: t('vanSales.tourListHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vs-kpis"]',
      title: t('vanSales.tourListKpiTitle'),
      desc: t('vanSales.tourListKpiDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vs-filters"]',
      title: t('vanSales.tourListFiltersTitle'),
      desc: t('vanSales.tourListFiltersDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vs-table"]',
      title: t('vanSales.tourListTableTitle'),
      desc: t('vanSales.tourListTableDesc'),
      position: 'top' as const,
    },
  ], [t]);

  const fetchData = async () => {
    try {
      const [sessionsRes, livreursRes, vehiclesRes, warehousesRes] = await Promise.all([
        vanSessionsApi.getAll(),
        usersApi.getLivreurs(),
        vehiclesApi.getAll(),
        warehousesApi.getAll(),
      ]);
      setSessions(sessionsRes.data.data || sessionsRes.data);
      setLivreurs(livreursRes.data.data || livreursRes.data);
      setVehicles(vehiclesRes.data.data || vehiclesRes.data);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
    } catch (error) {
      toast.error(t('vanSales.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStart = async (id: number) => {
    if (!confirm(t('vanSales.confirmStartSession'))) return;
    try {
      await vanSessionsApi.start(id);
      toast.success(t('vanSales.sessionStarted'));
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message || t('vanSales.errorStartingSession');
      const errors = error.response?.data?.errors;
      if (errors) {
        toast.error(errors.join('\n'));
      } else {
        toast.error(message);
      }
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm(t('vanSales.confirmCompleteSession'))) return;
    try {
      await vanSessionsApi.complete(id);
      toast.success(t('vanSales.sessionCompleted'));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('vanSales.errorCompletingSession'));
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm(t('vanSales.confirmCancelSession'))) return;
    try {
      await vanSessionsApi.cancel(id);
      toast.success(t('vanSales.sessionCancelled'));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('vanSales.errorCancellingSession'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('vanSales.confirmDeleteSession'))) return;
    try {
      await vanSessionsApi.delete(id);
      toast.success(t('vanSales.sessionDeleted'));
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('vanSales.errorDeletingSession'));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/dashboard/van-sales/new?livreur_id=${formData.livreur_id}&vehicle_id=${formData.vehicle_id}&warehouse_id=${formData.warehouse_id}&date=${formData.date}&notes=${encodeURIComponent(formData.notes)}`;
  };

  const formatCurrency = (value: number | string | null | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(num)) return t('vanSales.zeroCurrency');
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ');
  };

  const formatTime = (datetime: string | undefined) => {
    if (!datetime) return '-';
    return new Date(datetime).toLocaleTimeString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; darkBg: string; text: string; darkText: string; icon: typeof ClockIcon; label: string }> = {
      preparing: { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-800', darkText: 'dark:text-amber-300', icon: ClockIcon, label: t('vanSales.preparing') },
      active: { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-800', darkText: 'dark:text-blue-300', icon: PlayIcon, label: t('vanSales.active') },
      completed: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-800', darkText: 'dark:text-green-300', icon: CheckCircleIcon, label: t('vanSales.completed') },
      cancelled: { bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', text: 'text-red-800', darkText: 'dark:text-red-300', icon: XCircleIcon, label: t('vanSales.cancelled') },
    };
    return configs[status] || configs.preparing;
  };

  const hasActiveFilters = searchTerm || statusFilter || livreurFilter;

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLivreurFilter('');
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesSearch = session.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.livreur?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || session.status === statusFilter;
      const matchesLivreur = !livreurFilter || session.livreur_id.toString() === livreurFilter;
      return matchesSearch && matchesStatus && matchesLivreur;
    });
  }, [sessions, searchTerm, statusFilter, livreurFilter]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const parseNum = (val: any) => {
      const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
      return isNaN(num) ? 0 : num;
    };

    return {
      total: sessions.length,
      preparing: sessions.filter(s => s.status === 'preparing').length,
      active: sessions.filter(s => s.status === 'active').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      totalSales: sessions.reduce((sum, s) => sum + parseNum(s.total_sales), 0),
      totalCollected: sessions.reduce((sum, s) => sum + parseNum(s.total_collected), 0),
      totalCredit: sessions.reduce((sum, s) => sum + parseNum(s.total_credit), 0),
    };
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="vs-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('vanSales.title')}</h1>
            <p className="text-sm text-gray-400 mt-1.5">{t('vanSales.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTour(true)}
            className="text-sm font-medium text-gray-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
          >
            {t('vanSales.tourBtn')}
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {t('vanSales.refresh')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/20 hover:shadow-lg hover:shadow-violet-600/30 active:scale-[0.98] transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            {t('vanSales.newSession')}
          </button>
        </div>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="vs-kpis">
        <div className={`grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors duration-200">
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isRTL ? 'origin-right' : 'origin-left'} rounded-b`} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                <span className="text-sm font-black">#</span>
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.total}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.totalSessions')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-amber-50/40 dark:hover:bg-amber-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2.5">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">{kpis.preparing}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.preparing')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-cyan-50/40 dark:hover:bg-cyan-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 mb-2.5">
                <PlayIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums leading-none">{kpis.active}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.active')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-green-50/40 dark:hover:bg-green-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2.5">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400 tabular-nums leading-none">{kpis.completed}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.completed')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-purple-50/40 dark:hover:bg-purple-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2.5">
                <BanknotesIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalSales)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.totalSalesKpi')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2.5">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">{formatCurrency(kpis.totalCollected)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.collected')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/20 transition-colors duration-200">
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isRTL ? 'origin-left' : 'origin-right'} rounded-b`} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2.5">
                <XCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{formatCurrency(kpis.totalCredit)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSales.credit')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="vs-filters">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-200/70 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('vanSales.filtersLabel')}</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">{t('vanSales.activeFilter')}</span>
            )}
          </div>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-colors">
              <XMarkIcon className="w-3.5 h-3.5" />
              {t('vanSales.clearAll')}
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder={t('vanSales.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="">{t('vanSales.allStatuses')}</option>
              <option value="preparing">{t('vanSales.preparing')}</option>
              <option value="active">{t('vanSales.active')}</option>
              <option value="completed">{t('vanSales.completed')}</option>
              <option value="cancelled">{t('vanSales.cancelled')}</option>
            </select>
            <select
              value={livreurFilter}
              onChange={(e) => setLivreurFilter(e.target.value)}
              className="select"
            >
              <option value="">{t('vanSales.allDrivers')}</option>
              {livreurs.map(livreur => (
                <option key={livreur.id} value={livreur.id}>{livreur.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Sessions Table ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="vs-table">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('vanSales.sessionsList')}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 tabular-nums">
              {filteredSessions.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                <th className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSales.reference')}</th>
                <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSales.driver')}</th>
                <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSales.vehicle')}</th>
                <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSales.warehouse')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSales.date')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSales.time')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSales.sales')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSales.collected')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSales.status')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSales.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                      <TruckIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('vanSales.noSessions')}</p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => {
                  const statusConfig = getStatusConfig(session.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={session.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{session.reference}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{session.livreur?.name || '-'}</td>
                      <td className="px-4 py-3.5">
                        {session.vehicle ? (
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{session.vehicle.plate_number}</span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{session.warehouse?.name || '-'}</td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-700 dark:text-gray-300">{formatDate(session.date)}</td>
                      <td className="px-4 py-3.5 text-center">
                        {session.start_time ? (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatTime(session.start_time)}
                            {session.end_time && ` - ${formatTime(session.end_time)}`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{session.sales_count} {t('vanSales.operation')}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">{formatCurrency(session.total_sales)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-col">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{formatCurrency(session.total_collected)}</span>
                          {parseFloat(String(session.total_credit)) > 0 && (
                            <span className="text-[11px] text-red-500 dark:text-red-400">{t('vanSales.creditLabel')} {formatCurrency(session.total_credit)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${statusConfig.bg} ${statusConfig.darkBg} ${statusConfig.text} ${statusConfig.darkText}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <Link
                            href={`/dashboard/van-sessions/${session.id}`}
                            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title={t('vanSales.view')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>

                          {session.status === 'preparing' && (
                            <>
                              <button
                                onClick={() => handleStart(session.id)}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title={t('vanSales.start')}
                              >
                                <PlayIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(session.id)}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title={t('vanSales.deleteAction')}
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {session.status === 'active' && (
                            <>
                              <button
                                onClick={() => handleComplete(session.id)}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title={t('vanSales.end')}
                              >
                                <StopIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancel(session.id)}
                                className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title={t('vanSales.cancel')}
                              >
                                <XMarkIcon className="w-4 h-4" />
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
      </div>

      {/* ─── Create Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                  <TruckIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('vanSales.newVanSession')}</h2>
                  <p className="text-xs text-gray-400">{t('vanSales.subtitle')}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSales.driverLabel')}</label>
                <select
                  value={formData.livreur_id}
                  onChange={(e) => setFormData({ ...formData, livreur_id: e.target.value })}
                  className="select w-full"
                  required
                >
                  <option value="">{t('vanSales.selectDriver')}</option>
                  {livreurs.map(livreur => (
                    <option key={livreur.id} value={livreur.id}>{livreur.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSales.vehicleLabel')}</label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="select w-full"
                >
                  <option value="">{t('vanSales.selectVehicle')}</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate_number} - {vehicle.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSales.warehouseLabel')}</label>
                <select
                  value={formData.warehouse_id}
                  onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                  className="select w-full"
                  required
                >
                  <option value="">{t('vanSales.selectWarehouse')}</option>
                  {warehouses.map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSales.dateLabel')}</label>
                <DateInput
                  value={formData.date}
                  onChange={(v) => setFormData({ ...formData, date: v })}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSales.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/20 active:scale-[0.98] transition-all duration-200">
                  {t('vanSales.nextAddProducts')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {t('vanSales.cancelBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="van_sales_list_tour_step"
        />
      )}
    </div>
  );
}
