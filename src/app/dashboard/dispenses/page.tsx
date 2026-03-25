'use client';

import { useState, useEffect, useMemo } from 'react';
import { dispensesApi, employeesApi, usersApi } from '@/lib/api';
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
  PencilSquareIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  TagIcon,
  ChartBarIcon,
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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  salary: { bg: 'bg-blue-50', text: 'text-blue-700', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-300' },
  advance: { bg: 'bg-violet-50', text: 'text-violet-700', darkBg: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-300' },
  transport: { bg: 'bg-amber-50', text: 'text-amber-700', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-300' },
  maintenance: { bg: 'bg-orange-50', text: 'text-orange-700', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-300' },
  supplies: { bg: 'bg-cyan-50', text: 'text-cyan-700', darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-300' },
  utilities: { bg: 'bg-emerald-50', text: 'text-emerald-700', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-300' },
  rent: { bg: 'bg-pink-50', text: 'text-pink-700', darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-300' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', darkBg: 'dark:bg-gray-700/30', darkText: 'dark:text-gray-300' },
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
  const [showFilters, setShowFilters] = useState(false);
  const [showTour, setShowTour] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

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
      target: '[data-tour="dispenses-filter-btn"]',
      title: t('dispenses.tourFilterBtn'),
      desc: t('dispenses.tourFilterBtnDesc'),
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-tour="dispenses-title">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <BanknotesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('dispenses.title')}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-400 mt-1">{t('dispenses.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { localStorage.removeItem('dispenses_tour_step'); setShowTour(true); }}
            className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
            title={t('dispenses.tourTitle')}
          >
            <span>{t('dispenses.tourTitle')}</span>
          </button>
          <button
            data-tour="dispenses-add"
            onClick={() => { setEditingId(null); setFormData(initialFormData); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl shadow-sm transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dispenses.addDispense')}</span>
            <span className="sm:hidden">{t('dispenses.addShort')}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="dispenses-kpis">
        <div className={`grid grid-cols-2 md:grid-cols-4 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2.5">
                <CurrencyDollarIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{formatCurrency(kpis.total)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('dispenses.totalAmount')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                <DocumentTextIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">{kpis.count}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('dispenses.operationsCount')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-amber-50/40 dark:hover:bg-amber-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-2.5">
                <TagIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{kpis.topCategory}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('dispenses.topCategory')}</div>
            </div>
          </div>
          <div className="group relative p-5 hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-2.5">
                <ChartBarIcon className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-orange-600 dark:text-orange-400 tabular-nums leading-none">{formatCurrency(kpis.topCategoryAmount)}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('dispenses.topCategoryAmount')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filters + Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-1" data-tour="dispenses-search">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={t('dispenses.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input w-full text-sm ${isRTL ? 'pr-9' : 'pl-9'}`}
            />
          </div>
          <button
            data-tour="dispenses-filter-btn"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all ${
              showFilters || activeFilterCount > 0
                ? 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-400'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dispenses.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1">
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dispenses.clear')}</span>
            </button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('dispenses.allCategories')}</option>
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <select
                value={userFilter}
                onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('dispenses.allUsers')}</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({roleLabel(u.role)})</option>
                ))}
              </select>
              <select
                value={employeeFilter}
                onChange={(e) => { setEmployeeFilter(e.target.value); setPage(1); }}
                className="select"
              >
                <option value="">{t('dispenses.allEmployees')}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}{emp.position ? ` (${emp.position})` : ''}</option>
                ))}
              </select>
              <div>{/* spacer for alignment */}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(1); }} placeholder={t('dispenses.fromDate')} />
              <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(1); }} placeholder={t('dispenses.toDate')} />
            </div>
          </div>
        )}

        {/* Quick Category Filters */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto" data-tour="dispenses-quick-filters">
          <button
            onClick={() => { setCategoryFilter(''); setPage(1); }}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              !categoryFilter ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('dispenses.all')}
          </button>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setCategoryFilter(categoryFilter === key ? '' : key); setPage(1); }}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === key ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto" data-tour="dispenses-table">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : dispenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <BanknotesIcon className="w-12 h-12 mb-3" />
              <p className="text-lg font-semibold">{t('dispenses.noDispenses')}</p>
              <p className="text-sm mt-1">{t('dispenses.noDispensesHint')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.reference')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.date')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.category')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.employee')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.description')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.amount')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">{t('dispenses.by')}</th>
                  <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {dispenses.map((disp) => {
                  const catColor = CATEGORY_COLORS[disp.category] || CATEGORY_COLORS.other;
                  return (
                    <tr key={disp.id} className="group hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm font-semibold text-gray-700 dark:text-gray-300">{disp.reference}</span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                        {formatDate(disp.date)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${catColor.bg} ${catColor.text} ${catColor.darkBg} ${catColor.darkText}`}>
                          {CATEGORIES[disp.category] || disp.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                        {disp.employee?.name || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                        {disp.description || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-black tabular-nums text-red-600">
                          {formatCurrency(Number(disp.amount))}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{disp.user?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(disp)}
                            className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title={t('dispenses.editDispense')}
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(disp.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t('dispenses.deleteConfirm')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
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
              {t('dispenses.page')} {page} {t('dispenses.of')} {totalPages} — {total} {t('dispenses.dispense')}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {t('dispenses.previous')}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:text-gray-300"
              >
                {t('dispenses.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full sm:w-[480px] mx-4 max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? t('dispenses.editDispense') : t('dispenses.addNew')}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('dispenses.dateLabel')} *</label>
                  <DateInput
                    value={formData.date}
                    onChange={(v) => setFormData({ ...formData, date: v })}
                    className="input w-full text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('dispenses.categoryLabel')} *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="select w-full text-sm"
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
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('dispenses.employeeLabel')}</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="select w-full text-sm"
                  >
                    <option value="">{t('dispenses.noEmployee')}</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('dispenses.amountLabel')} *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="input w-full text-sm"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('dispenses.descriptionLabel')}</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input w-full text-sm"
                  placeholder={t('dispenses.descriptionPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">{t('dispenses.notes')}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input w-full text-sm"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-l from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl transition-all disabled:opacity-50">
                  {isSaving ? t('dispenses.saving') : editingId ? t('dispenses.update') : t('dispenses.save')}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors">
                  {t('dispenses.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
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
