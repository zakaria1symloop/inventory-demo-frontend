'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';

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
  const router = useRouter();
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

  const getAgingBadge = (days: number | null): { dot: string; text: string } => {
    if (days === null) return { dot: 'metric-dot-neutral', text: '-' };
    const d = Math.floor(days);
    if (d <= 7) return { dot: 'metric-dot-green', text: `${d} ${t('purchases.day')}` };
    if (d <= 30) return { dot: 'metric-dot-blue', text: `${d} ${t('purchases.day')}` };
    if (d <= 60) return { dot: 'metric-dot-orange', text: `${d} ${t('purchases.day')}` };
    return { dot: 'metric-dot-red', text: `${d} ${t('purchases.day')}` };
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
      <PageHeader
        title={t('purchases.creditorsTitle')}
        subtitle={t('purchases.creditorsSubtitle')}
        breadcrumb={[
          { label: t('purchases.title'), href: '/dashboard/purchases' },
          { label: t('purchases.creditorsTitle') },
        ]}
      >
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined' && window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
              router.back();
            } else {
              router.push('/dashboard/purchases');
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 rtl:rotate-180" strokeWidth={1.8} />
          {t('purchases.backToPurchasesLink')}
        </button>
      </PageHeader>

      {/* ─── Metric tiles ─── */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-neutral" aria-hidden />
              <p className="metric-label truncate">{t('purchases.suppliersCount')}</p>
            </div>
            <p className="metric-value truncate">{totals.total_creditors}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-violet" aria-hidden />
              <p className="metric-label truncate">{t('purchases.totalDue')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(totals.total_due)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-green" aria-hidden />
              <p className="metric-label truncate">{t('purchases.totalPaidAmount')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(totals.total_paid)}</p>
          </div>
          <div className="metric-tile">
            <div className="flex items-center gap-1.5">
              <span className="metric-dot metric-dot-red" aria-hidden />
              <p className="metric-label truncate">{t('purchases.totalRemaining')}</p>
            </div>
            <p className="metric-value-currency">{formatCurrency(totals.total_remaining)}</p>
          </div>
        </div>
      )}

      {/* ─── Filters ─── */}
      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('purchases.searchByNamePhoneCompany')}
      />

      {/* ─── Creditors list ─── */}
      {filteredCreditors.length === 0 ? (
        <div className="surface-pro text-center py-12 text-gray-500 dark:text-gray-400">
          <BanknotesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          <p className="text-[14px] font-medium">{t('purchases.noSuppliersWithDebts')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCreditors.map((creditor) => (
            <div key={creditor.supplier_id} className="surface-pro overflow-hidden">
              {/* Creditor Header */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleExpand(creditor.supplier_id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[15px] font-semibold text-gray-700 dark:text-gray-200">
                      {creditor.supplier_name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{creditor.supplier_name}</h3>
                    <div className="flex items-center gap-3 text-[12px] text-gray-500 dark:text-gray-400 flex-wrap mt-0.5">
                      {creditor.supplier_company && (
                        <span className="flex items-center gap-1">
                          <BuildingOfficeIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {creditor.supplier_company}
                        </span>
                      )}
                      {creditor.supplier_phone && (
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {creditor.supplier_phone}
                        </span>
                      )}
                      {creditor.supplier_address && (
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                          {creditor.supplier_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-center hidden sm:block">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('purchases.invoicesCount')}</p>
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white tnum">{creditor.total_purchases}</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('purchases.dueAmount')}</p>
                    <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 tnum">{formatCurrency(creditor.total_due)}</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('purchases.paidAmountCol')}</p>
                    <p className="text-[14px] font-semibold text-gray-700 dark:text-gray-200 tnum">{formatCurrency(creditor.total_paid)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{t('purchases.remainingCol')}</p>
                    <p className="text-[14px] font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(creditor.total_remaining)}</p>
                  </div>
                  {expandedSupplier === creditor.supplier_id ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" strokeWidth={1.8} />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSupplier === creditor.supplier_id && (
                <div className="p-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/30">
                  {loadingSupplierDebt ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="spinner"></div>
                    </div>
                  ) : supplierDebt ? (
                    <div>
                      <h4 className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('purchases.unpaidInvoices')}</h4>
                      <div className="table-pro-wrap">
                        <table className="table-pro compact">
                          <thead>
                            <tr>
                              <th>{t('purchases.reference')}</th>
                              <th>{t('purchases.warehouse')}</th>
                              <th className="text-end">{t('purchases.date')}</th>
                              <th>{t('purchases.age')}</th>
                              <th className="text-end">{t('purchases.dueAmount')}</th>
                              <th className="text-end">{t('purchases.paidAmountCol')}</th>
                              <th className="text-end">{t('purchases.remainingCol')}</th>
                              <th className="text-end">{t('purchases.actions')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplierDebt.purchases.map((purchase) => {
                              const agingBadge = getAgingBadge(purchase.days_old);
                              return (
                                <tr key={purchase.id}>
                                  <td>
                                    <Link
                                      href={`/dashboard/purchases/${purchase.id}`}
                                      className="font-mono font-semibold text-gray-800 dark:text-gray-100 hover:underline underline-offset-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {purchase.reference}
                                    </Link>
                                  </td>
                                  <td className="t-muted">{purchase.warehouse_name}</td>
                                  <td className="tnum t-muted">{formatDate(purchase.date)}</td>
                                  <td>
                                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                                      <span className={`metric-dot ${agingBadge.dot}`} aria-hidden />
                                      {agingBadge.text}
                                    </span>
                                  </td>
                                  <td className="tnum t-strong">{formatCurrency(purchase.grand_total)}</td>
                                  <td className="tnum">{formatCurrency(purchase.paid_amount)}</td>
                                  <td className="tnum t-strong">{formatCurrency(purchase.due_amount)}</td>
                                  <td className="text-end">
                                    <div className="inline-flex gap-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPaymentModal(purchase);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        title={t('purchases.partialPayTitle')}
                                      >
                                        <CurrencyDollarIcon className="w-3.5 h-3.5" strokeWidth={1.8} />
                                        {t('purchases.partialPay')}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePayFull(purchase);
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                                        title={t('purchases.fullPayTitle')}
                                      >
                                        <CheckIcon className="w-3.5 h-3.5" strokeWidth={2} />
                                        {t('purchases.fullPay')}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="font-semibold">
                              <td colSpan={4} className="t-strong">{t('purchases.totalLabel')}</td>
                              <td className="tnum t-strong">{formatCurrency(supplierDebt.totals.total_due)}</td>
                              <td className="tnum t-strong">{formatCurrency(supplierDebt.totals.total_paid)}</td>
                              <td className="tnum t-strong">{formatCurrency(supplierDebt.totals.total_remaining)}</td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-[13px]">{t('purchases.noData')}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-md p-5 w-full max-w-md mx-4 shadow-2xl border border-gray-200/80 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('purchases.supplierPaymentTitle')}</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="surface-pro p-3 mb-4 text-[13px]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.invoice')}</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">{selectedPurchase.reference}</span>
              </div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">{t('purchases.date')}</span>
                <span className="font-medium text-gray-700 dark:text-gray-200 tnum">{formatDate(selectedPurchase.date)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-200 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-200">{t('purchases.remainingCol')}</span>
                <span className="font-semibold text-gray-900 dark:text-white tnum">{formatCurrency(selectedPurchase.due_amount)}</span>
              </div>
            </div>

            <form onSubmit={handlePayment}>
              <div className="mb-3">
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.amount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input w-full text-[14px] py-2 font-semibold tnum"
                    required
                    min="0.01"
                    max={selectedPurchase.due_amount}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.paymentMethodLabel')}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="select w-full text-[14px] py-2"
                    required
                  >
                    <option value="cash">{t('purchases.cash')}</option>
                    <option value="bank">{t('purchases.bankTransfer')}</option>
                    <option value="check">{t('purchases.check')}</option>
                    <option value="other">{t('purchases.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.date')}</label>
                  <DateInput
                    value={paymentDate}
                    onChange={(v) => setPaymentDate(v)}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('purchases.notes')} ({t('purchases.optional')})</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="input w-full text-[14px] py-2 resize-none"
                  rows={2}
                  placeholder={t('purchases.addNote')}
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('purchases.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-4 h-4" />
                  {isSubmittingPayment ? t('purchases.saving') : t('purchases.confirmPaymentBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
