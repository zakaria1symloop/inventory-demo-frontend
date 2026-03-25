'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { vanSessionsApi, caissesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import type { VanSession, VanSale, VanReturn, Caisse } from '@/lib/types';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  UserIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  CubeIcon,
  DocumentTextIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  BanknotesIcon,
  ShoppingCartIcon,
  ArrowUturnLeftIcon,
  ChartBarIcon,
  MapPinIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  StopIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const roundQty = (v: number) => Math.round(v * 100) / 100;

export default function VanSessionDetail() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const params = useParams();
  const [id, setId] = useState<string | null>(null);

  const [session, setSession] = useState<VanSession | null>(null);
  const [sales, setSales] = useState<VanSale[]>([]);
  const [returns, setReturns] = useState<VanReturn[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'items' | 'sales' | 'returns'>('overview');
  const [expandedSale, setExpandedSale] = useState<number | null>(null);
  const [showTour, setShowTour] = useState(false);

  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // Settlement state
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [driverCaisse, setDriverCaisse] = useState<Caisse | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const BackArrowIcon = isRTL ? ArrowRightIcon : ArrowLeftIcon;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; darkBg: string; text: string; darkText: string; icon: typeof ClockIcon; label: string; color: string }> = {
      preparing: { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-800', darkText: 'dark:text-amber-300', icon: ClockIcon, label: t('vanSessionDetail.statusPreparing'), color: 'yellow' },
      active: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-800', darkText: 'dark:text-green-300', icon: PlayIcon, label: t('vanSessionDetail.statusActive'), color: 'green' },
      completed: { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-800', darkText: 'dark:text-blue-300', icon: CheckCircleIcon, label: t('vanSessionDetail.statusCompleted'), color: 'blue' },
      cancelled: { bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', text: 'text-red-800', darkText: 'dark:text-red-300', icon: XCircleIcon, label: t('vanSessionDetail.statusCancelled'), color: 'red' },
    };
    return configs[status] || configs.preparing;
  };

  const paymentStatusLabels = useMemo(() => ({
    paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircleIcon, label: t('vanSessionDetail.paymentPaid') },
    partial: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', icon: BanknotesIcon, label: t('vanSessionDetail.paymentPartial') },
    unpaid: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: XCircleIcon, label: t('vanSessionDetail.paymentUnpaid') },
  } as Record<string, { bg: string; text: string; icon: typeof CheckCircleIcon; label: string }>), [t]);

  const returnReasonLabels = useMemo(() => ({
    unsold: t('vanSessionDetail.reasonUnsold'),
    damaged: t('vanSessionDetail.reasonDamaged'),
    expired: t('vanSessionDetail.reasonExpired'),
    other: t('vanSessionDetail.reasonOther'),
  } as Record<string, string>), [t]);

  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="vssd-header"]',
      title: t('vanSessionDetail.tourHeaderTitle'),
      desc: t('vanSessionDetail.tourHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vssd-info"]',
      title: t('vanSessionDetail.tourInfoTitle'),
      desc: t('vanSessionDetail.tourInfoDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vssd-kpi"]',
      title: t('vanSessionDetail.tourKpiTitle'),
      desc: t('vanSessionDetail.tourKpiDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vssd-tabs"]',
      title: t('vanSessionDetail.tourTabsTitle'),
      desc: t('vanSessionDetail.tourTabsDesc'),
      position: 'top' as const,
    },
  ], [t]);

  useEffect(() => {
    const paramId = params.id as string;
    if (paramId && paramId !== '_') {
      setId(paramId);
    } else if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlId = pathParts[pathParts.length - 1];
      if (urlId && urlId !== '_') setId(urlId);
    }
  }, [params.id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    const numId = parseInt(id);
    try {
      const [sessionRes, salesRes] = await Promise.all([
        vanSessionsApi.getOne(numId),
        vanSessionsApi.getSales(numId),
      ]);
      const sessionData = sessionRes.data.data || sessionRes.data;
      const salesData = salesRes.data.data || salesRes.data;
      setSession(sessionData);
      setSales(Array.isArray(salesData) ? salesData : []);
      setReturns(sessionData.returns || []);
      if (sessionData.status === 'active' || sessionData.status === 'completed') {
        try {
          const statsRes = await vanSessionsApi.getStats(numId);
          setStats(statsRes.data.data || statsRes.data);
        } catch { /* stats optional */ }
      }
    } catch {
      toast.error(t('vanSessionDetail.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    setIsActioning(true);
    try {
      await vanSessionsApi.start(parseInt(id));
      toast.success(t('vanSessionDetail.sessionStartedSuccess'));
      setShowStartConfirm(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; errors?: string[] } } };
      if (err.response?.data?.errors) {
        err.response.data.errors.forEach((e: string) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || t('vanSessionDetail.errorStartingSession'));
      }
    } finally {
      setIsActioning(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setIsActioning(true);
    try {
      await vanSessionsApi.complete(parseInt(id));
      toast.success(t('vanSessionDetail.sessionCompletedSuccess'));
      setShowCompleteConfirm(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('vanSessionDetail.errorCompletingSession'));
    } finally {
      setIsActioning(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setIsActioning(true);
    try {
      await vanSessionsApi.cancel(parseInt(id));
      toast.success(t('vanSessionDetail.sessionCancelledSuccess'));
      setShowCancelConfirm(false);
      fetchData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('vanSessionDetail.errorCancellingSession'));
    } finally {
      setIsActioning(false);
    }
  };

  const openSettleDialog = async () => {
    try {
      const res = await caissesApi.getAll({ is_active: true });
      const caisses = res.data.data || res.data;
      const found = (Array.isArray(caisses) ? caisses : []).find(
        (c: Caisse) => c.user_id === session?.livreur_id
      );
      if (!found) { toast.error(t('vanSessionDetail.noDriverCaisse')); return; }
      setDriverCaisse(found);
      setSettleAmount(String(found.balance));
      setSettleNotes('');
      setShowSettleDialog(true);
    } catch { toast.error(t('vanSessionDetail.errorFetchingCaisse')); }
  };

  const handleSettle = async () => {
    if (!driverCaisse) return;
    const amount = parseFloat(settleAmount);
    if (!amount || amount <= 0) { toast.error(t('vanSessionDetail.enterValidAmount')); return; }
    if (amount > driverCaisse.balance) { toast.error(t('vanSessionDetail.amountExceedsBalance')); return; }
    setIsSettling(true);
    try {
      await caissesApi.settle(driverCaisse.id, {
        amount,
        type: 'admin_collect',
        notes: settleNotes || `${t('vanSessionDetail.collectFromSession')} ${session?.reference || session?.id}`,
      });
      toast.success(`${t('vanSessionDetail.collectSuccessPrefix')} ${amount.toLocaleString()} ${t('vanSessionDetail.collectSuccessSuffix')}`);
      setShowSettleDialog(false);
      setDriverCaisse(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('vanSessionDetail.errorSettling'));
    } finally {
      setIsSettling(false);
    }
  };

  const dateLocale = locale === 'fr' ? 'fr-DZ' : 'ar-DZ';
  const formatDateTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const formatTime = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
  };
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  const formatPercent = (value: number) => `${Math.round(value)}%`;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
          <TruckIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('vanSessionDetail.sessionNotFound')}</h3>
        <Link href="/dashboard/van-sessions" className="text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300">
          {t('vanSessionDetail.backToList')}
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;
  const items = session.items || [];
  const totalLoadedQty = roundQty(items.reduce((s, i) => s + i.quantity_loaded, 0));
  const totalSoldQty = roundQty(items.reduce((s, i) => s + i.quantity_sold, 0));
  const totalReturnedQty = roundQty(items.reduce((s, i) => s + i.quantity_returned, 0));
  const totalAvailableQty = roundQty(items.reduce((s, i) => s + (i.quantity_loaded - i.quantity_sold - i.quantity_returned), 0));
  const loadedValue = session.total_loaded_value || items.reduce((s, i) => s + (i.quantity_loaded * i.unit_cost), 0);
  const soldValue = session.total_sales || 0;
  const collectedValue = session.total_collected || 0;
  const creditValue = session.total_credit || 0;
  const sellThrough = totalLoadedQty > 0 ? (totalSoldQty / totalLoadedQty) * 100 : 0;
  const collectionRate = soldValue > 0 ? (collectedValue / soldValue) * 100 : 0;

  const getDuration = () => {
    if (!session.started_at) return null;
    const start = new Date(session.started_at);
    const end = session.completed_at ? new Date(session.completed_at) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0) return `${hours} ${t('vanSessionDetail.hours')} ${mins > 0 ? `${t('vanSessionDetail.and')} ${mins} ${t('vanSessionDetail.minutes')}` : ''}`;
    return `${mins} ${t('vanSessionDetail.minutes')}`;
  };

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-tour="vssd-header">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/van-sessions" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
            <BackArrowIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <TruckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {session.reference || `${t('vanSessionDetail.sessionPrefix')}${session.id}`}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.darkBg} ${statusConfig.text} ${statusConfig.darkText}`}>
                  <StatusIcon className="w-4 h-4" />
                  {statusConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                <span>{new Date(session.date).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
                {session.started_at && <span>{t('vanSessionDetail.startedAt')} {formatTime(session.started_at)}</span>}
                {session.completed_at && <span>{t('vanSessionDetail.endedAt')} {formatTime(session.completed_at)}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowTour(true)} className="text-sm font-medium text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors">
            {t('vanSessionDetail.tourBtn')}
          </button>
          {session.status === 'preparing' && (
            <Link href={`/dashboard/van-sessions/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              <PencilSquareIcon className="w-4 h-4" />
              {t('vanSessionDetail.edit')}
            </Link>
          )}
          {session.status === 'preparing' && (
            <button onClick={() => setShowStartConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-colors">
              <CheckCircleIcon className="w-4 h-4" />
              {t('vanSessionDetail.receiveGoods')}
            </button>
          )}
          {session.status === 'active' && (
            <button onClick={() => setShowCompleteConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-orange-500 text-white hover:bg-orange-600 shadow-sm shadow-orange-500/20 transition-colors">
              <StopIcon className="w-4 h-4" />
              {t('vanSessionDetail.endSession')}
            </button>
          )}
          {(session.status === 'preparing' || session.status === 'active') && (
            <button onClick={() => setShowCancelConfirm(true)} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <XMarkIcon className="w-4 h-4" />
              {t('vanSessionDetail.cancel')}
            </button>
          )}
          {(session.status === 'active' || session.status === 'completed') && (
            <button onClick={openSettleDialog} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 transition-colors">
              <BanknotesIcon className="w-4 h-4" />
              {t('vanSessionDetail.collectCaisse')}
            </button>
          )}
        </div>
      </div>

      {/* ─── Info Cards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-tour="vssd-info">
        {[
          { icon: UserIcon, color: 'blue', label: t('vanSessionDetail.driver'), value: session.livreur?.name || '-' },
          { icon: BuildingStorefrontIcon, color: 'purple', label: t('vanSessionDetail.warehouse'), value: session.warehouse?.name || '-' },
          { icon: TruckIcon, color: 'indigo', label: t('vanSessionDetail.vehicle'), value: session.vehicle?.name || t('vanSessionDetail.noVehicle') },
          { icon: CubeIcon, color: 'green', label: t('vanSessionDetail.productCount'), value: `${items.length} ${t('vanSessionDetail.productUnit')}` },
          { icon: DocumentTextIcon, color: 'emerald', label: t('vanSessionDetail.invoiceCount'), value: `${session.sales_count || sales.length}` },
          ...(getDuration() ? [{ icon: ClockIcon, color: 'orange', label: t('vanSessionDetail.duration'), value: getDuration()! }] : []),
        ].map((card, i) => {
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400',
            indigo: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
            green: 'bg-green-50 dark:bg-green-900/30 border-green-100 dark:border-green-800 text-green-600 dark:text-green-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
            orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400',
          };
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${colorMap[card.color]}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">{card.label}</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Financial KPI Strip ─── */}
      {session.status !== 'preparing' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden" data-tour="vssd-kpi">
          <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
            {[
              { icon: CubeIcon, color: 'blue', label: t('vanSessionDetail.loadedValue'), value: formatCurrency(loadedValue), sub: `${totalLoadedQty} ${t('vanSessionDetail.unitsLoaded')}` },
              { icon: BanknotesIcon, color: 'green', label: t('vanSessionDetail.totalSales'), value: formatCurrency(soldValue), sub: `${totalSoldQty} ${t('vanSessionDetail.unitsSold')} (${formatPercent(sellThrough)})` },
              { icon: CheckCircleIcon, color: 'emerald', label: t('vanSessionDetail.collectedCash'), value: formatCurrency(collectedValue), sub: `${t('vanSessionDetail.collectionRateLabel')} ${formatPercent(collectionRate)}` },
              { icon: XCircleIcon, color: 'red', label: t('vanSessionDetail.creditDebt'), value: formatCurrency(creditValue), sub: `${sales.filter(s => s.payment_status !== 'paid').length} ${t('vanSessionDetail.unpaidInvoices')}` },
              { icon: ArrowUturnLeftIcon, color: 'orange', label: t('vanSessionDetail.returnsLabel'), value: formatCurrency(session.total_returned_value || 0), sub: `${totalReturnedQty} ${t('vanSessionDetail.unitsReturned')}` },
            ].map((kpi, i) => {
              const hoverMap: Record<string, string> = {
                blue: 'hover:bg-blue-50/30 dark:hover:bg-blue-900/20',
                green: 'hover:bg-green-50/30 dark:hover:bg-green-900/20',
                emerald: 'hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20',
                red: 'hover:bg-red-50/30 dark:hover:bg-red-900/20',
                orange: 'hover:bg-orange-50/30 dark:hover:bg-orange-900/20',
              };
              const barMap: Record<string, string> = { blue: 'bg-blue-500', green: 'bg-green-500', emerald: 'bg-emerald-500', red: 'bg-red-500', orange: 'bg-orange-500' };
              const iconMap: Record<string, string> = { blue: 'text-blue-500', green: 'text-green-500', emerald: 'text-emerald-500', red: 'text-red-500', orange: 'text-orange-500' };
              const valMap: Record<string, string> = {
                blue: 'text-blue-600 dark:text-blue-400',
                green: 'text-green-600 dark:text-green-400',
                emerald: 'text-emerald-600 dark:text-emerald-400',
                red: 'text-red-600 dark:text-red-400',
                orange: 'text-orange-600 dark:text-orange-400',
              };
              return (
                <div key={i} className={`group relative px-4 py-4 text-center transition-colors ${hoverMap[kpi.color]}`}>
                  <div className={`absolute top-0 right-0 left-0 h-[3px] ${barMap[kpi.color]} scale-x-0 group-hover:scale-x-100 transition-transform origin-center`} />
                  <kpi.icon className={`w-5 h-5 mx-auto mb-1.5 ${iconMap[kpi.color]}`} />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">{kpi.label}</p>
                  <p className={`text-lg font-bold ${valMap[kpi.color]}`}>{kpi.value}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{kpi.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Performance Bars ─── */}
      {(session.status === 'active' || session.status === 'completed') && totalLoadedQty > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center">
                <ChartBarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{t('vanSessionDetail.performanceRates')}</span>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">{t('vanSessionDetail.sellRate')}</span>
                <span className="font-bold text-green-600 dark:text-green-400">{formatPercent(sellThrough)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(sellThrough, 100)}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{totalSoldQty} / {totalLoadedQty} {t('vanSessionDetail.unit')}</div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">{t('vanSessionDetail.collectionRate')}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPercent(collectionRate)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-emerald-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{formatCurrency(collectedValue)} / {formatCurrency(soldValue)}</div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">{t('vanSessionDetail.remainingStock')}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{totalLoadedQty > 0 ? formatPercent((totalAvailableQty / totalLoadedQty) * 100) : '0%'}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${totalLoadedQty > 0 ? Math.min((totalAvailableQty / totalLoadedQty) * 100, 100) : 0}%` }} />
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{totalAvailableQty} {t('vanSessionDetail.unitsRemaining')}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tabs ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden" data-tour="vssd-tabs">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-1">
          {([
            { key: 'overview' as const, icon: ChartBarIcon, count: null },
            { key: 'items' as const, icon: CubeIcon, count: items.length },
            { key: 'sales' as const, icon: ShoppingCartIcon, count: sales.length },
            { key: 'returns' as const, icon: ArrowUturnLeftIcon, count: returns.length || (session.status === 'active' ? items.filter(i => roundQty(i.quantity_loaded - i.quantity_sold) > 0).length : 0) },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-500/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.key === 'overview' ? t('vanSessionDetail.tabOverview') : tab.key === 'items' ? t('vanSessionDetail.tabItems') : tab.key === 'sales' ? t('vanSessionDetail.tabSales') : t('vanSessionDetail.tabReturns')}
              {tab.count !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="p-5 space-y-6">
              {/* Timeline */}
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{t('vanSessionDetail.timeline')}</span>
                </div>
                <div className="relative">
                  <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-4' : 'left-4'} w-0.5 bg-gray-200 dark:bg-gray-700`} />
                  <div className="space-y-6">
                    <div className="relative flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500 flex items-center justify-center z-10 flex-shrink-0">
                        <PlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{t('vanSessionDetail.sessionCreated')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(session.created_at)}</div>
                      </div>
                    </div>
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border-2 ${session.started_at ? 'bg-green-100 dark:bg-green-900/30 border-green-500' : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'}`}>
                        <PlayIcon className={`w-4 h-4 ${session.started_at ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${session.started_at ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                          {t('vanSessionDetail.receiveGoodsAndStartSelling')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.started_at ? formatDateTime(session.started_at) : t('vanSessionDetail.awaitingReceive')}
                        </div>
                      </div>
                    </div>
                    {sales.length > 0 && (
                      <div className="relative flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500 flex items-center justify-center z-10 flex-shrink-0">
                          <ShoppingCartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{sales.length} {t('vanSessionDetail.salesOperations')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t('vanSessionDetail.totalLabel')} {formatCurrency(soldValue)} - {t('vanSessionDetail.collected')} {formatCurrency(collectedValue)}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="relative flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 flex-shrink-0 border-2 ${
                        session.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500' :
                        session.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900/30 border-red-500' :
                        'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      }`}>
                        {session.status === 'cancelled'
                          ? <XMarkIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                          : <CheckCircleIcon className={`w-4 h-4 ${session.status === 'completed' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                        }
                      </div>
                      <div>
                        <div className={`font-medium text-sm ${(session.status === 'completed' || session.status === 'cancelled') ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                          {session.status === 'cancelled' ? t('vanSessionDetail.sessionCancelled') : t('vanSessionDetail.endSessionAndReturnRemaining')}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.completed_at ? formatDateTime(session.completed_at) : session.status === 'cancelled' ? t('vanSessionDetail.cancelled') : t('vanSessionDetail.notEndedYet')}
                        </div>
                        {getDuration() && session.status === 'completed' && (
                          <div className="text-xs text-teal-500 mt-0.5">{t('vanSessionDetail.totalDuration')} {getDuration()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Products */}
              {items.length > 0 && (session.status === 'active' || session.status === 'completed') && (
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                      <ChartBarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{t('vanSessionDetail.productPerformance')}</span>
                  </div>
                  <div className="space-y-3">
                    {[...items].sort((a, b) => b.quantity_sold - a.quantity_sold).slice(0, 8).map(item => {
                      const pct = item.quantity_loaded > 0 ? (item.quantity_sold / item.quantity_loaded) * 100 : 0;
                      return (
                        <div key={item.id}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium text-gray-900 dark:text-white truncate me-4">{item.product?.name || `${t('vanSessionDetail.productPrefix')}${item.product_id}`}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{item.quantity_sold} / {item.quantity_loaded}</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct > 0 ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                              style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
                      <DocumentTextIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{t('vanSessionDetail.notes')}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm whitespace-pre-wrap leading-relaxed">{session.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Items Tab ── */}
          {activeTab === 'items' && (
            <div className="overflow-x-auto">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                    <CubeIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{t('vanSessionDetail.noProductsInSession')}</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                      <th className="px-5 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                      <th className={`px-4 py-3 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessionDetail.product')}</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.quantityLoaded')}</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.sold')}</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.returned')}</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.available')}</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.unitCost')}</th>
                      <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.loadedValueHeader')}</th>
                      {(session.status === 'active' || session.status === 'completed') && (
                        <th className="px-4 py-3 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.sellRateHeader')}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {items.map((item, idx) => {
                      const available = roundQty(item.quantity_loaded - item.quantity_sold - item.quantity_returned);
                      const pct = item.quantity_loaded > 0 ? (item.quantity_sold / item.quantity_loaded) * 100 : 0;
                      return (
                        <tr key={item.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
                          <td className="px-5 py-3.5 text-center text-sm text-gray-400 dark:text-gray-500">{idx + 1}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.product?.name || `${t('vanSessionDetail.productPrefix')}${item.product_id}`}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-700 dark:text-gray-300">{roundQty(item.quantity_loaded)}</td>
                          <td className="px-4 py-3.5 text-center text-sm text-green-600 dark:text-green-400 font-medium">{roundQty(item.quantity_sold)}</td>
                          <td className="px-4 py-3.5 text-center text-sm text-orange-600 dark:text-orange-400">{roundQty(item.quantity_returned)}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-sm font-medium ${available > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{available}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm text-gray-500 dark:text-gray-400">{formatCurrency(item.unit_cost)}</td>
                          <td className="px-4 py-3.5 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.quantity_loaded * item.unit_cost)}</td>
                          {(session.status === 'active' || session.status === 'completed') && (
                            <td className="px-4 py-3.5 text-center">
                              <div className="inline-flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-orange-500'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }} />
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{Math.round(pct)}%</span>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50/80 dark:bg-gray-700/50 font-bold">
                      <td colSpan={2} className="px-5 py-3 text-start text-sm text-gray-900 dark:text-white">{t('vanSessionDetail.totalFooter')}</td>
                      <td className="px-4 py-3 text-center text-sm">{totalLoadedQty}</td>
                      <td className="px-4 py-3 text-center text-sm text-green-600 dark:text-green-400">{totalSoldQty}</td>
                      <td className="px-4 py-3 text-center text-sm text-orange-600 dark:text-orange-400">{totalReturnedQty}</td>
                      <td className="px-4 py-3 text-center text-sm text-blue-600 dark:text-blue-400">{totalAvailableQty}</td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">{formatCurrency(loadedValue)}</td>
                      {(session.status === 'active' || session.status === 'completed') && (
                        <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{formatPercent(sellThrough)}</td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}

          {/* ── Sales Tab ── */}
          {activeTab === 'sales' && (
            <div>
              {sales.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                    <ShoppingCartIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">{t('vanSessionDetail.noSalesYet')}</p>
                </div>
              ) : (
                <div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sales.map((sale, idx) => {
                      const pConfig = paymentStatusLabels[sale.payment_status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: QuestionMarkCircleIcon, label: sale.payment_status };
                      const PayIcon = pConfig.icon;
                      const isExpanded = expandedSale === sale.id;
                      return (
                        <div key={sale.id}>
                          <button
                            onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors text-start"
                          >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-500 dark:text-gray-400">
                                {idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{sale.client?.name || t('vanSessionDetail.cashSale')}</span>
                                  {sale.reference && <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">({sale.reference})</span>}
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium ${pConfig.bg} ${pConfig.text}`}>
                                    <PayIcon className="w-3 h-3" />
                                    {pConfig.label}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
                                  <span>{formatDateTime(sale.sale_time || sale.created_at)}</span>
                                  {sale.latitude && sale.longitude && (
                                    <span className="text-blue-500 dark:text-blue-400 flex items-center gap-0.5">
                                      <MapPinIcon className="w-3 h-3" />
                                      {t('vanSessionDetail.gpsLocation')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 flex-shrink-0">
                              <div className="text-end">
                                <div className="font-bold text-sm text-gray-900 dark:text-white">{formatCurrency(sale.grand_total)}</div>
                                {sale.due_amount > 0 && (
                                  <div className="text-[11px] text-red-500 dark:text-red-400">{t('vanSessionDetail.remaining')} {formatCurrency(sale.due_amount)}</div>
                                )}
                              </div>
                              <ChevronDownIcon className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                              <div className="px-5 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm border-b border-gray-100 dark:border-gray-700">
                                <div>
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.totalAmount')}</span>
                                  <div className="font-bold text-gray-900 dark:text-white">{formatCurrency(sale.total_amount)}</div>
                                </div>
                                {sale.discount > 0 && (
                                  <div>
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.discount')}</span>
                                    <div className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(sale.discount)}</div>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.paidAmount')}</span>
                                  <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.paid_amount)}</div>
                                </div>
                                <div>
                                  <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.remainingAmount')}</span>
                                  <div className={`font-bold ${sale.due_amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>{formatCurrency(sale.due_amount)}</div>
                                </div>
                              </div>
                              {sale.items && sale.items.length > 0 && (
                                <div className="px-5 py-3">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr>
                                        <th className={`${isRTL ? 'text-right' : 'text-left'} pb-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessionDetail.product')}</th>
                                        <th className="text-center pb-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.quantity')}</th>
                                        <th className="text-center pb-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.price')}</th>
                                        {sale.items.some(si => si.discount > 0) && <th className="text-center pb-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.discount')}</th>}
                                        <th className="text-end pb-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.subtotal')}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {sale.items.map(si => (
                                        <tr key={si.id} className="border-t border-gray-100 dark:border-gray-700">
                                          <td className="py-2 font-medium text-gray-900 dark:text-white">{si.product?.name || `${t('vanSessionDetail.productPrefix')}${si.product_id}`}</td>
                                          <td className="py-2 text-center text-gray-700 dark:text-gray-300">{si.quantity}</td>
                                          <td className="py-2 text-center text-gray-500 dark:text-gray-400">{formatCurrency(si.unit_price)}</td>
                                          {sale.items!.some(si2 => si2.discount > 0) && (
                                            <td className="py-2 text-center text-orange-500 dark:text-orange-400">{si.discount > 0 ? formatCurrency(si.discount) : '-'}</td>
                                          )}
                                          <td className="py-2 text-end font-medium text-gray-900 dark:text-white">{formatCurrency(si.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {(sale.notes || (sale.latitude && sale.longitude)) && (
                                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                                  {sale.notes && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400"><span className="font-medium">{t('vanSessionDetail.noteLabel')}</span> {sale.notes}</span>
                                  )}
                                  {sale.latitude && sale.longitude && (
                                    <a href={`https://www.google.com/maps?q=${sale.latitude},${sale.longitude}`} target="_blank" rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
                                      <MapPinIcon className="w-3.5 h-3.5" />
                                      {t('vanSessionDetail.viewOnMap')}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Sales Totals */}
                  <div className="px-5 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.invoiceCountLabel')}</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{sales.length}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.totalSalesLabel')}</div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(sales.reduce((s, sale) => s + sale.grand_total, 0))}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.totalCollectedLabel')}</div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(sales.reduce((s, sale) => s + sale.paid_amount, 0))}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.totalCreditLabel')}</div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(sales.reduce((s, sale) => s + sale.due_amount, 0))}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Returns Tab ── */}
          {activeTab === 'returns' && (
            <div>
              {/* Active session: unsold products preview */}
              {session.status === 'active' && items.length > 0 && (
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                      <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('vanSessionDetail.unsoldProductsPreview')}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('vanSessionDetail.unsoldProductsDescription')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                      { color: 'blue', label: t('vanSessionDetail.loaded'), value: totalLoadedQty },
                      { color: 'green', label: t('vanSessionDetail.soldLabel'), value: totalSoldQty },
                      { color: 'orange', label: t('vanSessionDetail.willBeReturned'), value: totalAvailableQty },
                      { color: 'purple', label: t('vanSessionDetail.sellRateLabel'), value: formatPercent(sellThrough) },
                    ].map((card, i) => {
                      const bgMap: Record<string, string> = {
                        blue: 'bg-blue-50 dark:bg-blue-900/20', green: 'bg-green-50 dark:bg-green-900/20',
                        orange: 'bg-orange-50 dark:bg-orange-900/20', purple: 'bg-purple-50 dark:bg-purple-900/20',
                      };
                      const textMap: Record<string, string> = {
                        blue: 'text-blue-600 dark:text-blue-400', green: 'text-green-600 dark:text-green-400',
                        orange: 'text-orange-600 dark:text-orange-400', purple: 'text-purple-600 dark:text-purple-400',
                      };
                      const valMap: Record<string, string> = {
                        blue: 'text-blue-700 dark:text-blue-300', green: 'text-green-700 dark:text-green-300',
                        orange: 'text-orange-700 dark:text-orange-300', purple: 'text-purple-700 dark:text-purple-300',
                      };
                      return (
                        <div key={i} className={`${bgMap[card.color]} rounded-xl p-3 text-center`}>
                          <div className={`text-xs ${textMap[card.color]}`}>{card.label}</div>
                          <div className={`text-lg font-bold ${valMap[card.color]}`}>{card.value}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                          <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                          <th className={`px-4 py-2.5 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessionDetail.product')}</th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.quantityLoaded')}</th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.sold')}</th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.willBeReturned')}</th>
                          <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.sellRateLabel')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {items.map((item, idx) => {
                          const unsold = roundQty(item.quantity_loaded - item.quantity_sold);
                          const pct = item.quantity_loaded > 0 ? (item.quantity_sold / item.quantity_loaded) * 100 : 0;
                          return (
                            <tr key={item.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors ${unsold > 0 ? '' : 'opacity-50'}`}>
                              <td className="px-4 py-2.5 text-center text-sm text-gray-400">{idx + 1}</td>
                              <td className="px-4 py-2.5 font-medium text-sm text-gray-900 dark:text-white">{item.product?.name || `${t('vanSessionDetail.productPrefix')}${item.product_id}`}</td>
                              <td className="px-4 py-2.5 text-center text-sm">{roundQty(item.quantity_loaded)}</td>
                              <td className="px-4 py-2.5 text-center text-sm text-green-600 dark:text-green-400 font-medium">{roundQty(item.quantity_sold)}</td>
                              <td className="px-4 py-2.5 text-center text-sm"><span className={`font-bold ${unsold > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>{unsold}</span></td>
                              <td className="px-4 py-2.5 text-center">
                                <div className="inline-flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8">{Math.round(pct)}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50/80 dark:bg-gray-700/50 font-bold">
                          <td colSpan={2} className="px-4 py-2.5 text-start text-sm text-gray-900 dark:text-white">{t('vanSessionDetail.totalFooter')}</td>
                          <td className="px-4 py-2.5 text-center text-sm">{totalLoadedQty}</td>
                          <td className="px-4 py-2.5 text-center text-sm text-green-600 dark:text-green-400">{totalSoldQty}</td>
                          <td className="px-4 py-2.5 text-center text-sm text-orange-600 dark:text-orange-400">{totalAvailableQty}</td>
                          <td className="px-4 py-2.5 text-center text-sm text-gray-500 dark:text-gray-400">{formatPercent(sellThrough)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Registered returns */}
              <div className="p-5">
                {session.status === 'completed' && (
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                      <ArrowUturnLeftIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{t('vanSessionDetail.registeredReturns')}</span>
                  </div>
                )}
                {returns.length === 0 && session.status !== 'active' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                      <ArrowUturnLeftIcon className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('vanSessionDetail.noRegisteredReturns')}</p>
                  </div>
                ) : returns.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        { color: 'gray', label: t('vanSessionDetail.totalReturns'), value: `${roundQty(returns.reduce((s, r) => s + r.quantity, 0))} ${t('vanSessionDetail.unit')}` },
                        { color: 'yellow', label: t('vanSessionDetail.unsoldSummary'), value: roundQty(returns.filter(r => r.reason === 'unsold').reduce((s, r) => s + r.quantity, 0)) },
                        { color: 'red', label: t('vanSessionDetail.damagedExpired'), value: roundQty(returns.filter(r => r.reason === 'damaged' || r.reason === 'expired').reduce((s, r) => s + r.quantity, 0)) },
                        { color: 'green', label: t('vanSessionDetail.returnableToStock'), value: roundQty(returns.filter(r => r.returnable_to_stock).reduce((s, r) => s + r.quantity, 0)) },
                      ].map((card, i) => {
                        const bgMap: Record<string, string> = {
                          gray: 'bg-gray-50 dark:bg-gray-700/50', yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
                          red: 'bg-red-50 dark:bg-red-900/20', green: 'bg-green-50 dark:bg-green-900/20',
                        };
                        const textMap: Record<string, string> = {
                          gray: 'text-gray-500 dark:text-gray-400', yellow: 'text-yellow-600 dark:text-yellow-400',
                          red: 'text-red-600 dark:text-red-400', green: 'text-green-600 dark:text-green-400',
                        };
                        const valMap: Record<string, string> = {
                          gray: 'text-gray-900 dark:text-white', yellow: 'text-yellow-700 dark:text-yellow-300',
                          red: 'text-red-700 dark:text-red-300', green: 'text-green-700 dark:text-green-300',
                        };
                        return (
                          <div key={i} className={`${bgMap[card.color]} rounded-xl p-3 text-center`}>
                            <div className={`text-xs ${textMap[card.color]}`}>{card.label}</div>
                            <div className={`text-lg font-bold ${valMap[card.color]}`}>{card.value}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50/80 dark:bg-gray-700/50">
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                            <th className={`px-4 py-2.5 ${isRTL ? 'text-right' : 'text-left'} text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('vanSessionDetail.product')}</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.quantity')}</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.reason')}</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.returnable')}</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.status')}</th>
                            <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('vanSessionDetail.notesHeader')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {returns.map((ret, idx) => {
                            const reasonConfig: Record<string, string> = {
                              unsold: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
                              damaged: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                              expired: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                            };
                            return (
                              <tr key={ret.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors">
                                <td className="px-4 py-3 text-center text-sm text-gray-400">{idx + 1}</td>
                                <td className="px-4 py-3 font-medium text-sm text-gray-900 dark:text-white">{ret.product?.name || `${t('vanSessionDetail.productPrefix')}${ret.product_id}`}</td>
                                <td className="px-4 py-3 text-center text-sm font-bold">{roundQty(ret.quantity)}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium ${reasonConfig[ret.reason] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                                    {returnReasonLabels[ret.reason] || ret.reason}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ret.returnable_to_stock ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-100 dark:border-green-800">
                                      <CheckCircleIcon className="w-3 h-3" />{t('vanSessionDetail.yes')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800">
                                      <XCircleIcon className="w-3 h-3" />{t('vanSessionDetail.no')}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {ret.processed ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                      <CheckCircleIcon className="w-3 h-3" />{t('vanSessionDetail.processed')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                      <ClockIcon className="w-3 h-3" />{t('vanSessionDetail.pending')}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">{ret.notes || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog isOpen={showStartConfirm} onClose={() => setShowStartConfirm(false)} onConfirm={handleStart}
        title={t('vanSessionDetail.confirmReceiveTitle')} message={t('vanSessionDetail.confirmReceiveMessage')}
        confirmText={t('vanSessionDetail.confirmReceiveButton')} isLoading={isActioning} variant="info" />
      <ConfirmDialog isOpen={showCompleteConfirm} onClose={() => setShowCompleteConfirm(false)} onConfirm={handleComplete}
        title={t('vanSessionDetail.confirmEndTitle')} message={t('vanSessionDetail.confirmEndMessage')}
        confirmText={t('vanSessionDetail.confirmEndButton')} isLoading={isActioning} variant="warning" />
      <ConfirmDialog isOpen={showCancelConfirm} onClose={() => setShowCancelConfirm(false)} onConfirm={handleCancel}
        title={t('vanSessionDetail.confirmCancelTitle')} message={t('vanSessionDetail.confirmCancelMessage')}
        confirmText={t('vanSessionDetail.confirmCancelButton')} isLoading={isActioning} />

      {/* Settlement Dialog */}
      {showSettleDialog && driverCaisse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" dir={dir}>
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                  <BanknotesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('vanSessionDetail.collectFromDriverCaisse')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{session.livreur?.name}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 mb-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">{t('vanSessionDetail.currentBalance')}</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(driverCaisse.balance)}</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSessionDetail.amountToCollect')}</label>
                <input type="number" value={settleAmount} onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2.5 text-lg font-bold rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="0.00" min="0.01" max={driverCaisse.balance} step="0.01" />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setSettleAmount(String(driverCaisse.balance))}
                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 font-medium transition-colors">
                    {t('vanSessionDetail.fullBalance')}
                  </button>
                  {collectedValue > 0 && (
                    <button type="button" onClick={() => setSettleAmount(String(collectedValue))}
                      className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium transition-colors">
                      {t('vanSessionDetail.collectedCashAmount')} ({formatCurrency(collectedValue)})
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">{t('vanSessionDetail.notesOptional')}</label>
                <input type="text" value={settleNotes} onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder={`${t('vanSessionDetail.collectFromSession')} ${session.reference || session.id}`} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSettle} disabled={isSettling || !settleAmount || parseFloat(settleAmount) <= 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50">
                  {isSettling ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                  {t('vanSessionDetail.collectPrefix')} {settleAmount ? formatCurrency(parseFloat(settleAmount) || 0) : ''}
                </button>
                <button onClick={() => { setShowSettleDialog(false); setDriverCaisse(null); }} disabled={isSettling}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  {t('vanSessionDetail.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour steps={tourSteps} onComplete={() => setShowTour(false)} storageKey="van_session_detail_tour_step" />
      )}
    </div>
  );
}
