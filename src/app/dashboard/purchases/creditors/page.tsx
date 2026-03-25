'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { creditorsApi, purchasesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  BanknotesIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface Creditor {
  supplier_id: number;
  supplier_name: string;
  supplier_phone: string;
  supplier_company: string;
  supplier_address: string;
  total_due: number;
  total_paid: number;
  total_remaining: number;
  total_purchases: number;
  supplier_balance: number;
}

interface CreditorsTotals {
  total_creditors: number;
  total_due: number;
  total_paid: number;
  total_remaining: number;
}

interface DebtPurchase {
  id: number;
  reference: string;
  warehouse_name: string;
  date: string;
  status: string;
  payment_status: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  days_old: number | null;
}

interface SupplierDebtDetails {
  supplier: {
    id: number;
    name: string;
    phone: string;
    company_name: string;
    address: string;
    balance: number;
  } | null;
  purchases: DebtPurchase[];
  totals: {
    total_due: number;
    total_paid: number;
    total_remaining: number;
  };
}

export default function CreditorsPage() {
  const { t, locale, dir } = useLocale();
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [totals, setTotals] = useState<CreditorsTotals | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [supplierDebt, setSupplierDebt] = useState<SupplierDebtDetails | null>(null);
  const [loadingSupplierDebt, setLoadingSupplierDebt] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<DebtPurchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchCreditors();
  }, []);

  const fetchCreditors = async () => {
    try {
      const response = await creditorsApi.getAll();
      setCreditors(response.data.data || []);
      setTotals(response.data.totals);
    } catch (error) {
      toast.error(t('purchases.dataLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupplierDebt = async (supplierId: number) => {
    setLoadingSupplierDebt(true);
    try {
      const response = await creditorsApi.getSupplierDebt(supplierId);
      setSupplierDebt(response.data);
    } catch (error) {
      toast.error(t('purchases.debtLoadError'));
    } finally {
      setLoadingSupplierDebt(false);
    }
  };

  const toggleExpand = (supplierId: number) => {
    if (expandedSupplier === supplierId) {
      setExpandedSupplier(null);
      setSupplierDebt(null);
    } else {
      setExpandedSupplier(supplierId);
      fetchSupplierDebt(supplierId);
    }
  };

  const openPaymentModal = (purchase: DebtPurchase) => {
    setSelectedPurchase(purchase);
    setPaymentAmount(purchase.due_amount.toString());
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPurchase) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error(t('purchases.validAmountError'));
      return;
    }

    if (amount > selectedPurchase.due_amount) {
      toast.error(t('purchases.amountExceedsError'));
      return;
    }

    setIsSubmittingPayment(true);
    try {
      await purchasesApi.addPayment(selectedPurchase.id, {
        amount,
        payment_method: paymentMethod,
        date: paymentDate,
        notes: paymentNotes,
      });
      toast.success(t('purchases.paymentSuccessful'));
      setShowPaymentModal(false);

      // Refresh data
      fetchCreditors();
      if (expandedSupplier) {
        fetchSupplierDebt(expandedSupplier);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.paymentError');
      toast.error(message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handlePayFull = async (purchase: DebtPurchase) => {
    if (!confirm(t('purchases.fullPayConfirm', { amount: formatCurrency(purchase.due_amount) }))) return;

    try {
      await purchasesApi.addPayment(purchase.id, {
        amount: parseFloat(String(purchase.due_amount)),
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0],
        notes: t('purchases.fullPaymentNote'),
      });
      toast.success(t('purchases.paymentSuccessful'));

      // Refresh data
      fetchCreditors();
      if (expandedSupplier) {
        fetchSupplierDebt(expandedSupplier);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t('purchases.paymentError');
      toast.error(message);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');
  };

  const getAgingBadge = (days: number | null) => {
    if (days === null) return { class: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200', text: '-' };
    if (days <= 7) return { class: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300', text: `${days} ${t('purchases.day')}` };
    if (days <= 30) return { class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300', text: `${days} ${t('purchases.day')}` };
    if (days <= 60) return { class: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300', text: `${days} ${t('purchases.day')}` };
    return { class: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300', text: `${days} ${t('purchases.day')}` };
  };

  const filteredCreditors = creditors.filter(c => {
    return c.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.supplier_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.supplier_company?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t('purchases.creditorsTitle')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{t('purchases.creditorsSubtitle')}</p>
        </div>
        <Link
          href="/dashboard/purchases"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('purchases.backToPurchasesLink')}
        </Link>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.suppliersCount')}</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totals.total_creditors}</p>
              </div>
            </div>
          </div>

          <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                <BanknotesIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.totalDue')}</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(totals.total_due)}</p>
              </div>
            </div>
          </div>

          <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.totalPaidAmount')}</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.total_paid)}</p>
              </div>
            </div>
          </div>

          <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.totalRemaining')}</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.total_remaining)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder={t('purchases.searchByNamePhoneCompany')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
        </div>

        {filteredCreditors.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <BanknotesIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-lg">{t('purchases.noSuppliersWithDebts')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCreditors.map((creditor) => (
              <div key={creditor.supplier_id} className="border dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Creditor Header */}
                <div
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  onClick={() => toggleExpand(creditor.supplier_id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {creditor.supplier_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{creditor.supplier_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {creditor.supplier_company && (
                          <span className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-4 h-4" />
                            {creditor.supplier_company}
                          </span>
                        )}
                        {creditor.supplier_phone && (
                          <span className="flex items-center gap-1">
                            <PhoneIcon className="w-4 h-4" />
                            {creditor.supplier_phone}
                          </span>
                        )}
                        {creditor.supplier_address && (
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-4 h-4" />
                            {creditor.supplier_address}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.invoicesCount')}</p>
                      <p className="font-bold">{creditor.total_purchases}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.dueAmount')}</p>
                      <p className="font-bold text-yellow-600 dark:text-yellow-400">{formatCurrency(creditor.total_due)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.paidAmountCol')}</p>
                      <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(creditor.total_paid)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('purchases.remainingCol')}</p>
                      <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(creditor.total_remaining)}</p>
                    </div>
                    {expandedSupplier === creditor.supplier_id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSupplier === creditor.supplier_id && (
                  <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
                    {loadingSupplierDebt ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="spinner"></div>
                      </div>
                    ) : supplierDebt ? (
                      <div className="overflow-x-auto">
                        <h4 className="font-bold mb-4">{t('purchases.unpaidInvoices')}</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th className="whitespace-nowrap px-2">{t('purchases.reference')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.warehouse')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.date')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.age')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.dueAmount')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.paidAmountCol')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.remainingCol')}</th>
                              <th className="whitespace-nowrap px-2">{t('purchases.actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplierDebt.purchases.map((purchase) => {
                              const agingBadge = getAgingBadge(purchase.days_old);
                              return (
                                <tr key={purchase.id}>
                                  <td className="px-2 whitespace-nowrap">
                                    <Link
                                      href={`/dashboard/purchases/${purchase.id}`}
                                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {purchase.reference}
                                    </Link>
                                  </td>
                                  <td className="px-2 whitespace-nowrap">{purchase.warehouse_name}</td>
                                  <td className="px-2 whitespace-nowrap">{formatDate(purchase.date)}</td>
                                  <td className="px-2 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs ${agingBadge.class}`}>
                                      {agingBadge.text}
                                    </span>
                                  </td>
                                  <td className="px-2 whitespace-nowrap">{formatCurrency(purchase.grand_total)}</td>
                                  <td className="px-2 whitespace-nowrap text-green-600 dark:text-green-400">{formatCurrency(purchase.paid_amount)}</td>
                                  <td className="px-2 whitespace-nowrap text-red-600 dark:text-red-400 font-bold">{formatCurrency(purchase.due_amount)}</td>
                                  <td className="px-2">
                                    <div className="flex gap-1 justify-center">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPaymentModal(purchase);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                        title={t('purchases.partialPayTitle')}
                                      >
                                        <CurrencyDollarIcon className="w-3.5 h-3.5" />
                                        {t('purchases.partialPay')}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePayFull(purchase);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                                        title={t('purchases.fullPayTitle')}
                                      >
                                        <CheckIcon className="w-3.5 h-3.5" />
                                        {t('purchases.fullPay')}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-bold">
                            <tr>
                              <td colSpan={4} className="px-2">{t('purchases.totalLabel')}</td>
                              <td className="px-2">{formatCurrency(supplierDebt.totals.total_due)}</td>
                              <td className="px-2 text-green-600 dark:text-green-400">{formatCurrency(supplierDebt.totals.total_paid)}</td>
                              <td className="px-2 text-red-600 dark:text-red-400">{formatCurrency(supplierDebt.totals.total_remaining)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('purchases.noData')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold">{t('purchases.supplierPaymentTitle')}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('purchases.invoice')}</span>
                <span className="font-medium">{selectedPurchase.reference}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('purchases.date')}</span>
                <span className="font-medium">{formatDate(selectedPurchase.date)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('purchases.remainingCol')}</span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedPurchase.due_amount)}</span>
              </div>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('purchases.amount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-4 py-3 text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                    min="0.01"
                    max={selectedPurchase.due_amount}
                    placeholder="0.00"
                  />
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm">{t('purchases.currency')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('purchases.paymentMethodLabel')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    required
                  >
                    <option value="cash">{t('purchases.cash')}</option>
                    <option value="bank">{t('purchases.bankTransfer')}</option>
                    <option value="check">{t('purchases.check')}</option>
                    <option value="other">{t('purchases.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('purchases.date')}</label>
                  <DateInput
                    value={paymentDate}
                    onChange={(v) => setPaymentDate(v)}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('purchases.notes')} ({t('purchases.optional')})</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  rows={2}
                  placeholder={t('purchases.addNote')}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-5 h-5" />
                  {isSubmittingPayment ? t('purchases.saving') : t('purchases.confirmPaymentBtn')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('purchases.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
