'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { deliveriesApi, warehousesApi } from '@/lib/api';
import { formatQty } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import GuidedTour, { TourStep } from '@/components/GuidedTour';
import { PageHeader } from '@/components/dashboard';
import {
  TruckIcon,
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

  const tourSteps: TourStep[] = useMemo(() => [
    { target: '[data-tour="dd-header"]', title: t('deliveryDetail.tourHeaderTitle'), desc: t('deliveryDetail.tourHeaderDesc'), position: 'bottom' as const },
    { target: '[data-tour="dd-info"]', title: t('deliveryDetail.tourInfoTitle'), desc: t('deliveryDetail.tourInfoDesc'), position: 'bottom' as const },
    { target: '[data-tour="dd-kpi"]', title: t('deliveryDetail.tourKpiTitle'), desc: t('deliveryDetail.tourKpiDesc'), position: 'bottom' as const },
    { target: '[data-tour="dd-orders"]', title: t('deliveryDetail.tourOrdersTitle'), desc: t('deliveryDetail.tourOrdersDesc'), position: 'top' as const },
  ], [t]);

  const getStatusDot = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      preparing: { dot: 'metric-dot-orange', label: t('deliveryDetail.statusPreparing') },
      in_progress: { dot: 'metric-dot-blue', label: t('deliveryDetail.statusInProgress') },
      completed: { dot: 'metric-dot-green', label: t('deliveryDetail.statusCompleted') },
      cancelled: { dot: 'metric-dot-red', label: t('deliveryDetail.statusCancelled') },
    };
    return map[status] || map.preparing;
  };

  const getOrderStatusDot = (status: string) => {
    const map: Record<string, { dot: string; label: string }> = {
      pending: { dot: 'metric-dot-orange', label: t('deliveryDetail.orderPending') },
      delivered: { dot: 'metric-dot-green', label: t('deliveryDetail.orderDelivered') },
      partial: { dot: 'metric-dot-blue', label: t('deliveryDetail.orderPartial') },
      failed: { dot: 'metric-dot-red', label: t('deliveryDetail.orderFailed') },
      postponed: { dot: 'metric-dot-neutral', label: t('deliveryDetail.orderPostponed') },
    };
    return map[status] || map.pending;
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
  if (!delivery) {
    return (
      <div>
        <PageHeader
          title={t('deliveryDetail.notFound')}
          breadcrumb={[
            { label: t('sidebar.deliveries'), href: '/dashboard/deliveries' },
            { label: '—' },
          ]}
        />
      </div>
    );
  }

  const statusInfo = getStatusDot(delivery.status);
  const uncollectedAmount = (Number(delivery.total_amount) || 0) - (Number(delivery.collected_amount) || 0);
  const collectionRate = Number(delivery.total_amount) > 0 ? ((Number(delivery.collected_amount) || 0) / Number(delivery.total_amount)) * 100 : 0;
  const totalDelivered = delivery.delivery_orders?.filter(o => ['delivered', 'partial'].includes(o.status)).length || 0;
  const totalReturns = delivery.returns?.length || 0;
  const totalLoss = delivery.returns?.filter(r => !r.returnable_to_stock).reduce((sum, r) => sum + (r.loss_amount || 0), 0) || 0;

  return (
    <div>
      <div data-tour="dd-header">
        <PageHeader
          title={delivery.reference}
          subtitle={`${t('deliveryDetail.dateLabel')} ${formatDate(delivery.date)}`}
          breadcrumb={[
            { label: t('sidebar.deliveries'), href: '/dashboard/deliveries' },
            { label: delivery.reference },
          ]}
          pill={
            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
              <span className={`metric-dot ${statusInfo.dot}`} aria-hidden />
              {statusInfo.label}
            </span>
          }
        >
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('deliveryDetail.tourBtn')}
          </button>
          {delivery.status === 'preparing' && (
            <button
              onClick={handleStartDelivery}
              disabled={isStarting}
              className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isStarting ? <div className="spinner w-4 h-4 border-white"></div> : <PlayIcon className="w-4 h-4" />}
              {isStarting ? t('deliveryDetail.starting') : t('deliveryDetail.startDelivery')}
            </button>
          )}
          <button
            onClick={fetchDelivery}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {t('deliveryDetail.refresh')}
          </button>
        </PageHeader>
      </div>

      {/* ───── Info Tiles ───── */}
      <div data-tour="dd-info" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        {[
          { label: t('deliveryDetail.driver'), value: delivery.livreur?.name || t('deliveryDetail.noData') },
          { label: t('deliveryDetail.vehicle'), value: delivery.vehicle?.name || t('deliveryDetail.noData') },
          { label: t('deliveryDetail.warehouse'), value: delivery.warehouse?.name || t('deliveryDetail.noData') },
          { label: t('deliveryDetail.plateNumber'), value: delivery.vehicle?.plate_number || t('deliveryDetail.noData') },
          { label: t('deliveryDetail.startTime'), value: delivery.start_time ? formatDateTime(delivery.start_time) : t('deliveryDetail.noData') },
          { label: t('deliveryDetail.endTime'), value: delivery.end_time ? formatDateTime(delivery.end_time) : t('deliveryDetail.noData') },
        ].map((card, i) => (
          <div key={i} className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-neutral" aria-hidden />
              <p className="metric-label truncate">{card.label}</p>
            </div>
            <p className="metric-value truncate">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ───── Financial KPI ───── */}
      <div data-tour="dd-kpi" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.totalAmount')}</p>
          </div>
          <p className="metric-value metric-value-currency">{formatCurrency(Number(delivery.total_amount) || 0)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-green" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.collected')}</p>
          </div>
          <p className="metric-value metric-value-currency">{formatCurrency(Number(delivery.collected_amount) || 0)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-red" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.remaining')}</p>
          </div>
          <p className="metric-value metric-value-currency">{formatCurrency(uncollectedAmount)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-violet" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.collectionRate')}</p>
          </div>
          <p className="metric-value tnum">{collectionRate.toFixed(0)}%</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-orange" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.totalLoss')}</p>
          </div>
          <p className="metric-value metric-value-currency">{formatCurrency(totalLoss)}</p>
        </div>
      </div>

      {/* ───── Order Stats ───── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.totalOrders')}</p>
          </div>
          <p className="metric-value tnum">{delivery.total_orders}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-green" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.deliveredCount')}</p>
          </div>
          <p className="metric-value tnum">{totalDelivered}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-red" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.failedPostponed')}</p>
          </div>
          <p className="metric-value tnum">{delivery.failed_count || 0}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-orange" aria-hidden />
            <p className="metric-label truncate">{t('deliveryDetail.returnsCount')}</p>
          </div>
          <p className="metric-value tnum">{totalReturns}</p>
        </div>
      </div>

      {/* ───── Delivery Orders ───── */}
      <div data-tour="dd-orders" className="surface-pro overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="surface-heading">{t('deliveryDetail.orderDetails')}</h2>
            <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
              ({delivery.delivery_orders?.length || 0})
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {delivery.delivery_orders?.map((order) => {
            const orderStatus = getOrderStatusDot(order.status);
            const remaining = order.amount_due - order.amount_collected;
            const hasRemaining = remaining > 0;
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id}>
                {/* Order Header */}
                <div
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isExpanded ? 'bg-gray-50 dark:bg-gray-700/30' : ''}`}
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center tnum text-[13px] text-gray-700 dark:text-gray-200">
                      {order.delivery_order}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="t-strong text-[13px]">{order.order?.reference || t('deliveryDetail.noData')}</span>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot ${orderStatus.dot}`} aria-hidden />
                          {orderStatus.label}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {order.client?.name} {order.client?.phone ? `• ${order.client.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-4 text-[12px]">
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('deliveryDetail.amountDue')}</p>
                        <p className="tnum t-strong">{formatCurrency(order.amount_due)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('deliveryDetail.amountCollected')}</p>
                        <p className="tnum t-strong">{formatCurrency(order.amount_collected)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">{t('deliveryDetail.remainingAmount')}</p>
                        <p className="tnum t-strong">{formatCurrency(remaining)}</p>
                      </div>
                    </div>

                    {hasRemaining && ['delivered', 'partial'].includes(order.status) && (
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openPaymentModal(order)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                        >
                          <CurrencyDollarIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.collectBtn')}
                        </button>
                        <button
                          onClick={() => handlePayFull(order)}
                          className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {t('deliveryDetail.fullPaymentBtn')}
                        </button>
                      </div>
                    )}

                    {isExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Order Details (Expanded) */}
                {isExpanded && order.order?.items && (
                  <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3 bg-gray-50/40 dark:bg-gray-900/20">
                    <h4 className="surface-heading mb-3 flex items-center gap-2">
                      <CubeIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      {t('deliveryDetail.products')} ({order.order.items.length})
                    </h4>
                    <div className="table-pro-wrap">
                      <table className="table-pro compact">
                        <thead>
                          <tr>
                            <th>{t('deliveryDetail.product')}</th>
                            <th className="text-center">{t('deliveryDetail.ordered')}</th>
                            <th className="text-center">{t('deliveryDetail.delivered')}</th>
                            <th className="text-center">{t('deliveryDetail.returned')}</th>
                            <th className="text-center">{t('deliveryDetail.unitPrice')}</th>
                            <th className="text-center">{t('deliveryDetail.piecesPerUnit')}</th>
                            <th className="text-center">{t('deliveryDetail.subtotal')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.order.items.map((item) => {
                            const piecesPerPkg = item.product?.pieces_per_package || 1;
                            const deliveredAmount = (item.quantity_delivered || 0) * item.unit_price;
                            return (
                              <tr key={item.id}>
                                <td>
                                  <div className="t-strong">{item.product?.name || t('deliveryDetail.noData')}</div>
                                  {item.product?.barcode && <div className="text-[11px] text-gray-400">{item.product.barcode}</div>}
                                </td>
                                <td className="text-center tnum">
                                  <div>{formatQty(item.quantity_confirmed, piecesPerPkg)}</div>
                                  {piecesPerPkg > 1 && <div className="text-[10px] text-gray-400">{item.quantity_confirmed} {t('deliveryDetail.pieces')}</div>}
                                </td>
                                <td className="text-center tnum">
                                  {formatQty(item.quantity_delivered || 0, piecesPerPkg)}
                                  {piecesPerPkg > 1 && (item.quantity_delivered || 0) > 0 && (
                                    <div className="text-[10px] text-gray-400">{item.quantity_delivered} {t('deliveryDetail.pieces')}</div>
                                  )}
                                </td>
                                <td className="text-center tnum t-muted">{formatQty(item.quantity_returned || 0, piecesPerPkg)}</td>
                                <td className="text-center tnum">
                                  {formatCurrency(item.unit_price)}
                                  {piecesPerPkg > 1 && (
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400">({formatCurrency(item.unit_price * piecesPerPkg)}{t('deliveryDetail.perCarton')})</div>
                                  )}
                                </td>
                                <td className="text-center tnum t-muted">{piecesPerPkg}</td>
                                <td className="text-center tnum t-strong">
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
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                      {order.delivered_at && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('deliveryDetail.deliveryTime')}</p>
                          <p className="text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-snug">{formatDateTime(order.delivered_at)}</p>
                        </div>
                      )}
                      {order.client?.address && (
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('deliveryDetail.address')}</p>
                          <p className="text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-snug">{order.client.address}</p>
                        </div>
                      )}
                      {order.failure_reason && (
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('deliveryDetail.failureReason')}</p>
                          <p className="text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-snug">{order.failure_reason}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="col-span-2">
                          <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('deliveryDetail.notes')}</p>
                          <p className="text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-snug">{order.notes}</p>
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
        <div className="surface-pro overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="surface-heading">{t('deliveryDetail.returnsTitle')}</h2>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 tnum">
                ({delivery.returns.length})
              </span>
            </div>
            {delivery.returns.some(r => !r.processed) && (
              <button
                onClick={() => openProcessModal()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                {t('deliveryDetail.processAllReturns')}
              </button>
            )}
          </div>

          <div className="table-pro-wrap">
            <table className="table-pro compact">
              <thead>
                <tr>
                  <th>{t('deliveryDetail.product')}</th>
                  <th className="text-center">{t('deliveryDetail.quantity')}</th>
                  <th className="text-center">{t('deliveryDetail.reason')}</th>
                  <th className="text-center">{t('deliveryDetail.returnableToStock')}</th>
                  <th className="text-center">{t('deliveryDetail.lossAmount')}</th>
                  <th className="text-center">{t('deliveryDetail.status')}</th>
                  <th className="text-center">{t('deliveryDetail.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {delivery.returns.map((ret) => (
                  <tr key={ret.id}>
                    <td className="t-strong">{ret.product?.name || t('deliveryDetail.noData')}</td>
                    <td className="text-center tnum">{formatQty(ret.quantity, ret.product?.pieces_per_package)}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${ret.reason === 'damaged' ? 'metric-dot-red' : 'metric-dot-orange'}`} aria-hidden />
                        {returnReasonLabels[ret.reason] || ret.reason}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${ret.returnable_to_stock ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                        {ret.returnable_to_stock ? t('deliveryDetail.yes') : t('deliveryDetail.noLoss')}
                      </span>
                    </td>
                    <td className="text-center tnum">
                      {ret.loss_amount > 0 ? formatCurrency(ret.loss_amount) : <span className="t-muted">—</span>}
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${ret.processed ? 'metric-dot-green' : 'metric-dot-orange'}`} aria-hidden />
                        {ret.processed ? t('deliveryDetail.processed') : t('deliveryDetail.pendingStatus')}
                      </span>
                    </td>
                    <td className="text-center">
                      {!ret.processed && (
                        <button
                          onClick={() => openProcessModal(ret.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
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
                  <tr>
                    <td colSpan={4} className="t-strong">{t('deliveryDetail.totalLosses')}</td>
                    <td className="tnum t-strong">{formatCurrency(totalLoss)}</td>
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
        <div className="surface-pro p-4 mb-4">
          <h2 className="surface-heading mb-2">{t('deliveryDetail.additionalInfo')}</h2>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('deliveryDetail.notes')}</p>
            <p className="mt-1 text-[13px] text-gray-900 dark:text-gray-100 font-medium leading-snug whitespace-pre-wrap">{delivery.notes}</p>
          </div>
        </div>
      )}

      {/* ───── Payment Modal ───── */}
      {showPaymentModal && selectedOrder && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowPaymentModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[680px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200 dark:border-gray-700">
              <header className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  {t('deliveryDetail.collectPaymentTitle')}
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </header>

              <main className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="surface-pro p-3 text-[13px]">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">{t('deliveryDetail.client')}</span>
                    <span className="t-strong">{selectedOrder.client?.name || t('deliveryDetail.noData')}</span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">{t('deliveryDetail.order')}</span>
                    <span className="t-strong">{selectedOrder.order?.reference || t('deliveryDetail.noData')}</span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">{t('deliveryDetail.due')}</span>
                    <span className="tnum t-strong">{formatCurrency(selectedOrder.amount_due)}</span>
                  </div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-gray-600 dark:text-gray-400">{t('deliveryDetail.alreadyCollected')}</span>
                    <span className="tnum t-strong">{formatCurrency(selectedOrder.amount_collected)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700 font-semibold">
                    <span className="text-gray-700 dark:text-gray-200">{t('deliveryDetail.remainingToPay')}</span>
                    <span className="tnum">{formatCurrency(selectedOrder.amount_due - selectedOrder.amount_collected)}</span>
                  </div>
                </div>

                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deliveryDetail.collectedAmountLabel')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="input w-full text-[14px] py-2 tnum"
                        required
                        min="0.01"
                        max={selectedOrder.amount_due - selectedOrder.amount_collected}
                        placeholder="0.00"
                      />
                      <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-[11px] text-gray-400 dark:text-gray-500 pointer-events-none`}>{t('deliveryDetail.currencySymbol')}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(((selectedOrder.amount_due - selectedOrder.amount_collected) / 2).toFixed(0))}
                        className="text-[11px] font-medium px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('deliveryDetail.halfAmount')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount((selectedOrder.amount_due - selectedOrder.amount_collected).toString())}
                        className="text-[11px] font-medium px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('deliveryDetail.fullAmountBtn')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deliveryDetail.notesOptional')}</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="input w-full text-[14px] py-2"
                      rows={2}
                      placeholder={t('deliveryDetail.addNote')}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowPaymentModal(false)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {t('deliveryDetail.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPayment}
                      className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      {isSubmittingPayment ? t('deliveryDetail.saving') : t('deliveryDetail.confirmCollection')}
                    </button>
                  </div>
                </form>
              </main>
            </div>
          </div>
        </>
      )}

      {/* ───── Process Returns Modal ───── */}
      {showProcessModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowProcessModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[680px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200 dark:border-gray-700">
              <header className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ArrowPathIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  {processingReturnId ? t('deliveryDetail.processSingleReturnTitle') : t('deliveryDetail.processAllReturnsTitle')}
                </h3>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </header>

              <main className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="surface-pro p-3">
                  <p className="text-[13px] text-gray-700 dark:text-gray-200 mb-2">
                    {processingReturnId
                      ? t('deliveryDetail.willProcessSingle')
                      : t('deliveryDetail.willProcessAll').replace('{count}', String(delivery?.returns?.filter(r => !r.processed).length || 0))
                    }
                  </p>
                  <ul className="text-[12px] space-y-1.5">
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <span className="metric-dot metric-dot-green" aria-hidden />
                      <span>{t('deliveryDetail.returnableGoBack')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                      <span className="metric-dot metric-dot-red" aria-hidden />
                      <span>{t('deliveryDetail.recordLosses')}</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deliveryDetail.warehouseLabel')}</label>
                  <select
                    value={selectedWarehouse || ''}
                    onChange={(e) => setSelectedWarehouse(parseInt(e.target.value))}
                    className="select w-full text-[14px] py-2"
                    required
                  >
                    <option value="">{t('deliveryDetail.selectWarehouseOption')}</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowProcessModal(false)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('deliveryDetail.cancel')}
                  </button>
                  <button
                    onClick={handleProcessReturns}
                    disabled={isProcessing || !selectedWarehouse}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {isProcessing ? t('deliveryDetail.processing') : t('deliveryDetail.confirmProcess')}
                  </button>
                </div>
              </main>
            </div>
          </div>
        </>
      )}

      {/* ───── Guided Tour ───── */}
      {showTour && (
        <GuidedTour steps={tourSteps} onComplete={() => setShowTour(false)} storageKey="delivery_detail_tour_step" />
      )}
    </div>
  );
}
