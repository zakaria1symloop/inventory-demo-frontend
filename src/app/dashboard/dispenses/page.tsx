'use client';

import { useState, useEffect, useMemo } from 'react';
import { dispensesApi, employeesApi, usersApi } from '@/lib/api';
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
  PencilSquareIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Dispense {
  id: number;
  reference: string;
  employee_id?: number;
  user_id: number;
  date: string;
  category: string;
  amount: number;
  description?: string;
  notes?: string;
  employee?: { id: number; name: string };
  user?: { id: number; name: string; role?: string };
}

interface Employee {
  id: number;
  name: string;
  position?: string;
}

interface Summary {
  total: number;
  by_category: { category: string; total: number }[];
  by_employee: { employee_id: number; total: number; employee?: { name: string } }[];
  monthly: { month: string; total: number }[];
}

const CATEGORY_KEYS: Record<string, string> = {
  salary: 'dispenses.salary',
  advance: 'dispenses.advance',
  transport: 'dispenses.transport',
  maintenance: 'dispenses.maintenance',
  supplies: 'dispenses.supplies',
  utilities: 'dispenses.utilities',
  rent: 'dispenses.rent',
  other: 'dispenses.otherCategory',
};

const ROLE_KEYS: Record<string, string> = {
  admin: 'dispenses.admin',
  manager: 'dispenses.manager',
  seller: 'dispenses.seller',
  livreur: 'dispenses.driver',
  cashvan: 'dispenses.cashvanRole',
};

const initialFormData = {
  employee_id: '',
  date: new Date().toISOString().split('T')[0],
  category: 'other',
  amount: 0,
  description: '',
  notes: '',
};

export default function DispensesPage() {
  const { user } = useAuthStore();
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

  const [dispenses, setDispenses] = useState<Dispense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filteredTotal, setFilteredTotal] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showTour, setShowTour] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Clean old dispenses modal
  const [showCleanModal, setShowCleanModal] = useState(false);
  const [cleanBeforeDate, setCleanBeforeDate] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);

  // Category labels using t()
  const CATEGORIES = useMemo(() => {
    const cats: Record<string, string> = {};
    for (const key of Object.keys(CATEGORY_KEYS)) {
      cats[key] = t(CATEGORY_KEYS[key] as any);
    }
    return cats;
  }, [t]);

  // Role labels using t()
  const roleLabel = useMemo(() => {
    return (role: string) => {
      const key = ROLE_KEYS[role];
      return key ? t(key as any) : role;
    };
  }, [t]);

  // Tour steps with i18n
  const dispensesTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="dispenses-title"]',
      title: t('dispenses.tourTitleStep'),
      desc: t('dispenses.tourTitleDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="dispenses-add"]',
      title: t('dispenses.tourAdd'),
      desc: t('dispenses.tourAddDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="dispenses-kpis"]',
      title: t('dispenses.tourKpis'),
      desc: t('dispenses.tourKpisDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="dispenses-search"]',
      title: t('dispenses.tourSearch'),
      desc: t('dispenses.tourSearchDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="dispenses-quick-filters"]',
      title: t('dispenses.tourQuickFilters'),
      desc: t('dispenses.tourQuickFiltersDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="dispenses-table"]',
      title: t('dispenses.tourTable'),
      desc: t('dispenses.tourTableDesc'),
      position: 'top' as const,
    },
  ], [t]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load users & employees once
  useEffect(() => {
    Promise.all([
      employeesApi.getActive(),
      usersApi.getAll({ per_page: 1000 }),
    ]).then(([empRes, usersRes]) => {
      setEmployees(empRes.data);
      setUsers(usersRes.data.data || usersRes.data || []);
    }).catch(() => {});
  }, []);

  // Fetch dispenses + summary on filter change
  useEffect(() => {
    fetchDispenses();
  }, [page, categoryFilter, userFilter, employeeFilter, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => {
    dispensesApi.getSummary({ date_from: dateFrom || undefined, date_to: dateTo || undefined })
      .then(res => setSummary(res.data))
      .catch(() => {});
  }, [dateFrom, dateTo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setEditingId(null);
        setFormData(initialFormData);
        setShowModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDispenses = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, unknown> = { page, per_page: 20 };
      if (categoryFilter) params.category = categoryFilter;
      if (userFilter) params.user_id = userFilter;
      if (employeeFilter) params.employee_id = employeeFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const response = await dispensesApi.getAll(params);
      const data = response.data;
      setDispenses(data.data || data);
      setTotalPages(data.last_page || 1);
      setTotal(data.total || 0);
      setFilteredTotal(data.filtered_total ?? 0);
    } catch {
      toast.error(t('dispenses.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast.error(t('dispenses.invalidAmount'));
      return;
    }
    setIsSaving(true);
    try {
      const data = { ...formData, employee_id: formData.employee_id || null };
      if (editingId) {
        await dispensesApi.update(editingId, data);
        toast.success(t('dispenses.updateSuccess'));
      } else {
        await dispensesApi.create(data);
        toast.success(t('dispenses.createSuccess'));
      }
      setShowModal(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchDispenses();
    } catch {
      toast.error(t('dispenses.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (dispense: Dispense) => {
    setEditingId(dispense.id);
    setFormData({
      employee_id: dispense.employee_id?.toString() || '',
      date: dispense.date,
      category: dispense.category,
      amount: dispense.amount,
      description: dispense.description || '',
      notes: dispense.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('dispenses.deleteConfirm'))) return;
    try {
      await dispensesApi.delete(id);
      toast.success(t('dispenses.deleteSuccess'));
      fetchDispenses();
    } catch {
      toast.error(t('dispenses.deleteError'));
    }
  };

  const handleCleanOld = async () => {
    if (!cleanBeforeDate) return;
    setIsCleaning(true);
    try {
      const res = await dispensesApi.deleteOld(cleanBeforeDate);
      toast.success(res.data.message || `تم حذف ${res.data.count} مصروف`);
      setShowCleanModal(false);
      setCleanBeforeDate('');
      fetchDispenses();
    } catch {
      toast.error('فشل حذف المصاريف القديمة');
    } finally {
      setIsCleaning(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(value);
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return date; }
  };

  const activeFilterCount = [categoryFilter, userFilter, employeeFilter, dateFrom, dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setUserFilter('');
    setEmployeeFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // KPIs
  const kpis = useMemo(() => {
    const topCategory = summary?.by_category?.sort((a, b) => b.total - a.total)[0];
    return {
      total: filteredTotal,
      count: total,
      topCategory: topCategory ? CATEGORIES[topCategory.category] || topCategory.category : '-',
      topCategoryAmount: topCategory?.total || 0,
    };
  }, [filteredTotal, total, summary, CATEGORIES]);

  return (
    <div>
      <div data-tour="dispenses-title">
        <PageHeader title={t('dispenses.title')} subtitle={t('dispenses.subtitle')}>
          <button
            onClick={() => { localStorage.removeItem('dispenses_tour_step'); setShowTour(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={t('dispenses.tourTitle')}
          >
            {t('dispenses.tourTitle')}
          </button>
          <button
            onClick={() => { setCleanBeforeDate(''); setShowCleanModal(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="حذف المصاريف القديمة"
          >
            <TrashIcon className="w-4 h-4" strokeWidth={1.8} />
            <span className="hidden sm:inline">تنظيف القديمة</span>
          </button>
          <button
            data-tour="dispenses-add"
            onClick={() => { setEditingId(null); setFormData(initialFormData); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" strokeWidth={2} />
            <span className="hidden sm:inline">{t('dispenses.addDispense')}</span>
            <span className="sm:hidden">{t('dispenses.addShort')}</span>
          </button>
        </PageHeader>
      </div>

      {/* ─── Metric tiles ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4" data-tour="dispenses-kpis">
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-red" aria-hidden />
            <p className="metric-label truncate">{t('dispenses.totalAmount')}</p>
          </div>
          <p className="metric-value-currency">{formatCurrency(kpis.total)}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            <p className="metric-label truncate">{t('dispenses.operationsCount')}</p>
          </div>
          <p className="metric-value truncate">{kpis.count}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-orange" aria-hidden />
            <p className="metric-label truncate">{t('dispenses.topCategory')}</p>
          </div>
          <p className="metric-value truncate">{kpis.topCategory}</p>
        </div>
        <div className="metric-tile">
          <div className="flex items-center gap-1.5">
            <span className="metric-dot metric-dot-violet" aria-hidden />
            <p className="metric-label truncate">{t('dispenses.topCategoryAmount')}</p>
          </div>
          <p className="metric-value-currency">{formatCurrency(kpis.topCategoryAmount)}</p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div data-tour="dispenses-search">
        <FilterBar
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder={t('dispenses.search')}
          trailing={activeFilterCount > 0 ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              {t('dispenses.clear')}
            </button>
          ) : undefined}
        >
          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">{t('dispenses.allCategories')}</option>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}>
            <option value="">{t('dispenses.allUsers')}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({roleLabel(u.role)})</option>
            ))}
          </select>
          <select value={employeeFilter} onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}>
            <option value="">{t('dispenses.allEmployees')}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}{emp.position ? ` (${emp.position})` : ''}</option>
            ))}
          </select>
          <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('dispenses.fromDate')} />
          <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('dispenses.toDate')} />
        </FilterBar>
      </div>

      {/* Quick Category Filters */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto" data-tour="dispenses-quick-filters">
        <button
          onClick={() => { setCategoryFilter(''); setPage(1); }}
          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
            !categoryFilter
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {t('dispenses.all')}
        </button>
        {Object.entries(CATEGORIES).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setCategoryFilter(categoryFilter === key ? '' : key); setPage(1); }}
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors ${
              categoryFilter === key
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div data-tour="dispenses-table">
        {isLoading ? (
          <div className="surface-pro flex items-center justify-center py-20">
            <div className="spinner w-8 h-8"></div>
          </div>
        ) : dispenses.length === 0 ? (
          <div className="surface-pro flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <BanknotesIcon className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            <p className="text-[14px] font-medium">{t('dispenses.noDispenses')}</p>
            <p className="text-[12px] mt-1 t-muted">{t('dispenses.noDispensesHint')}</p>
          </div>
        ) : (
          <div className="table-pro-wrap">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>{t('dispenses.reference')}</th>
                  <th>{t('dispenses.date')}</th>
                  <th>{t('dispenses.category')}</th>
                  <th>{t('dispenses.employee')}</th>
                  <th>{t('dispenses.description')}</th>
                  <th className="text-end">{t('dispenses.amount')}</th>
                  <th>{t('dispenses.by')}</th>
                  <th className="text-end w-20"></th>
                </tr>
              </thead>
              <tbody>
                {dispenses.map((disp) => (
                  <tr key={disp.id} className="group">
                    <td>
                      <span className="font-mono font-semibold text-gray-800 dark:text-gray-100">{disp.reference}</span>
                    </td>
                    <td className="tnum t-muted">{formatDate(disp.date)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className="metric-dot metric-dot-neutral" aria-hidden />
                        {CATEGORIES[disp.category] || disp.category}
                      </span>
                    </td>
                    <td>{disp.employee?.name || <span className="t-empty">-</span>}</td>
                    <td className="t-muted max-w-[200px] truncate">
                      {disp.description || <span className="t-empty">-</span>}
                    </td>
                    <td className="tnum t-strong">{formatCurrency(Number(disp.amount))}</td>
                    <td className="t-muted">{disp.user?.name || '-'}</td>
                    <td className="text-end">
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(disp)}
                          className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title={t('dispenses.editDispense')}
                        >
                          <PencilSquareIcon className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                        <button
                          onClick={() => handleDelete(disp.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                          title={t('dispenses.deleteConfirm')}
                        >
                          <TrashIcon className="w-4 h-4" strokeWidth={1.8} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              {t('dispenses.page')} {page} {t('dispenses.of')} {totalPages} — {total} {t('dispenses.dispense')}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {t('dispenses.previous')}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-[12px] font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {t('dispenses.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[640px] max-h-[calc(100vh-3rem)] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center justify-between px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">
                  {editingId ? t('dispenses.editDispense') : t('dispenses.addNew')}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dispenses.dateLabel')} *</label>
                      <DateInput
                        value={formData.date}
                        onChange={(v) => setFormData({ ...formData, date: v })}
                        className="w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dispenses.categoryLabel')} *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="select w-full text-[14px] py-2"
                        required
                      >
                        {Object.entries(CATEGORIES).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dispenses.employeeLabel')}</label>
                      <select
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        className="select w-full text-[14px] py-2"
                      >
                        <option value="">{t('dispenses.noEmployee')}</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dispenses.amountLabel')} *</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="input w-full text-[14px] py-2 tnum"
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dispenses.descriptionLabel')}</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input w-full text-[14px] py-2"
                      placeholder={t('dispenses.descriptionPlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dispenses.notes')}</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input w-full text-[14px] py-2 resize-none"
                      rows={2}
                    />
                  </div>
                </main>
                <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('dispenses.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? t('dispenses.saving') : editingId ? t('dispenses.update') : t('dispenses.save')}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Clean Old Dispenses Modal */}
      {showCleanModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowCleanModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] pointer-events-auto border border-gray-200/80 dark:border-gray-700">
              <header className="flex items-center gap-3 px-5 py-3 border-b border-gray-200/80 dark:border-gray-700">
                <span className="metric-dot metric-dot-red" aria-hidden />
                <h3 className="text-[15px] font-semibold text-gray-900 dark:text-gray-100">حذف المصاريف القديمة</h3>
              </header>
              <main className="p-5 space-y-4">
                <p className="text-[13px] text-gray-600 dark:text-gray-400">
                  سيتم حذف جميع المصاريف قبل التاريخ المحدد بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
                </p>
                <div>
                  <label className="block text-[12px] font-medium text-gray-700 dark:text-gray-300 mb-1">حذف كل المصاريف قبل</label>
                  <DateInput
                    value={cleanBeforeDate}
                    onChange={setCleanBeforeDate}
                    className="w-full"
                  />
                </div>
              </main>
              <footer className="flex gap-2 justify-end px-5 py-3 border-t border-gray-200/80 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/40">
                <button
                  onClick={() => setShowCleanModal(false)}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCleanOld}
                  disabled={!cleanBeforeDate || isCleaning}
                  className="inline-flex items-center gap-2 px-3 py-2 text-[13px] font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCleaning
                    ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><TrashIcon className="w-3.5 h-3.5" strokeWidth={1.8} /> حذف نهائي</>
                  }
                </button>
              </footer>
            </div>
          </div>
        </>
      )}

      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={dispensesTourSteps}
          storageKey="dispenses_tour_step"
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
