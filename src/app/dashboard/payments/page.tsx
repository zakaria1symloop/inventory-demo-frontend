'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { paymentsApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useLocale } from '@/lib/i18n/context';
import DateInput from '@/components/ui/DateInput';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import toast from 'react-hot-toast';
import {
  BanknotesIcon,
  FunnelIcon,
  XMarkIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
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
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
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
  const [showFilters, setShowFilters] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [users, setUsers] = useState<{ id: number; name: string; role: string }[]>([]);

  const isAdmin = user?.role === 'admin';

  const METHODS = useMemo(() => [
    { value: '', label: t('payments.all') },
    { value: 'cash', label: t('payments.cash'), color: 'emerald' },
    { value: 'bank', label: t('payments.bank'), color: 'blue' },
    { value: 'check', label: t('payments.check'), color: 'amber' },
    { value: 'other', label: t('payments.other'), color: 'gray' },
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
      target: '[data-tour="payments-filter-btn"]',
      title: t('payments.tourFilterBtn'),
      desc: t('payments.tourFilterBtnDesc'),
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
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchPayments();
  }, [page, methodFilter, typeFilter, dateFrom, dateTo, debouncedSearch, userFilter, sourceFilter]);

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

  const getPayableTypeColor = (type: string | null | undefined) => {
    if (!type) return 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/30';
    if (type.includes('Purchase')) return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    if (type.includes('Sale')) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30';
    return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
  };

  const getMethodStyle = (method: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      cash: { bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-400', label: t('payments.cash') },
      bank: { bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-400', label: t('payments.bank') },
      check: { bg: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400', label: t('payments.check') },
      other: { bg: 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600', text: 'text-gray-700 dark:text-gray-400', label: t('payments.other') },
    };
    return styles[method] || styles.other;
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

  const activeFilterCount = [methodFilter, typeFilter, userFilter, sourceFilter, dateFrom, dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setMethodFilter('');
    setTypeFilter('');
    setUserFilter('');
    setSourceFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="payments-title">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <BanknotesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('payments.title')}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">{t('payments.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem('payments_tour_step'); setShowTour(true); }}
          className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors"
          title={t('payments.tourTitle')}
        >
          {t('payments.tourTitle')}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="payments-kpis">
        <div className={`grid grid-cols-2 md:grid-cols-4 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          <div className="group relative p-5 hover:bg-cyan-50/40 dark:hover:bg-cyan-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 mb-2.5">
                <CurrencyDollarIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{formatCurrency(kpis.totalAmount)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('payments.totalAmount')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2.5">
                <ArrowTrendingUpIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">{formatCurrency(kpis.salesTotal)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('payments.salesCollections')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2.5">
                <ArrowTrendingDownIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{formatCurrency(kpis.purchasesTotal)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('payments.purchasePayments')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                <DocumentTextIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">{kpis.count}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('payments.operationsCount')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1" data-tour="payments-search">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
            <input
              type="text"
              placeholder={t('payments.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input w-full ${isRTL ? 'pr-9' : 'pl-9'} text-sm`}
            />
          </div>
          <button
            data-tour="payments-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('payments.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('payments.clear')}</span>
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('payments.allTypes')}</option>
                {TYPES.slice(1).map(tp => (
                  <option key={tp.value} value={tp.value}>{tp.label}</option>
                ))}
              </select>
              <select
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('payments.allMethods')}</option>
                {METHODS.slice(1).map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('payments.allUsers')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({roleLabel(u.role)})</option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('payments.allSources')}</option>
                <option value="web">{t('payments.fromPlatform')}</option>
                <option value="app">{t('payments.fromApp')}</option>
                <option value="delivery">{t('payments.fromDelivery')}</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('payments.fromDate')} />
              <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('payments.toDate')} />
            </div>
          </div>
        )}

        {/* Payment Method Quick Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="payments-quick-filters">
          {METHODS.map(m => (
            <button
              key={m.value}
              onClick={() => { setMethodFilter(methodFilter === m.value ? '' : m.value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                methodFilter === m.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {m.label}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1" />
          {TYPES.slice(1).map(tp => (
            <button
              key={tp.value}
              onClick={() => { setTypeFilter(typeFilter === tp.value ? '' : tp.value); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === tp.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto" data-tour="payments-table">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <BanknotesIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">{t('payments.noPayments')}</p>
              <p className="text-sm mt-1">{t('payments.noPaymentsHint')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.reference')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.type')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.party')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.amount')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.paymentMethod')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.date')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('payments.user')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredPayments.map((payment) => {
                  const methodStyle = getMethodStyle(payment.payment_method);
                  const link = getPayableLink(payment);
                  const partyName = getPartyName(payment);
                  const partyType = getPartyType(payment);

                  return (
                    <tr key={payment.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                      {/* Reference */}
                      <td className="px-4 py-3.5">
                        {link ? (
                          <button
                            onClick={() => router.push(link)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-sm font-semibold"
                          >
                            {payment.reference}
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{payment.reference}</span>
                        )}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${getPayableTypeColor(payment.payable_type)}`}>
                          {getPayableType(payment.payable_type)}
                        </span>
                      </td>

                      {/* Party */}
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-300 truncate max-w-[160px]">{partyName}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">{partyType}</p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-black tabular-nums ${
                          payment.payable_type?.includes('Purchase') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatCurrency(Number(payment.amount))}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${methodStyle.bg} ${methodStyle.text}`}>
                          {methodStyle.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                        {formatDate(payment.date)}
                      </td>

                      {/* User */}
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{payment.user?.name || '-'}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(payment.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title={t('payments.delete')}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('payments.page')} {page} {t('payments.of')} {totalPages} — {total} {t('payments.operation')}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('payments.previous')}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
