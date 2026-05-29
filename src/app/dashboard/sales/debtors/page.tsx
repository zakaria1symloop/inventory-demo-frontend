'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { allDebtorsApi, deliveriesApi, salesApi, warehousesApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  BanknotesIcon,
  PhoneIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  CheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface Debtor {
  client_id: number;
  client_name: string;
  client_phone: string;
  client_address: string;
  sales_total_due: number;
  sales_total_paid: number;
  sales_total_remaining: number;
  sales_count: number;
  delivery_total_due: number;
  delivery_total_collected: number;
  delivery_total_remaining: number;
  delivery_count: number;
  total_remaining: number;
  total_orders: number;
  client_balance: number;
  has_sales_debt: boolean;
  has_delivery_debt: boolean;
}

interface DebtorsTotals {
  total_debtors: number;
  sales_total_remaining: number;
  delivery_total_remaining: number;
  total_remaining: number;
}

interface SaleDebt {
  id: number;
  type: 'sale';
  reference: string;
  warehouse_name: string;
  date: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  days_old: number | null;
}

interface DeliveryDebt {
  id: number;
  type: 'delivery';
  delivery_id: number;
  delivery_reference: string;
  order_id: number;
  reference: string;
  livreur_name: string;
  date: string;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  days_old: number | null;
}

interface ClientDebtDetails {
  client: {
    id: number;
    name: string;
    phone: string;
    address: string;
    balance: number;
  } | null;
  sales: SaleDebt[];
  deliveries: DeliveryDebt[];
  totals: {
    sales_total_due: number;
    sales_total_paid: number;
    sales_total_remaining: number;
    delivery_total_due: number;
    delivery_total_paid: number;
    delivery_total_remaining: number;
    total_remaining: number;
  };
}

export default function DebtorsPage() {
  const { t, locale } = useLocale();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [totals, setTotals] = useState<DebtorsTotals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtTypeFilter, setDebtTypeFilter] = useState<'all' | 'sales' | 'delivery'>('all');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [sellers, setSellers] = useState<{ id: number; name: string }[]>([]);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [clientDebt, setClientDebt] = useState<ClientDebtDetails | null>(null);
  const [loadingClientDebt, setLoadingClientDebt] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SaleDebt | DeliveryDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchDebtors();
  }, [warehouseFilter, sellerFilter]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [wRes, uRes] = await Promise.all([
          warehousesApi.getAll(),
          usersApi.getAll(),
        ]);
        setWarehouses(wRes.data.data || wRes.data || []);
        setSellers(uRes.data.data || uRes.data || []);
      } catch { /* ignore */ }
    };
    fetchFilters();
  }, []);

  const fetchDebtors = async () => {
    try {
      const params: Record<string, unknown> = {};
      if (warehouseFilter) params.warehouse_id = warehouseFilter;
      if (sellerFilter) params.seller_id = sellerFilter;
      const response = await allDebtorsApi.getAll(params);
      setDebtors(response.data.data || []);
      setTotals(response.data.totals);
    } catch (error) {
      toast.error(t('debtors.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDebt = async (clientId: number) => {
    setLoadingClientDebt(true);
    try {
      const response = await allDebtorsApi.getClientDebt(clientId);
      setClientDebt(response.data);
    } catch (error) {
      toast.error(t('debtors.debtLoadError'));
    } finally {
      setLoadingClientDebt(false);
    }
  };

  const toggleExpand = (clientId: number) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      setClientDebt(null);
    } else {
      setExpandedClient(clientId);
      fetchClientDebt(clientId);
    }
  };

  const openPaymentModal = (item: SaleDebt | DeliveryDebt) => {
    setSelectedItem(item);
    setPaymentAmount(item.amount_remaining.toString());
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('debtors.invalidAmount'));
      return;
    }

    if (amount > selectedItem.amount_remaining) {
      toast.error(t('debtors.amountExceedsRemaining'));
      return;
    }

    setIsSubmittingPayment(true);
    try {
      if (selectedItem.type === 'delivery') {
        const deliveryItem = selectedItem as DeliveryDebt;
        await deliveriesApi.collectPayment(deliveryItem.delivery_id, deliveryItem.id, {
          amount,
          notes: paymentNotes,
        });
      } else {
        await salesApi.addPayment(selectedItem.id, {
          amount,
          payment_method: 'cash',
          date: new Date().toISOString().split('T')[0],
          notes: paymentNotes,
        });
      }
      toast.success(t('debtors.paymentSuccess'));
      setShowPaymentModal(false);

      fetchDebtors();
      if (expandedClient) {
        fetchClientDebt(expandedClient);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('debtors.paymentError');
      toast.error(message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePayFull = async (item: SaleDebt | DeliveryDebt) => {
    if (!confirm(t('debtors.fullPaymentConfirm', { amount: formatCurrency(item.amount_remaining) }))) return;

    try {
      if (item.type === 'delivery') {
        const deliveryItem = item as DeliveryDebt;
        await deliveriesApi.collectPayment(deliveryItem.delivery_id, deliveryItem.id, {
          amount: item.amount_remaining,
          notes: t('debtors.fullPaymentNote'),
        });
      } else {
        await salesApi.addPayment(item.id, {
          amount: item.amount_remaining,
          payment_method: 'cash',
          date: new Date().toISOString().split('T')[0],
          notes: t('debtors.fullPaymentNote'),
        });
      }
      toast.success(t('debtors.paymentSuccess'));

      fetchDebtors();
      if (expandedClient) {
        fetchClientDebt(expandedClient);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('debtors.paymentError');
      toast.error(message);
    }
  };

  const formatCurrency = (value: number) => {
    const loc = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    return new Intl.NumberFormat(loc, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    const loc = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';
    return new Date(date).toLocaleDateString(loc);
  };

  const getAgingDot = (days: number | null): string => {
    if (days === null) return 'metric-dot-neutral';
    const d = Math.floor(days);
    if (d <= 7) return 'metric-dot-green';
    if (d <= 30) return 'metric-dot-blue';
    if (d <= 60) return 'metric-dot-orange';
    return 'metric-dot-red';
  };

  const filteredDebtors = debtors.filter(d => {
    const matchesSearch = d.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.client_address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = debtTypeFilter === 'all' ||
      (debtTypeFilter === 'sales' && d.has_sales_debt) ||
      (debtTypeFilter === 'delivery' && d.has_delivery_debt);

    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <PageHeader
        title={t('debtors.title')}
        subtitle={t('debtors.subtitle')}
        breadcrumb={[
          { label: t('debtors.backToSales'), href: '/dashboard/sales' },
          { label: t('debtors.title') },
        ]}
      >
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 rtl:rotate-180" strokeWidth={1.8} />
          {t('debtors.backToSales')}
        </Link>
      </PageHeader>

      {/* Metric tiles */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-neutral" aria-hidden />
              <p className="metric-label truncate">{t('debtors.debtorsCount')}</p>
            </div>
            <p className="metric-value truncate">{totals.total_debtors}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-violet" aria-hidden />
              <p className="metric-label truncate">{t('debtors.salesDebts')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(totals.sales_total_remaining)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-orange" aria-hidden />
              <p className="metric-label truncate">{t('debtors.deliveryDebts')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(totals.delivery_total_remaining)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-red" aria-hidden />
              <p className="metric-label truncate">{t('debtors.totalRemaining')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(totals.total_remaining)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('debtors.searchPlaceholder')}
      >
        <select value={debtTypeFilter} onChange={(e) => setDebtTypeFilter(e.target.value as 'all' | 'sales' | 'delivery')}>
          <option value="all">{t('debtors.allDebts')}</option>
          <option value="sales">{t('debtors.salesDebtsOnly')}</option>
          <option value="delivery">{t('debtors.deliveryDebtsOnly')}</option>
        </select>
        <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
          <option value="">{t('debtors.allWarehouses')}</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
          <option value="">{t('debtors.allSellers')}</option>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </FilterBar>

      {/* Debtors list */}
      {filteredDebtors.length === 0 ? (
        <div className="surface-pro text-center py-12 text-gray-500 dark:text-gray-400">
          <BanknotesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          <p className="text-[14px] font-medium">{t('debtors.noDebtors')}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredDebtors.map((debtor) => (
            <div key={debtor.client_id} className="surface-pro overflow-hidden">
              {/* Debtor header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleExpand(debtor.client_id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-200">
                      {debtor.client_name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{debtor.client_name}</h3>
                    <div className="flex items-center gap-3 text-[12px] t-muted flex-wrap mt-0.5">
                      {debtor.client_phone && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {debtor.client_phone}
                        </span>
                      )}
                      {debtor.client_address && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {debtor.client_address}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {debtor.has_sales_debt && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                          <span className="metric-dot metric-dot-violet" aria-hidden />
                          {t('debtors.salesBadge', { count: debtor.sales_count })}
                        </span>
                      )}
                      {debtor.has_delivery_debt && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                          <span className="metric-dot metric-dot-orange" aria-hidden />
                          {t('debtors.deliveryBadge', { count: debtor.delivery_count })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {debtor.has_sales_debt && (
                    <div className="text-center hidden md:block">
                      <p className="text-[11px] t-muted">{t('debtors.salesDebtsLabel')}</p>
                      <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 tnum">{formatCurrency(debtor.sales_total_remaining)}</p>
                    </div>
                  )}
                  {debtor.has_delivery_debt && (
                    <div className="text-center hidden md:block">
                      <p className="text-[11px] t-muted">{t('debtors.deliveryDebtsLabel')}</p>
                      <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 tnum">{formatCurrency(debtor.delivery_total_remaining)}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[11px] t-muted">{t('debtors.totalRemainingLabel')}</p>
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(debtor.total_remaining)}</p>
                  </div>
                  {expandedClient === debtor.client_id ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {expandedClient === debtor.client_id && (
                <div className="p-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/30">
                  {loadingClientDebt ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="spinner"></div>
                    </div>
                  ) : clientDebt ? (
                    <div className="space-y-4">
                      {/* Sales debts */}
                      {clientDebt.sales.length > 0 && (
                        <div>
                          <h4 className="surface-heading text-[13px] font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <span className="metric-dot metric-dot-violet" aria-hidden />
                            {t('debtors.unpaidSalesInvoices', { count: clientDebt.sales.length })}
                          </h4>
                          <div className="table-pro-wrap">
                            <table className="table-pro compact">
                              <thead>
                                <tr>
                                  <th>{t('debtors.thReference')}</th>
                                  <th>{t('debtors.thWarehouse')}</th>
                                  <th className="text-end">{t('debtors.thDate')}</th>
                                  <th className="text-end">{t('debtors.thAmountDue')}</th>
                                  <th className="text-end">{t('debtors.thAmountPaid')}</th>
                                  <th className="text-end">{t('debtors.thRemaining')}</th>
                                  <th>{t('debtors.thAge')}</th>
                                  <th className="text-end">{t('debtors.thActions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clientDebt.sales.map((sale) => (
                                  <tr key={sale.id}>
                                    <td>
                                      <Link
                                        href={`/dashboard/sales/${sale.id}`}
                                        className="font-mono font-semibold text-gray-800 dark:text-gray-100 hover:underline underline-offset-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {sale.reference}
                                      </Link>
                                    </td>
                                    <td className="t-muted">{sale.warehouse_name || '-'}</td>
                                    <td className="tnum t-muted">{formatDate(sale.date)}</td>
                                    <td className="tnum t-strong">{formatCurrency(sale.amount_due)}</td>
                                    <td className="tnum">{formatCurrency(sale.amount_paid)}</td>
                                    <td className="tnum t-strong">{formatCurrency(sale.amount_remaining)}</td>
                                    <td>
                                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                        <span className={`metric-dot ${getAgingDot(sale.days_old)}`} aria-hidden />
                                        {sale.days_old !== null ? t('debtors.daysOld', { days: Math.floor(sale.days_old) }) : '-'}
                                      </span>
                                    </td>
                                    <td className="text-end">
                                      <div className="inline-flex gap-1">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openPaymentModal(sale); }}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                          title={t('debtors.partialPayTitle')}
                                        >
                                          <CurrencyDollarIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                                          {t('debtors.partialBtn')}
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handlePayFull(sale); }}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                          title={t('debtors.fullPayTitle')}
                                        >
                                          <CheckIcon className="w-3.5 h-3.5" strokeWidth={2} />
                                          {t('debtors.fullBtn')}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="font-semibold">
                                  <td colSpan={3} className="t-strong">{t('debtors.salesTotalLabel')}</td>
                                  <td className="tnum t-strong">{formatCurrency(clientDebt.totals.sales_total_due)}</td>
                                  <td className="tnum t-strong">{formatCurrency(clientDebt.totals.sales_total_paid)}</td>
                                  <td className="tnum t-strong">{formatCurrency(clientDebt.totals.sales_total_remaining)}</td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Delivery debts */}
                      {clientDebt.deliveries.length > 0 && (
                        <div>
                          <h4 className="surface-heading text-[13px] font-semibold mb-2 flex items-center gap-2 text-gray-700 dark:text-gray-200">
                            <span className="metric-dot metric-dot-orange" aria-hidden />
                            {t('debtors.unpaidDeliveryOrders', { count: clientDebt.deliveries.length })}
                          </h4>
                          <div className="table-pro-wrap">
                            <table className="table-pro compact">
                              <thead>
                                <tr>
                                  <th>{t('debtors.thDelivery')}</th>
                                  <th>{t('debtors.thOrder')}</th>
                                  <th>{t('debtors.thDriver')}</th>
                                  <th className="text-end">{t('debtors.thDate')}</th>
                                  <th className="text-end">{t('debtors.thAmountDue')}</th>
                                  <th className="text-end">{t('debtors.thCollected')}</th>
                                  <th className="text-end">{t('debtors.thRemaining')}</th>
                                  <th className="text-end">{t('debtors.thActions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clientDebt.deliveries.map((delivery) => (
                                  <tr key={delivery.id}>
                                    <td>
                                      <Link
                                        href={`/dashboard/deliveries/${delivery.delivery_id}`}
                                        className="font-mono font-semibold text-gray-800 dark:text-gray-100 hover:underline underline-offset-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {delivery.delivery_reference}
                                      </Link>
                                    </td>
                                    <td>
                                      <Link
                                        href={`/dashboard/orders/${delivery.order_id}`}
                                        className="font-mono font-medium text-gray-700 dark:text-gray-300 hover:underline underline-offset-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {delivery.reference}
                                      </Link>
                                    </td>
                                    <td className="t-muted">{delivery.livreur_name || '-'}</td>
                                    <td className="tnum t-muted">{formatDate(delivery.date)}</td>
                                    <td className="tnum t-strong">{formatCurrency(delivery.amount_due)}</td>
                                    <td className="tnum">{formatCurrency(delivery.amount_paid)}</td>
                                    <td className="tnum t-strong">{formatCurrency(delivery.amount_remaining)}</td>
                                    <td className="text-end">
                                      <div className="inline-flex gap-1">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); openPaymentModal(delivery); }}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                          title={t('debtors.partialPayTitle')}
                                        >
                                          <CurrencyDollarIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                                          {t('debtors.partialBtn')}
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handlePayFull(delivery); }}
                                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                          title={t('debtors.fullPayTitle')}
                                        >
                                          <CheckIcon className="w-3.5 h-3.5" strokeWidth={2} />
                                          {t('debtors.fullBtn')}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="font-semibold">
                                  <td colSpan={4} className="t-strong">{t('debtors.deliveryTotalLabel')}</td>
                                  <td className="tnum t-strong">{formatCurrency(clientDebt.totals.delivery_total_due)}</td>
                                  <td className="tnum t-strong">{formatCurrency(clientDebt.totals.delivery_total_paid)}</td>
                                  <td className="tnum t-strong">{formatCurrency(clientDebt.totals.delivery_total_remaining)}</td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Grand total */}
                      <div className="surface-pro p-3 flex justify-between items-center">
                        <span className="text-[14px] font-semibold text-gray-900 dark:text-white">{t('debtors.grandTotal')}</span>
                        <span className="text-[18px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(clientDebt.totals.total_remaining)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-[13px]">{t('debtors.noData')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedItem && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowPaymentModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('debtors.collectPayment')}</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <form onSubmit={handlePayment} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="surface-pro p-3 text-[13px] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="t-muted">{t('debtors.typeLabel')}</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${selectedItem.type === 'sale' ? 'metric-dot-violet' : 'metric-dot-orange'}`} aria-hidden />
                        {selectedItem.type === 'sale' ? t('debtors.salesInvoice') : t('debtors.deliveryOrder')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="t-muted">{t('debtors.referenceLabel')}</span>
                      <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedItem.reference}</span>
                    </div>
                    {selectedItem.type === 'delivery' && (
                      <div className="flex justify-between items-center">
                        <span className="t-muted">{t('debtors.deliveryLabel')}</span>
                        <span className="font-mono font-medium text-gray-900 dark:text-white">{(selectedItem as DeliveryDebt).delivery_reference}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{t('debtors.remainingLabel')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(selectedItem.amount_remaining)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('debtors.amountLabel')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input w-full text-[14px] py-2 font-semibold tnum"
                      required
                      min="0.01"
                      max={selectedItem.amount_remaining}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('debtors.notesOptional')}</label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="input w-full text-[14px] py-2 resize-none"
                      rows={2}
                      placeholder={t('debtors.notesPlaceholder')}
                    />
                  </div>
                </main>
                <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('debtors.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckIcon className="w-4 h-4" strokeWidth={2} />
                    {isSubmittingPayment ? t('debtors.saving') : t('debtors.confirmPayment')}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
