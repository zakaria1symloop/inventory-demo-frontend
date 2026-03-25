'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { allDebtorsApi, deliveriesApi, salesApi, warehousesApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  BanknotesIcon,
  PhoneIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  CheckIcon,
  DocumentTextIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

interface Debtor {
  client_id: number;
  client_name: string;
  client_phone: string;
  client_address: string;
  // Sales debt
  sales_total_due: number;
  sales_total_paid: number;
  sales_total_remaining: number;
  sales_count: number;
  // Delivery debt
  delivery_total_due: number;
  delivery_total_collected: number;
  delivery_total_remaining: number;
  delivery_count: number;
  // Combined
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
  const { t, locale, dir } = useLocale();
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

  // Payment modal state
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
        // Sale payment
        await salesApi.addPayment(selectedItem.id, {
          amount,
          payment_method: 'cash',
          date: new Date().toISOString().split('T')[0],
          notes: paymentNotes,
        });
      }
      toast.success(t('debtors.paymentSuccess'));
      setShowPaymentModal(false);

      // Refresh data
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

      // Refresh data
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t('debtors.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('debtors.subtitle')}</p>
        </div>
        <Link
          href="/dashboard/sales"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className={`w-5 h-5 ${dir === 'rtl' ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('debtors.backToSales')}
        </Link>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.debtorsCount')}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totals.total_debtors}</p>
              </div>
            </div>
          </div>

          <div className="card bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.salesDebts')}</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totals.sales_total_remaining)}</p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/60 flex items-center justify-center">
                <TruckIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.deliveryDebts')}</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(totals.delivery_total_remaining)}</p>
              </div>
            </div>
          </div>

          <div className="card bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/60 flex items-center justify-center">
                <BanknotesIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.totalRemaining')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.total_remaining)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 mb-4">
          <input
            type="text"
            placeholder={t('debtors.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1 min-w-[200px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <select
            value={debtTypeFilter}
            onChange={(e) => setDebtTypeFilter(e.target.value as 'all' | 'sales' | 'delivery')}
            className="select dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">{t('debtors.allDebts')}</option>
            <option value="sales">{t('debtors.salesDebtsOnly')}</option>
            <option value="delivery">{t('debtors.deliveryDebtsOnly')}</option>
          </select>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="select dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">{t('debtors.allWarehouses')}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="select dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">{t('debtors.allSellers')}</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {filteredDebtors.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg">{t('debtors.noDebtors')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDebtors.map((debtor) => (
              <div key={debtor.client_id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Debtor Header */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => toggleExpand(debtor.client_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {debtor.client_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg dark:text-white">{debtor.client_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {debtor.client_phone && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="w-4 h-4" />
                            {debtor.client_phone}
                          </span>
                        )}
                        {debtor.client_address && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {debtor.client_address}
                          </span>
                        )}
                      </div>
                      {/* Debt type badges */}
                      <div className="flex gap-2 mt-1">
                        {debtor.has_sales_debt && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                            <DocumentTextIcon className="w-3 h-3" />
                            {t('debtors.salesBadge', { count: debtor.sales_count })}
                          </span>
                        )}
                        {debtor.has_delivery_debt && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-300">
                            <TruckIcon className="w-3 h-3" />
                            {t('debtors.deliveryBadge', { count: debtor.delivery_count })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {debtor.has_sales_debt && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.salesDebtsLabel')}</p>
                        <p className="font-bold text-purple-600 dark:text-purple-400">{formatCurrency(debtor.sales_total_remaining)}</p>
                      </div>
                    )}
                    {debtor.has_delivery_debt && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.deliveryDebtsLabel')}</p>
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(debtor.delivery_total_remaining)}</p>
                      </div>
                    )}
                    <div className={`text-center ${dir === 'rtl' ? 'border-r pr-4' : 'border-l pl-4'} dark:border-gray-600`}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('debtors.totalRemainingLabel')}</p>
                      <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(debtor.total_remaining)}</p>
                    </div>
                    {expandedClient === debtor.client_id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedClient === debtor.client_id && (
                  <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                    {loadingClientDebt ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="spinner"></div>
                      </div>
                    ) : clientDebt ? (
                      <div className="space-y-6">
                        {/* Sales Debts */}
                        {clientDebt.sales.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3 flex items-center gap-2 text-purple-700 dark:text-purple-400">
                              <DocumentTextIcon className="w-5 h-5" />
                              {t('debtors.unpaidSalesInvoices', { count: clientDebt.sales.length })}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-purple-50 dark:bg-purple-900/30">
                                  <tr>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thReference')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thWarehouse')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thDate')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thAmountDue')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thAmountPaid')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thRemaining')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thAge')}</th>
                                    <th className="whitespace-nowrap px-2 text-center dark:text-gray-300">{t('debtors.thActions')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {clientDebt.sales.map((sale) => (
                                    <tr key={sale.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <Link
                                          href={`/dashboard/sales/${sale.id}`}
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {sale.reference}
                                        </Link>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap dark:text-gray-300">{sale.warehouse_name || '-'}</td>
                                      <td className="px-2 py-2 whitespace-nowrap dark:text-gray-300">{formatDate(sale.date)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap dark:text-gray-300">{formatCurrency(sale.amount_due)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-green-600 dark:text-green-400">{formatCurrency(sale.amount_paid)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-red-600 dark:text-red-400 font-bold">{formatCurrency(sale.amount_remaining)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-gray-500 dark:text-gray-400">
                                        {sale.days_old !== null ? t('debtors.daysOld', { days: sale.days_old }) : '-'}
                                      </td>
                                      <td className="px-2 py-2">
                                        <div className="flex gap-1 justify-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPaymentModal(sale);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            title={t('debtors.partialPayTitle')}
                                          >
                                            <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                            {t('debtors.partialBtn')}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handlePayFull(sale);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                                            title={t('debtors.fullPayTitle')}
                                          >
                                            <CheckIcon className="w-3.5 h-3.5" />
                                            {t('debtors.fullBtn')}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-purple-50 dark:bg-purple-900/30 font-bold">
                                  <tr>
                                    <td colSpan={3} className="px-2 py-2 dark:text-gray-300">{t('debtors.salesTotalLabel')}</td>
                                    <td className="px-2 py-2 dark:text-gray-300">{formatCurrency(clientDebt.totals.sales_total_due)}</td>
                                    <td className="px-2 py-2 text-green-600 dark:text-green-400">{formatCurrency(clientDebt.totals.sales_total_paid)}</td>
                                    <td className="px-2 py-2 text-red-600 dark:text-red-400">{formatCurrency(clientDebt.totals.sales_total_remaining)}</td>
                                    <td colSpan={2}></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Delivery Debts */}
                        {clientDebt.deliveries.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3 flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                              <TruckIcon className="w-5 h-5" />
                              {t('debtors.unpaidDeliveryOrders', { count: clientDebt.deliveries.length })}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-yellow-50 dark:bg-yellow-900/30">
                                  <tr>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thDelivery')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thOrder')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thDriver')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thDate')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thAmountDue')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thCollected')}</th>
                                    <th className="whitespace-nowrap px-2 text-start dark:text-gray-300">{t('debtors.thRemaining')}</th>
                                    <th className="whitespace-nowrap px-2 text-center dark:text-gray-300">{t('debtors.thActions')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {clientDebt.deliveries.map((delivery) => (
                                    <tr key={delivery.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <Link
                                          href={`/dashboard/deliveries/${delivery.delivery_id}`}
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {delivery.delivery_reference}
                                        </Link>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap">
                                        <Link
                                          href={`/dashboard/orders/${delivery.order_id}`}
                                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {delivery.reference}
                                        </Link>
                                      </td>
                                      <td className="px-2 py-2 whitespace-nowrap dark:text-gray-300">{delivery.livreur_name || '-'}</td>
                                      <td className="px-2 py-2 whitespace-nowrap dark:text-gray-300">{formatDate(delivery.date)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap dark:text-gray-300">{formatCurrency(delivery.amount_due)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-green-600 dark:text-green-400">{formatCurrency(delivery.amount_paid)}</td>
                                      <td className="px-2 py-2 whitespace-nowrap text-red-600 dark:text-red-400 font-bold">{formatCurrency(delivery.amount_remaining)}</td>
                                      <td className="px-2 py-2">
                                        <div className="flex gap-1 justify-center">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPaymentModal(delivery);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            title={t('debtors.partialPayTitle')}
                                          >
                                            <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                            {t('debtors.partialBtn')}
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handlePayFull(delivery);
                                            }}
                                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                                            title={t('debtors.fullPayTitle')}
                                          >
                                            <CheckIcon className="w-3.5 h-3.5" />
                                            {t('debtors.fullBtn')}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-yellow-50 dark:bg-yellow-900/30 font-bold">
                                  <tr>
                                    <td colSpan={4} className="px-2 py-2 dark:text-gray-300">{t('debtors.deliveryTotalLabel')}</td>
                                    <td className="px-2 py-2 dark:text-gray-300">{formatCurrency(clientDebt.totals.delivery_total_due)}</td>
                                    <td className="px-2 py-2 text-green-600 dark:text-green-400">{formatCurrency(clientDebt.totals.delivery_total_paid)}</td>
                                    <td className="px-2 py-2 text-red-600 dark:text-red-400">{formatCurrency(clientDebt.totals.delivery_total_remaining)}</td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Grand Total */}
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex justify-between items-center">
                          <span className="font-bold text-lg dark:text-white">{t('debtors.grandTotal')}</span>
                          <span className="font-bold text-2xl text-red-600 dark:text-red-400">{formatCurrency(clientDebt.totals.total_remaining)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('debtors.noData')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold dark:text-white">{t('debtors.collectPayment')}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('debtors.typeLabel')}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                  selectedItem.type === 'sale'
                    ? 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {selectedItem.type === 'sale' ? (
                    <>
                      <DocumentTextIcon className="w-3 h-3" />
                      {t('debtors.salesInvoice')}
                    </>
                  ) : (
                    <>
                      <TruckIcon className="w-3 h-3" />
                      {t('debtors.deliveryOrder')}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('debtors.referenceLabel')}</span>
                <span className="font-medium dark:text-white">{selectedItem.reference}</span>
              </div>
              {selectedItem.type === 'delivery' && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('debtors.deliveryLabel')}</span>
                  <span className="font-medium dark:text-white">{(selectedItem as DeliveryDebt).delivery_reference}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('debtors.remainingLabel')}</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedItem.amount_remaining)}</span>
              </div>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('debtors.amountLabel')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-gray-700 dark:text-white"
                    required
                    min="0.01"
                    max={selectedItem.amount_remaining}
                    placeholder="0.00"
                  />
                  <span className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm`}>{t('debtors.currency')}</span>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('debtors.notesOptional')}</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  rows={2}
                  placeholder={t('debtors.notesPlaceholder')}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-5 h-5" />
                  {isSubmittingPayment ? t('debtors.saving') : t('debtors.confirmPayment')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('debtors.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
