'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { vanSessionsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { VanSession } from '@/lib/types';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import {
  PlusIcon,
  TruckIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  XMarkIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

export default function VanSessionsPage() {
  const router = useRouter();
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const [sessions, setSessions] = useState<VanSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; darkBg: string; text: string; darkText: string; icon: typeof ClockIcon; label: string }> = {
      preparing: { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-800', darkText: 'dark:text-amber-300', icon: ClockIcon, label: t('vanSessions.statusPreparing') },
      active: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-800', darkText: 'dark:text-green-300', icon: PlayIcon, label: t('vanSessions.statusActive') },
      completed: { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-800', darkText: 'dark:text-blue-300', icon: CheckCircleIcon, label: t('vanSessions.statusCompleted') },
      cancelled: { bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', text: 'text-red-800', darkText: 'dark:text-red-300', icon: XCircleIcon, label: t('vanSessions.statusCancelled') },
    };
    return configs[status] || configs.preparing;
  };

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="vss-header"]',
      title: t('vanSessions.tourHeaderTitle'),
      desc: t('vanSessions.tourHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vss-kpis"]',
      title: t('vanSessions.tourKpiTitle'),
      desc: t('vanSessions.tourKpiDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vss-table"]',
      title: t('vanSessions.tourTableTitle'),
      desc: t('vanSessions.tourTableDesc'),
      position: 'top' as const,
    },
  ], [t]);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        router.push('/dashboard/van-sessions/new');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const fetchSessions = async () => {
    try {
      const response = await vanSessionsApi.getAll({ per_page: 50 });
      setSessions(response.data.data || response.data);
    } catch {
      toast.error(t('vanSessions.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setIsCancelling(true);
    try {
      await vanSessionsApi.cancel(cancelId);
      toast.success(t('vanSessions.sessionCancelled'));
      setCancelId(null);
      fetchSessions();
    } catch {
      toast.error(t('vanSessions.errorCancellingSession'));
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ');
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const filteredSessions = sessions.filter(s => !statusFilter || s.status === statusFilter);

  const kpis = useMemo(() => ({
    preparing: sessions.filter(s => s.status === 'preparing').length,
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    totalSales: sessions.reduce((sum, s) => sum + (s.total_sales || 0), 0),
  }), [sessions]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="vss-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('vanSessions.title')}</h1>
            <p className="text-sm text-gray-400 mt-1.5">{t('vanSessions.description')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTour(true)}
            className="text-sm font-medium text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
          >
            {t('vanSessions.tourBtn')}
          </button>
          <Link
            href="/dashboard/van-sessions/new"
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 active:scale-[0.98] transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            {t('vanSessions.newSession')}
            <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd>
          </Link>
        </div>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="vss-kpis">
        <div className={`grid grid-cols-2 lg:grid-cols-4 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          <div className="group relative p-5 hover:bg-amber-50/40 dark:hover:bg-amber-900/20 transition-colors duration-200">
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isRTL ? 'origin-right' : 'origin-left'} rounded-b`} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2.5">
                <ClockIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums leading-none">{kpis.preparing}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSessions.statusPreparing')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-green-50/40 dark:hover:bg-green-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2.5">
                <PlayIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400 tabular-nums leading-none">{kpis.active}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSessions.statusActive')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">{kpis.completed}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSessions.statusCompleted')}</div>
            </div>
          </div>

          <div className="group relative p-5 hover:bg-purple-50/40 dark:hover:bg-purple-900/20 transition-colors duration-200">
            <div className={`absolute top-0 inset-x-0 h-[3px] bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${isRTL ? 'origin-left' : 'origin-right'} rounded-b`} />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2.5">
                <BanknotesIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalSales)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vanSessions.totalSales')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Sessions Table ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="vss-table">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('vanSessions.sessionsList')}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 tabular-nums">
              {filteredSessions.length}
            </span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select max-w-[180px] text-sm"
          >
            <option value="">{t('vanSessions.allStatuses')}</option>
            <option value="preparing">{t('vanSessions.statusPreparing')}</option>
            <option value="active">{t('vanSessions.statusActive')}</option>
            <option value="completed">{t('vanSessions.statusCompleted')}</option>
            <option value="cancelled">{t('vanSessions.statusCancelled')}</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                <th className={`px-5 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessions.thReference')}</th>
                <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessions.thDriver')}</th>
                <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessions.thWarehouse')}</th>
                <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessions.thVehicle')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessions.thDate')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessions.thLoadedValue')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessions.thSales')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessions.thCollected')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessions.thStatus')}</th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessions.thActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                      <TruckIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('vanSessions.noSessions')}</p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const statusConfig = getStatusConfig(session.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={session.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{session.reference || `#${session.id}`}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{session.livreur?.name || '-'}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{session.warehouse?.name || '-'}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">{session.vehicle?.name || '-'}</td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-700 dark:text-gray-300">{formatDate(session.date)}</td>
                      <td className="px-4 py-3.5 text-center text-sm text-gray-700 dark:text-gray-300">{formatCurrency(session.total_loaded_value || 0)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{session.sales_count || 0}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">{formatCurrency(session.total_collected || 0)}</span>
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
                            title={t('vanSessions.viewDetails')}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Link>
                          {(session.status === 'preparing' || session.status === 'active') && (
                            <button
                              onClick={() => setCancelId(session.id)}
                              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title={t('vanSessions.cancelSession')}
                            >
                              <XMarkIcon className="w-4 h-4" />
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

      <ConfirmDialog
        isOpen={cancelId !== null}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        title={t('vanSessions.cancelSessionTitle')}
        message={t('vanSessions.cancelSessionMessage')}
        isLoading={isCancelling}
      />

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="van_sessions_list_tour_step"
        />
      )}
    </div>
  );
}
