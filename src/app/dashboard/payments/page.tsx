'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi, usersApi, clientsApi, suppliersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useLocale } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import toast from 'react-hot-toast';
import { PageHeader, FilterBar } from '@/components/dashboard';
import {
  BanknotesIcon,
  XMarkIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface Payment {
  id: number;
  reference: string;
  payable_type: string | null;
  payable_id: number | null;
  amount: number;
  payment_method: 'cash' | 'bank' | 'check' | 'other';
  date: string;
  notes?: string;
  user_id: number;
  user?: { id: number; name: string };
  payable?: {
    id: number;
    reference?: string;
    client?: { id: number; name: string };
    supplier?: { id: number; name: string };
    client_id?: number;
    supplier_id?: number;
  };
}

export default function PaymentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t, locale } = useLocale();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showTour, setShowTour] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [users, setUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [clientFilter, setClientFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);

  const isAdmin = user?.role === 'admin';

  const METHODS = useMemo(() => [
    { value: '', label: t('payments.all') },
    { value: 'cash', label: t('payments.cash') },
    { value: 'bank', label: t('payments.bank') },
    { value: 'check', label: t('payments.check') },
    { value: 'other', label: t('payments.other') },
  ] as const, [t]);

  const TYPES = useMemo(() => [
    { value: '', label: t('payments.all') },
    { value: 'sale', label: t('payments.sales') },
    { value: 'purchase', label: t('payments.purchases') },
    { value: 'debt', label: t('payments.debtCollection') },
  ] as const, [t]);

  const paymentsTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="payments-title"]',
      title: t('payments.tourTitleStep'),
      desc: t('payments.tourTitleDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="payments-kpis"]',
      title: t('payments.tourKpis'),
      desc: t('payments.tourKpisDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="payments-search"]',
      title: t('payments.tourSearch'),
      desc: t('payments.tourSearchDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="payments-quick-filters"]',
      title: t('payments.tourQuickFilters'),
      desc: t('payments.tourQuickFiltersDesc'),
      position: 'bottom',
    },
    {
      target: '[data-tour="payments-table"]',
      title: t('payments.tourTable'),
      desc: t('payments.tourTableDesc'),
      position: 'top',
    },
  ], [t]);

  const ROLE_LABELS: Record<string, string> = useMemo(() => ({
    admin: t('payments.admin'),
    manager: t('payments.manager'),
    seller: t('payments.seller'),
    livreur: t('payments.driver'),
    cashvan: t('payments.cashvan'),
  }), [t]);

  const roleLabel = (role: string) => ROLE_LABELS[role] || role;

  useEffect(() => {
    usersApi.getAll().then(res => {
      const data = res.data?.data || res.data || [];
      setUsers(data);
    }).catch(() => {});
    clientsApi.getAll({ per_page: 10000 }).then(res => {
      setClients(res.data?.data || res.data || []);
    }).catch(() => {});
    suppliersApi.getAll({ per_page: 10000 }).then(res => {
      setSuppliers(res.data?.data || res.data || []);
    }).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter, typeFilter, dateFrom, dateTo, debouncedSearch, userFilter, sourceFilter, clientFilter, supplierFilter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 20 };
      if (methodFilter) params.payment_method = methodFilter;
      if (typeFilter === 'sale') params.payable_type = 'App\\Models\\Sale';
      if (typeFilter === 'purchase') params.payable_type = 'App\\Models\\Purchase';
      if (dateFrom) params.from_date = dateFrom;
      if (dateTo) params.to_date = dateTo;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (userFilter) params.user_id = userFilter;
      if (sourceFilter) params.source = sourceFilter;
      if (clientFilter) params.client_id = clientFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;

      const response = await paymentsApi.getAll(params);
      const data = response.data;
      setPayments(data.data || data);
      setTotalPages(data.last_page || 1);
      setTotal(data.total || (data.data || data).length);
    } catch {
      toast.error(t('payments.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('payments.deleteConfirm'))) return;
    try {
      await paymentsApi.delete(id);
      toast.success(t('payments.deleteSuccess'));
      fetchPayments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('payments.deleteError'));
    }
  };

  const localeCode = locale === 'ar' ? 'ar-DZ' : 'fr-DZ';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(localeCode, { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString(localeCode, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
  };

  const getPayableType = (type: string | null | undefined) => {
    if (!type) return t('payments.debt');
    if (type.includes('Purchase')) return t('payments.purchase');
    if (type.includes('Sale')) return t('payments.sale');
    return type;
  };

  const getPayableTypeDot = (type: string | null | undefined): string => {
    if (!type) return 'metric-dot-violet';
    if (type.includes('Purchase')) return 'metric-dot-red';
    if (type.includes('Sale')) return 'metric-dot-green';
    return 'metric-dot-neutral';
  };

  const getMethodDot = (method: string): string => {
    const dots: Record<string, string> = {
      cash: 'metric-dot-green',
      bank: 'metric-dot-blue',
      check: 'metric-dot-orange',
      other: 'metric-dot-neutral',
    };
    return dots[method] || 'metric-dot-neutral';
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t('payments.cash'),
      bank: t('payments.bank'),
      check: t('payments.check'),
      other: t('payments.other'),
    };
    return labels[method] || method;
  };

  const getPayableLink = (payment: Payment): string | null => {
    const type = payment.payable_type;
    const id = payment.payable_id;
    if (!type || !id) return null;
    if (type.includes('Purchase')) return `/dashboard/purchases/${id}`;
    if (type.includes('Sale')) return `/dashboard/sales/${id}`;
    return null;
  };

  const getPartyName = (payment: Payment): string => {
    if (!payment.payable) {
      // Debt payment — extract client name from notes
      if (payment.notes?.includes('العميل:')) {
        return payment.notes.split('العميل:')[1]?.trim()?.split(' - ')[0] || '-';
      }
      if (payment.notes?.includes('للعميل:')) {
        return payment.notes.split('للعميل:')[1]?.trim()?.split(' - ')[0] || '-';
      }
      return payment.notes?.replace('دفع دين للعميل: ', '').split(' - ')[0] || '-';
    }
    return payment.payable.client?.name || payment.payable.supplier?.name || '-';
  };

  const getPartyType = (payment: Payment): string => {
    if (!payment.payable_type) return t('payments.client');
    if (payment.payable_type.includes('Sale')) return t('payments.client');
    if (payment.payable_type.includes('Purchase')) return t('payments.supplier');
    return '-';
  };

  // Client-side filters (type for debt which has no payable_type)
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesType = !typeFilter || (
        typeFilter === 'sale' ? p.payable_type?.includes('Sale') :
        typeFilter === 'purchase' ? p.payable_type?.includes('Purchase') :
        typeFilter === 'debt' ? !p.payable_type : true
      );
      return matchesType;
    });
  }, [payments, typeFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const totalAmount = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const salesPayments = filteredPayments.filter(p => p.payable_type?.includes('Sale'));
    const purchasePayments = filteredPayments.filter(p => p.payable_type?.includes('Purchase'));
    const salesTotal = salesPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const purchasesTotal = purchasePayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const uniqueUsers = new Set(filteredPayments.map(p => p.user_id)).size;
    return { totalAmount, salesTotal, purchasesTotal, uniqueUsers, count: filteredPayments.length };
  }, [filteredPayments]);

  const activeFilterCount = [methodFilter, typeFilter, userFilter, sourceFilter, dateFrom, dateTo, clientFilter, supplierFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setMethodFilter('');
    setTypeFilter('');
    setUserFilter('');
    setSourceFilter('');
    setClientFilter('');
    setSupplierFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div>
      <div data-tour="payments-title">
        <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')}>
          <button
            onClick={() => { localStorage.removeItem('payments_tour_step'); setShowTour(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={t('payments.tourTitle')}
          >
            {t('payments.tourTitle')}
          </button>
        </PageHeader>
      </div>

      {/* ─── Metric tiles ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4" data-tour="payments-kpis">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            <p className="metric-label truncate">{t('payments.totalAmount')}</p>
          </div>
          <p className="metric-value-currency">{formatCurrency(kpis.totalAmount)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-green" aria-hidden />
            <p className="metric-label truncate">{t('payments.salesCollections')}</p>
          </div>
          <p className="metric-value-currency">{formatCurrency(kpis.salesTotal)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-red" aria-hidden />
            <p className="metric-label truncate">{t('payments.purchasePayments')}</p>
          </div>
          <p className="metric-value-currency">{formatCurrency(kpis.purchasesTotal)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('payments.operationsCount')}</p>
          </div>
          <p className="metric-value truncate">{kpis.count}</p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div data-tour="payments-search">
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('payments.search')}
          trailing={activeFilterCount > 0 ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              {t('payments.clear')}
            </button>
          ) : undefined}
        >
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">{t('payments.allTypes')}</option>
            {TYPES.slice(1).map(tp => (
              <option key={tp.value} value={tp.value}>{tp.label}</option>
            ))}
          </select>
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}>
            <option value="">{t('payments.allMethods')}</option>
            {METHODS.slice(1).map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}>
            <option value="">{t('payments.allUsers')}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({roleLabel(u.role)})</option>
            ))}
          </select>
          <select value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
            <option value="">{t('payments.allSources')}</option>
            <option value="web">{t('payments.fromPlatform')}</option>
            <option value="app">{t('payments.fromApp')}</option>
            <option value="delivery">{t('payments.fromDelivery')}</option>
          </select>
          <select value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setSupplierFilter(''); setPage(1); }}>
            <option value="">{locale === 'ar' ? 'كل العملاء' : 'Tous les clients'}</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={supplierFilter} onChange={(e) => { setSupplierFilter(e.target.value); setClientFilter(''); setPage(1); }}>
            <option value="">{locale === 'ar' ? 'كل الموردين' : 'Tous les fournisseurs'}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('payments.fromDate')} />
          <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('payments.toDate')} />
        </FilterBar>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto" data-tour="payments-quick-filters">
        {METHODS.map(m => (
          <button
            key={m.value}
            onClick={() => { setMethodFilter(methodFilter === m.value ? '' : m.value); setPage(1); }}
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
              methodFilter === m.value || (m.value === '' && !methodFilter)
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />
        {TYPES.slice(1).map(tp => (
          <button
            key={tp.value}
            onClick={() => { setTypeFilter(typeFilter === tp.value ? '' : tp.value); setPage(1); }}
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
              typeFilter === tp.value
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {tp.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div data-tour="payments-table">
        {isLoading ? (
          <div className="surface-pro flex items-center justify-center py-20">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="surface-pro flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <BanknotesIcon className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            <p className="text-[14px] font-medium">{t('payments.noPayments')}</p>
            <p className="text-[12px] mt-1 t-muted">{t('payments.noPaymentsHint')}</p>
          </div>
        ) : (
          <div className="table-pro-wrap">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>{t('payments.reference')}</th>
                  <th>{t('payments.type')}</th>
                  <th>{t('payments.party')}</th>
                  <th className="text-end">{t('payments.amount')}</th>
                  <th>{t('payments.paymentMethod')}</th>
                  <th>{t('payments.date')}</th>
                  <th>{t('payments.user')}</th>
                  <th className="text-end w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const link = getPayableLink(payment);
                  const partyName = getPartyName(payment);
                  const partyType = getPartyType(payment);

                  return (
                    <tr key={payment.id} className="group">
                      <td>
                        {link ? (
                          <button
                            onClick={() => router.push(link)}
                            className="inline-flex items-center gap-1.5 font-mono font-semibold text-gray-800 dark:text-gray-100 hover:underline underline-offset-2"
                          >
                            {payment.reference}
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{payment.reference}</span>
                        )}
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot ${getPayableTypeDot(payment.payable_type)}`} aria-hidden />
                          {getPayableType(payment.payable_type)}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="text-[13px] font-medium text-gray-800 dark:text-gray-100 truncate max-w-[160px]">{partyName}</p>
                          <p className="text-[11px] t-muted">{partyType}</p>
                        </div>
                      </td>
                      <td className="tnum t-strong">{formatCurrency(Number(payment.amount))}</td>
                      <td>
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                          <span className={`metric-dot ${getMethodDot(payment.payment_method)}`} aria-hidden />
                          {getMethodLabel(payment.payment_method)}
                        </span>
                      </td>
                      <td className="tnum t-muted">{formatDate(payment.date)}</td>
                      <td className="t-muted">{payment.user?.name || '-'}</td>
                      <td className="text-end">
                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              title={t('payments.delete')}
                            >
                              <TrashIcon className="w-4 h-4" strokeWidth={1.8} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              {t('payments.page')} {page} {t('payments.of')} {totalPages} — {total} {t('payments.operation')}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {t('payments.previous')}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {t('payments.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={paymentsTourSteps}
          storageKey="payments_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
