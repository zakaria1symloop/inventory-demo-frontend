'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { deliveriesApi, warehousesApi } from '@/lib/api';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  TruckIcon,
  UserIcon,
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CubeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  PlayIcon,
  BuildingStorefrontIcon,
  IdentificationIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface OrderItem {
  id: number;
  product_id: number;
  quantity_ordered: number;
  quantity_confirmed: number;
  quantity_delivered: number;
  quantity_returned: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    barcode?: string;
    pieces_per_package?: number;
  };
}

interface DeliveryOrder {
  id: number;
  order_id: number;
  client_id: number;
  delivery_order: number;
  status: string;
  amount_due: number;
  amount_collected: number;
  delivered_at?: string;
  attempted_at?: string;
  failure_reason?: string;
  notes?: string;
  order?: {
    id: number;
    reference: string;
    items?: OrderItem[];
  };
  client?: {
    id: number;
    name: string;
    phone?: string;
    address?: string;
  };
}

interface DeliveryReturn {
  id: number;
  product_id: number;
  quantity: number;
  reason: string;
  returnable_to_stock: boolean;
  loss_amount: number;
  processed: boolean;
  product?: {
    id: number;
    name: string;
    pieces_per_package?: number;
  };
}

interface Delivery {
  id: number;
  reference: string;
  date: string;
  status: string;
  total_orders: number;
  delivered_count: number;
  failed_count: number;
  total_amount: number;
  collected_amount: number;
  start_time?: string;
  end_time?: string;
  notes?: string;
  livreur?: { id: number; name: string };
  vehicle?: { id: number; name: string; plate_number: string };
  warehouse?: { id: number; name: string };
  delivery_orders?: DeliveryOrder[];
  returns?: DeliveryReturn[];
}

export default function DeliveryDetail() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const params = useParams();
  const [id, setId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [showTour, setShowTour] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Returns processing state
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingReturnId, setProcessingReturnId] = useState<number | null>(null);

  const [isStarting, setIsStarting] = useState(false);

  const BackArrowIcon = isRTL ? ArrowRightIcon : ArrowLeftIcon;

  const tourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="dd-header"]', title: t('deliveryDetail.tourHeaderTitle'), desc: t('deliveryDetail.tourHeaderDesc'), position: 'bottom' as const },
    { target: '[data-tour="dd-info"]', title: t('deliveryDetail.tourInfoTitle'), desc: t('deliveryDetail.tourInfoDesc'), position: 'bottom' as const },
    { target: '[data-tour="dd-kpi"]', title: t('deliveryDetail.tourKpiTitle'), desc: t('deliveryDetail.tourKpiDesc'), position: 'bottom' as const },
    { target: '[data-tour="dd-orders"]', title: t('deliveryDetail.tourOrdersTitle'), desc: t('deliveryDetail.tourOrdersDesc'), position: 'top' as const },
  ], [t]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; darkBg: string; text: string; darkText: string; icon: typeof ClockIcon; label: string; color: string }> = {
      preparing: { bg: 'bg-amber-100', darkBg: 'dark:bg-amber-900/30', text: 'text-amber-800', darkText: 'dark:text-amber-300', icon: ClockIcon, label: t('deliveryDetail.statusPreparing'), color: 'amber' },
      in_progress: { bg: 'bg-blue-100', darkBg: 'dark:bg-blue-900/30', text: 'text-blue-800', darkText: 'dark:text-blue-300', icon: TruckIcon, label: t('deliveryDetail.statusInProgress'), color: 'blue' },
      completed: { bg: 'bg-green-100', darkBg: 'dark:bg-green-900/30', text: 'text-green-800', darkText: 'dark:text-green-300', icon: CheckCircleIcon, label: t('deliveryDetail.statusCompleted'), color: 'green' },
      cancelled: { bg: 'bg-red-100', darkBg: 'dark:bg-red-900/30', text: 'text-red-800', darkText: 'dark:text-red-300', icon: XCircleIcon, label: t('deliveryDetail.statusCancelled'), color: 'red' },
    };
    return configs[status] || configs.preparing;
  };

  const getOrderStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: typeof ClockIcon; label: string }> = {
      pending: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', icon: ClockIcon, label: t('deliveryDetail.orderPending') },
      delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: CheckCircleIcon, label: t('deliveryDetail.orderDelivered') },
      partial: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: CubeIcon, label: t('deliveryDetail.orderPartial') },
      failed: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: XCircleIcon, label: t('deliveryDetail.orderFailed') },
      postponed: { bg: 'bg-gray-100 dark:bg-gray-700/50', text: 'text-gray-700 dark:text-gray-300', icon: ClockIcon, label: t('deliveryDetail.orderPostponed') },
    };
    return configs[status] || configs.pending;
  };

  const returnReasonLabels = useMemo(() => ({
    refused: t('deliveryDetail.reasonRefused'),
    damaged: t('deliveryDetail.reasonDamaged'),
    excess: t('deliveryDetail.reasonExcess'),
    store_closed: t('deliveryDetail.reasonStoreClosed'),
    wrong: t('deliveryDetail.reasonWrong'),
    other: t('deliveryDetail.reasonOther'),
  } as Record<string, string>), [t]);

  // Extract ID from URL for static export compatibility
  useEffect(() => {
    const paramId = params.id as string;
    if (paramId && paramId !== '_') {
      setId(paramId);
    } else if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlId = pathParts[pathParts.length - 1];
      if (urlId && urlId !== '_') {
        setId(urlId);
      }
    }
  }, [params.id]);

  useEffect(() => {
    if (id) {
      fetchDelivery();
      fetchWarehouses();
    }
  }, [id]);

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesApi.getAll();
      setWarehouses(response.data.data || response.data || []);
      if (delivery?.warehouse?.id) {
        setSelectedWarehouse(delivery.warehouse.id);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchDelivery = async () => {
    if (!id) return;
    try {
      const response = await deliveriesApi.getOne(parseInt(id));
      setDelivery(response.data.data || response.data);
    } catch {
      toast.error(t('deliveryDetail.errorLoadingData'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);

  const formatDate = (date: string) => {
    if (!date) return t('deliveryDetail.noData');
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ');
  };

  const formatDateTime = (date: string) => {
    if (!date) return t('deliveryDetail.noData');
    return new Date(date).toLocaleString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ');
  };

  const toggleExpand = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const openPaymentModal = (order: DeliveryOrder) => {
    const remaining = order.amount_due - order.amount_collected;
    setSelectedOrder(order);
    setPaymentAmount(remaining.toString());
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !delivery) return;

    const amount = parseFloat(paymentAmount);
    const remaining = selectedOrder.amount_due - selectedOrder.amount_collected;

    if (isNaN(amount) || amount <= 0) {
      toast.error(t('deliveryDetail.enterValidAmount'));
      return;
    }

    if (amount > remaining) {
      toast.error(t('deliveryDetail.amountExceedsRemaining'));
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await deliveriesApi.collectPayment(delivery.id, selectedOrder.id, {
        amount,
        notes: paymentNotes,
      });
      toast.success(t('deliveryDetail.paymentSuccess'));
      setShowPaymentModal(false);
      fetchDelivery();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('deliveryDetail.paymentError');
      toast.error(message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePayFull = async (order: DeliveryOrder) => {
    if (!delivery) return;
    const remaining = order.amount_due - order.amount_collected;
    if (!confirm(t('deliveryDetail.confirmPayFull').replace('{amount}', formatCurrency(remaining)))) return;

    try {
      await deliveriesApi.collectPayment(delivery.id, order.id, {
        amount: remaining,
        notes: t('deliveryDetail.fullPaymentNote'),
      });
      toast.success(t('deliveryDetail.paymentSuccess'));
      fetchDelivery();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('deliveryDetail.paymentError');
      toast.error(message);
    }
  };

  const openProcessModal = (returnId?: number) => {
    if (delivery?.warehouse?.id) {
      setSelectedWarehouse(delivery.warehouse.id);
    }
    setProcessingReturnId(returnId || null);
    setShowProcessModal(true);
  };

  const handleProcessReturns = async () => {
    if (!delivery || !selectedWarehouse) {
      toast.error(t('deliveryDetail.selectWarehouseError'));
      return;
    }

    setIsProcessing(true);
    try {
      if (processingReturnId) {
        await deliveriesApi.processReturn(delivery.id, processingReturnId, {
          warehouse_id: selectedWarehouse,
        });
        toast.success(t('deliveryDetail.processReturnSuccess'));
      } else {
        await deliveriesApi.processReturns(delivery.id, {
          warehouse_id: selectedWarehouse,
        });
        toast.success(t('deliveryDetail.processAllReturnsSuccess'));
      }
      setShowProcessModal(false);
      fetchDelivery();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('deliveryDetail.processReturnError');
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!delivery) return;
    if (!confirm(t('deliveryDetail.confirmStartDelivery'))) return;
    setIsStarting(true);
    try {
      await deliveriesApi.start(delivery.id);
      toast.success(t('deliveryDetail.startSuccess'));
      fetchDelivery();
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || t('deliveryDetail.startError');
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  if (!delivery) return <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('deliveryDetail.notFound')}</div>;

  const statusConfig = getStatusConfig(delivery.status);
  const StatusIcon = statusConfig.icon;
  const uncollectedAmount = (Number(delivery.total_amount) || 0) - (Number(delivery.collected_amount) || 0);
  const collectionRate = Number(delivery.total_amount) > 0 ? ((Number(delivery.collected_amount) || 0) / Number(delivery.total_amount)) * 100 : 0;
  const totalDelivered = delivery.delivery_orders?.filter(o => ['delivered', 'partial'].includes(o.status)).length || 0;
  const totalReturns = delivery.returns?.length || 0;
  const totalLoss = delivery.returns?.filter(r => !r.returnable_to_stock).reduce((sum, r) => sum + (r.loss_amount || 0), 0) || 0;

  return (
    <div className="space-y-5">
      {/* ───── Header ───── */}
      <div data-tour="dd-header" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/deliveries" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <BackArrowIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </Link>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{delivery.reference}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.darkBg} ${statusConfig.text} ${statusConfig.darkText}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('deliveryDetail.dateLabel')} {formatDate(delivery.date)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowTour(true)} className="text-sm font-medium text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors">
            {t('deliveryDetail.tourBtn')}
          </button>

          {delivery.status === 'preparing' && (
            <button
              onClick={handleStartDelivery}
              disabled={isStarting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {isStarting ? <div className="spinner w-4 h-4 border-white"></div> : <PlayIcon className="w-4 h-4" />}
              {isStarting ? t('deliveryDetail.starting') : t('deliveryDetail.startDelivery')}
            </button>
          )}

          <button onClick={fetchDelivery} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <ArrowPathIcon className="w-4 h-4" />
            {t('deliveryDetail.refresh')}
          </button>
        </div>
      </div>

      {/* ───── Info Cards ───── */}
      <div data-tour="dd-info" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { icon: UserIcon, label: t('deliveryDetail.driver'), value: delivery.livreur?.name || t('deliveryDetail.noData'), color: 'blue' },
          { icon: TruckIcon, label: t('deliveryDetail.vehicle'), value: delivery.vehicle?.name || t('deliveryDetail.noData'), color: 'purple' },
          { icon: BuildingStorefrontIcon, label: t('deliveryDetail.warehouse'), value: delivery.warehouse?.name || t('deliveryDetail.noData'), color: 'indigo' },
          { icon: IdentificationIcon, label: t('deliveryDetail.plateNumber'), value: delivery.vehicle?.plate_number || t('deliveryDetail.noData'), color: 'emerald' },
          { icon: ClockIcon, label: t('deliveryDetail.startTime'), value: delivery.start_time ? formatDateTime(delivery.start_time) : t('deliveryDetail.noData'), color: 'orange' },
          { icon: ClockIcon, label: t('deliveryDetail.endTime'), value: delivery.end_time ? formatDateTime(delivery.end_time) : t('deliveryDetail.noData'), color: 'rose' },
        ].map((card, i) => {
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400',
            purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400',
            indigo: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400',
            emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
            orange: 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400',
            rose: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400',
          };
          return (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${colorMap[card.color]}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{card.label}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ───── Financial KPI Strip ───── */}
      <div data-tour="dd-kpi" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 ${isRTL ? 'divide-x-reverse' : ''} divide-x divide-gray-100 dark:divide-gray-700`}>
          {[
            { icon: BanknotesIcon, label: t('deliveryDetail.totalAmount'), value: formatCurrency(Number(delivery.total_amount) || 0), color: 'blue', bar: 'bg-blue-500' },
            { icon: CheckCircleIcon, label: t('deliveryDetail.collected'), value: formatCurrency(Number(delivery.collected_amount) || 0), color: 'green', bar: 'bg-green-500' },
            { icon: XCircleIcon, label: t('deliveryDetail.remaining'), value: formatCurrency(uncollectedAmount), color: 'red', bar: 'bg-red-500' },
            { icon: ChartBarIcon, label: t('deliveryDetail.collectionRate'), value: `${collectionRate.toFixed(0)}%`, color: 'indigo', bar: 'bg-indigo-500' },
            { icon: ExclamationTriangleIcon, label: t('deliveryDetail.totalLoss'), value: formatCurrency(totalLoss), color: 'orange', bar: 'bg-orange-500' },
          ].map((kpi, i) => {
            const textColor: Record<string, string> = {
              blue: 'text-blue-600 dark:text-blue-400',
              green: 'text-green-600 dark:text-green-400',
              red: 'text-red-600 dark:text-red-400',
              indigo: 'text-indigo-600 dark:text-indigo-400',
              orange: 'text-orange-600 dark:text-orange-400',
            };
            return (
              <div key={i} className="group relative p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                <div className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-full h-[3px] ${kpi.bar} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-${isRTL ? 'right' : 'left'}`} />
                <div className="flex items-center gap-2 mb-1">
                  <kpi.icon className={`w-4 h-4 ${textColor[kpi.color]}`} />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{kpi.label}</span>
                </div>
                <p className={`text-lg font-bold ${textColor[kpi.color]}`}>{kpi.value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── Order Stats Strip ───── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { value: delivery.total_orders, label: t('deliveryDetail.totalOrders'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { value: totalDelivered, label: t('deliveryDetail.deliveredCount'), color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { value: delivery.failed_count || 0, label: t('deliveryDetail.failedPostponed'), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
          { value: totalReturns, label: t('deliveryDetail.returnsCount'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-2xl border border-gray-200/60 dark:border-gray-700 p-4 text-center`}>
            <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ───── Delivery Orders ───── */}
      <div data-tour="dd-orders" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
              <CubeIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="font-bold text-gray-800 dark:text-gray-100">{t('deliveryDetail.orderDetails')}</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              {delivery.delivery_orders?.length || 0}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {delivery.delivery_orders?.map((order) => {
            const orderStatus = getOrderStatusConfig(order.status);
            const OrderStatusIcon = orderStatus.icon;
            const remaining = order.amount_due - order.amount_collected;
            const hasRemaining = remaining > 0;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id}>
                {/* Order Header */}
                <div
                  className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors ${isExpanded ? 'bg-gray-50/80 dark:bg-gray-700/30' : ''}`}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-sm text-gray-600 dark:text-gray-300">
                      {order.delivery_order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-gray-100">{order.order?.reference || t('deliveryDetail.noData')}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${orderStatus.bg} ${orderStatus.text}`}>
                          <OrderStatusIcon className="w-3.5 h-3.5" />
                          {orderStatus.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.client?.name} {order.client?.phone ? `• ${order.client.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="hidden sm:flex items-center gap-5">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('deliveryDetail.amountDue')}</p>
                        <p className="font-bold text-gray-800 dark:text-gray-100">{formatCurrency(order.amount_due)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('deliveryDetail.amountCollected')}</p>
                        <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(order.amount_collected)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">{t('deliveryDetail.remainingAmount')}</p>
                        <p className={`font-bold ${hasRemaining ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatCurrency(remaining)}
                        </p>
                      </div>
                    </div>

                    {hasRemaining && ['delivered', 'partial'].includes(order.status) && (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          <CurrencyDollarIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.collectBtn')}
                        </button>
                        <button
                          onClick={() => handlePayFull(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.fullPaymentBtn')}
                        </button>
                      </div>
                    )}

                    {isExpanded ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                {isExpanded && order.order?.items && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 bg-gray-50/30 dark:bg-gray-900/20">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm">
                      <CubeIcon className="w-4 h-4 text-indigo-500" />
                      {t('deliveryDetail.products')} ({order.order.items.length})
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100/80 dark:bg-gray-700/50">
                            <th className="px-3 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.product')}</th>
                            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.ordered')}</th>
                            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.delivered')}</th>
                            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.returned')}</th>
                            <th className="px-3 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.unitPrice')}</th>
                            <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.piecesPerUnit')}</th>
                            <th className="px-3 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.subtotal')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
                          {order.order.items.map((item) => {
                            const piecesPerPkg = item.product?.pieces_per_package || 1;
                            const deliveredAmount = (item.quantity_delivered || 0) * item.unit_price;
                            return (
                              <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                <td className="px-3 py-2.5">
                                  <div className="font-medium text-gray-800 dark:text-gray-100">{item.product?.name || t('deliveryDetail.noData')}</div>
                                  {item.product?.barcode && <div className="text-[10px] text-gray-400 dark:text-gray-500">{item.product.barcode}</div>}
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">
                                  <div>{formatQty(item.quantity_confirmed, piecesPerPkg)}</div>
                                  {piecesPerPkg > 1 && <div className="text-[10px] text-gray-400">{item.quantity_confirmed} {t('deliveryDetail.pieces')}</div>}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={item.quantity_delivered > 0 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'}>
                                    {formatQty(item.quantity_delivered || 0, piecesPerPkg)}
                                  </span>
                                  {piecesPerPkg > 1 && (item.quantity_delivered || 0) > 0 && (
                                    <div className="text-[10px] text-gray-400">{item.quantity_delivered} {t('deliveryDetail.pieces')}</div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={item.quantity_returned > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-400'}>
                                    {formatQty(item.quantity_returned || 0, piecesPerPkg)}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                                  {formatCurrency(item.unit_price)}
                                  {piecesPerPkg > 1 && (
                                    <div className="text-[10px] text-blue-500 dark:text-blue-400">({formatCurrency(item.unit_price * piecesPerPkg)}{t('deliveryDetail.perCarton')})</div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-center text-gray-700 dark:text-gray-300">{piecesPerPkg}</td>
                                <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                                  {formatCurrency(deliveredAmount)}
                                  {piecesPerPkg > 1 && (item.quantity_delivered || 0) > 0 && (
                                    <div className="text-[10px] text-gray-400">{item.unit_price} × {item.quantity_delivered}</div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Order Additional Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {order.delivered_at && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{t('deliveryDetail.deliveryTime')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{formatDateTime(order.delivered_at)}</p>
                        </div>
                      )}
                      {order.client?.address && (
                        <div className="col-span-2">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{t('deliveryDetail.address')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{order.client.address}</p>
                        </div>
                      )}
                      {order.failure_reason && (
                        <div className="col-span-2">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{t('deliveryDetail.failureReason')}</p>
                          <p className="font-medium text-red-600 dark:text-red-400">{order.failure_reason}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="col-span-2">
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{t('deliveryDetail.notes')}</p>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ───── Returns Section ───── */}
      {delivery.returns && delivery.returns.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <ArrowPathIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="font-bold text-gray-800 dark:text-gray-100">{t('deliveryDetail.returnsTitle')}</h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                {delivery.returns.length}
              </span>
            </div>
            {delivery.returns.some(r => !r.processed) && (
              <button
                onClick={() => openProcessModal()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98]"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                {t('deliveryDetail.processAllReturns')}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-700/30">
                  <th className="px-4 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.product')}</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.quantity')}</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.reason')}</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.returnableToStock')}</th>
                  <th className="px-4 py-2.5 text-start text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.lossAmount')}</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.status')}</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{t('deliveryDetail.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {delivery.returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{ret.product?.name || t('deliveryDetail.noData')}</td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{formatQty(ret.quantity, ret.product?.pieces_per_package)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${ret.reason === 'damaged' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'}`}>
                        {returnReasonLabels[ret.reason] || ret.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ret.returnable_to_stock ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">{t('deliveryDetail.yes')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircleIcon className="w-4 h-4" />
                          <span className="text-xs font-medium">{t('deliveryDetail.noLoss')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {ret.loss_amount > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(ret.loss_amount)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ret.processed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.processed')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.pendingStatus')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!ret.processed && (
                        <button
                          onClick={() => openProcessModal(ret.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.processReturn')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalLoss > 0 && (
                <tfoot>
                  <tr className="bg-red-50/50 dark:bg-red-900/10">
                    <td colSpan={4} className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{t('deliveryDetail.totalLosses')}</td>
                    <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{formatCurrency(totalLoss)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ───── Additional Info ───── */}
      {delivery.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <CubeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            {t('deliveryDetail.additionalInfo')}
          </h2>
          <div className="ps-11">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-xs">{t('deliveryDetail.notes')}</p>
            <p className="mt-1 text-gray-800 dark:text-gray-100">{delivery.notes}</p>
          </div>
        </div>
      )}

      {/* ───── Payment Modal ───── */}
      {showPaymentModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">{t('deliveryDetail.collectPaymentTitle')}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Order Info */}
              <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('deliveryDetail.client')}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{selectedOrder.client?.name || t('deliveryDetail.noData')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('deliveryDetail.order')}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{selectedOrder.order?.reference || t('deliveryDetail.noData')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('deliveryDetail.due')}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-100">{formatCurrency(selectedOrder.amount_due)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('deliveryDetail.alreadyCollected')}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(selectedOrder.amount_collected)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('deliveryDetail.remainingToPay')}</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatCurrency(selectedOrder.amount_due - selectedOrder.amount_collected)}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePayment}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('deliveryDetail.collectedAmountLabel')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-4 py-3 text-lg font-semibold border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                      min="0.01"
                      max={selectedOrder.amount_due - selectedOrder.amount_collected}
                      placeholder="0.00"
                    />
                    <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm`}>{t('deliveryDetail.currencySymbol')}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setPaymentAmount(((selectedOrder.amount_due - selectedOrder.amount_collected) / 2).toFixed(0))}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {t('deliveryDetail.halfAmount')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentAmount((selectedOrder.amount_due - selectedOrder.amount_collected).toString())}
                      className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {t('deliveryDetail.fullAmountBtn')}
                    </button>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('deliveryDetail.notesOptional')}</label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                    rows={2}
                    placeholder={t('deliveryDetail.addNote')}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    {isSubmittingPayment ? t('deliveryDetail.saving') : t('deliveryDetail.confirmCollection')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('deliveryDetail.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ───── Process Returns Modal ───── */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <ArrowPathIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {processingReturnId ? t('deliveryDetail.processSingleReturnTitle') : t('deliveryDetail.processAllReturnsTitle')}
                </h3>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {processingReturnId
                    ? t('deliveryDetail.willProcessSingle')
                    : t('deliveryDetail.willProcessAll').replace('{count}', String(delivery?.returns?.filter(r => !r.processed).length || 0))
                  }
                </p>
                <ul className="text-sm space-y-1.5">
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span>{t('deliveryDetail.returnableGoBack')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span>{t('deliveryDetail.recordLosses')}</span>
                  </li>
                </ul>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('deliveryDetail.warehouseLabel')}</label>
                <select
                  value={selectedWarehouse || ''}
                  onChange={(e) => setSelectedWarehouse(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  required
                >
                  <option value="">{t('deliveryDetail.selectWarehouseOption')}</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleProcessReturns}
                  disabled={isProcessing || !selectedWarehouse}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {isProcessing ? t('deliveryDetail.processing') : t('deliveryDetail.confirmProcess')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('deliveryDetail.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───── Guided Tour ───── */}
      {showTour && (
        <GuidedTour steps={tourSteps} onComplete={() => setShowTour(false)} storageKey="delivery_detail_tour_step" />
      )}
    </div>
  );
}
