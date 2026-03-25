'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { useLocale } from '@/lib/i18n/context';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  UsersIcon,
  TruckIcon,
  ShoppingCartIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  can_collect_debt: boolean;
  created_at: string;
}

const roleConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  livreur: {
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: <TruckIcon className="w-4 h-4" />,
  },
  seller: {
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    icon: <ShoppingCartIcon className="w-4 h-4" />,
  },
  cashvan: {
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    icon: <DevicePhoneMobileIcon className="w-4 h-4" />,
  },
};

export default function DriversPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const queryClient = useQueryClient();
  const tenantName = useAuthStore((s) => s.tenantName);
  const emailSuffix = tenantName ? `@${tenantName}.com` : '';
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'livreur',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: '',
  });

  const roleLabels: Record<string, string> = {
    livreur: t('drivers.roleLivreur'),
    seller: t('drivers.roleSeller'),
    cashvan: t('drivers.roleCashvan'),
  };

  const driversTourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="drivers-title"]',
      title: t('drivers.tourTitleEmployees'),
      desc: t('drivers.tourDescEmployees'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="drivers-add"]',
      title: t('drivers.tourTitleAdd'),
      desc: t('drivers.tourDescAdd'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="drivers-kpis"]',
      title: t('drivers.tourTitleKpis'),
      desc: t('drivers.tourDescKpis'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="drivers-chips"]',
      title: t('drivers.tourTitleChips'),
      desc: t('drivers.tourDescChips'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="drivers-list"]',
      title: t('drivers.tourTitleList'),
      desc: t('drivers.tourDescList'),
      position: 'top' as const,
    },
  ], [t]);

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', page, search, roleFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page: 15 };
      if (roleFilter === 'all') {
        params.roles = 'livreur,seller,cashvan';
      } else {
        params.role = roleFilter;
      }
      if (search) params.search = search;
      const response = await usersApi.getAll(params);
      return response.data;
    },
  });

  const drivers: Driver[] = data?.data || [];
  const pagination = data ? {
    currentPage: data.current_page,
    lastPage: data.last_page,
    total: data.total,
    perPage: data.per_page,
  } : null;

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('drivers.toastAddSuccess'));
      closeModal();
    },
    onError: () => toast.error(t('drivers.toastAddError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('drivers.toastUpdateSuccess'));
      closeModal();
    },
    onError: () => toast.error(t('drivers.toastUpdateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('drivers.toastDeleteSuccess'));
      setIsDeleteOpen(false);
      setSelectedDriver(null);
    },
    onError: () => toast.error(t('drivers.toastDeleteError')),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('drivers.toastStatusUpdated'));
    },
    onError: () => toast.error(t('drivers.toastGenericError')),
  });

  const toggleCollectDebtMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleCollectDebt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(t('drivers.toastDebtUpdated'));
    },
    onError: () => toast.error(t('drivers.toastGenericError')),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { password: string; password_confirmation: string } }) =>
      usersApi.resetPassword(id, data),
    onSuccess: () => {
      toast.success(t('drivers.toastPasswordChanged'));
      setIsPasswordModalOpen(false);
      setSelectedDriver(null);
      setPasswordData({ password: '', password_confirmation: '' });
    },
    onError: () => toast.error(t('drivers.toastPasswordError')),
  });

  const openModal = (driver?: Driver) => {
    if (driver) {
      setSelectedDriver(driver);
      const editEmail = (tenantName && driver.email.endsWith(`@${tenantName}.com`))
        ? driver.email.replace(`@${tenantName}.com`, '')
        : driver.email;
      setFormData({
        name: driver.name,
        email: editEmail,
        phone: driver.phone || '',
        password: '',
        role: driver.role,
      });
    } else {
      setSelectedDriver(null);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'livreur' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
    setFormData({ name: '', email: '', phone: '', password: '', role: 'livreur' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = tenantName
      ? formData.email.replace(emailSuffix, '') + emailSuffix
      : formData.email;

    if (selectedDriver) {
      const updateData: Record<string, unknown> = {
        name: formData.name,
        email,
        phone: formData.phone,
      };
      updateMutation.mutate({ id: selectedDriver.id, data: updateData });
    } else {
      if (!formData.password) {
        toast.error(t('drivers.toastPasswordRequired'));
        return;
      }
      createMutation.mutate({ ...formData, email });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error(t('drivers.toastPasswordMismatch'));
      return;
    }
    if (passwordData.password.length < 6) {
      toast.error(t('drivers.toastPasswordMinLength'));
      return;
    }
    if (selectedDriver) {
      resetPasswordMutation.mutate({ id: selectedDriver.id, data: passwordData });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        openModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // KPI counts from current data (page-level counts)
  const activeCount = drivers.filter(d => d.is_active).length;
  const inactiveCount = drivers.filter(d => !d.is_active).length;
  const livreurCount = drivers.filter(d => d.role === 'livreur').length;
  const sellerCount = drivers.filter(d => d.role === 'seller').length;
  const cashvanCount = drivers.filter(d => d.role === 'cashvan').length;

  if (isLoading && !data) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-5">
      {showTour && (
        <GuidedTour
          steps={driversTourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="drivers_tour_step"
        />
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3">
        <div data-tour="drivers-title" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-slate-500/20">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('drivers.pageTitle')}</h1>
            <p className="text-sm text-gray-400 mt-1.5">{t('drivers.pageSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            title={t('drivers.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-5 h-5" />
            {t('drivers.tourButton')}
          </button>
          <button
            onClick={() => openModal()}
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-600/20 hover:shadow-lg hover:shadow-cyan-600/30 active:scale-[0.98] transition-all duration-200"
            data-tour="drivers-add"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">{t('drivers.addEmployee')}</span>
            <span className="sm:hidden">{t('drivers.addShort')}</span>
            <kbd className="hidden sm:inline bg-white/20 px-1.5 py-0.5 rounded-md text-[10px] font-mono">Insert</kbd>
          </button>
        </div>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden" data-tour="drivers-kpis">
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          {/* Total */}
          <div className="group relative p-5 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-slate-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 mb-2.5">
                <span className="text-sm font-black">#</span>
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{pagination?.total || drivers.length}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('drivers.kpiTotal')}</div>
            </div>
          </div>

          {/* Livreurs */}
          <div className="group relative p-5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors duration-200 cursor-pointer" onClick={() => { setRoleFilter(roleFilter === 'livreur' ? 'all' : 'livreur'); setPage(1); }}>
            <div className="absolute top-0 inset-x-0 h-[3px] bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2.5">
                <TruckIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums leading-none">{livreurCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('drivers.kpiLivreurs')}</div>
            </div>
          </div>

          {/* Sellers */}
          <div className="group relative p-5 hover:bg-purple-50/40 dark:hover:bg-purple-900/10 transition-colors duration-200 cursor-pointer" onClick={() => { setRoleFilter(roleFilter === 'seller' ? 'all' : 'seller'); setPage(1); }}>
            <div className="absolute top-0 inset-x-0 h-[3px] bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-2.5">
                <ShoppingCartIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-purple-600 dark:text-purple-400 tabular-nums leading-none">{sellerCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('drivers.kpiSellers')}</div>
            </div>
          </div>

          {/* Cashvan */}
          <div className="group relative p-5 hover:bg-orange-50/40 dark:hover:bg-orange-900/10 transition-colors duration-200 cursor-pointer" onClick={() => { setRoleFilter(roleFilter === 'cashvan' ? 'all' : 'cashvan'); setPage(1); }}>
            <div className="absolute top-0 inset-x-0 h-[3px] bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-2.5">
                <DevicePhoneMobileIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 tabular-nums leading-none">{cashvanCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('drivers.kpiCashvan')}</div>
            </div>
          </div>

          {/* Active/Inactive */}
          <div className="group relative p-5 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-2.5">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black tabular-nums leading-none">
                <span className="text-emerald-600 dark:text-emerald-400">{activeCount}</span>
                <span className="text-gray-300 dark:text-gray-600 mx-1">/</span>
                <span className="text-red-500 dark:text-red-400 text-lg">{inactiveCount}</span>
              </div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('drivers.kpiActiveInactive')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search + Role Chips ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3" data-tour="drivers-chips">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('drivers.searchPlaceholder')}
            className={`input ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
          />
        </div>

        {/* Role chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => { setRoleFilter('all'); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              roleFilter === 'all'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('drivers.filterAll')}
          </button>
          <button
            onClick={() => { setRoleFilter(roleFilter === 'livreur' ? 'all' : 'livreur'); setPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              roleFilter === 'livreur'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
            }`}
          >
            <TruckIcon className="w-3.5 h-3.5" />
            {t('drivers.filterLivreurs')}
          </button>
          <button
            onClick={() => { setRoleFilter(roleFilter === 'seller' ? 'all' : 'seller'); setPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              roleFilter === 'seller'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
            }`}
          >
            <ShoppingCartIcon className="w-3.5 h-3.5" />
            {t('drivers.filterSellers')}
          </button>
          <button
            onClick={() => { setRoleFilter(roleFilter === 'cashvan' ? 'all' : 'cashvan'); setPage(1); }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${
              roleFilter === 'cashvan'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
            }`}
          >
            <DevicePhoneMobileIcon className="w-3.5 h-3.5" />
            {t('drivers.filterCashvan')}
          </button>
        </div>
      </div>

      {/* ─── Drivers List ─── */}
      <div data-tour="drivers-list">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {pagination?.total || drivers.length} {t('drivers.employeeCount')}
          </span>
        </div>

        {drivers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('drivers.noEmployees')}</p>
            <button onClick={() => openModal()} className="mt-3 text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 font-bold">
              {t('drivers.addFirstEmployee')}
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {drivers.map((driver) => {
              const role = roleConfig[driver.role] || roleConfig.livreur;

              return (
                <div
                  key={driver.id}
                  className="group rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Role color strip */}
                    <div className={`sm:w-1.5 h-1.5 sm:h-auto ${
                      driver.role === 'livreur' ? 'bg-blue-500' :
                      driver.role === 'seller' ? 'bg-purple-500' :
                      'bg-orange-500'
                    }`} />

                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Avatar + Name */}
                        <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
                          <div className={`w-10 h-10 rounded-xl ${role.bgColor} flex items-center justify-center ${role.color}`}>
                            {role.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{driver.name}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${role.bgColor} ${role.color}`}>
                                {roleLabels[driver.role] || driver.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              <span className="flex items-center gap-1" dir="ltr">
                                <EnvelopeIcon className="w-3 h-3" />
                                {driver.email}
                              </span>
                              {driver.phone && (
                                <span className="flex items-center gap-1" dir="ltr">
                                  <PhoneIcon className="w-3 h-3" />
                                  {driver.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status + Debt toggle */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => toggleActiveMutation.mutate(driver.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                              driver.is_active
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
                            }`}
                          >
                            {driver.is_active ? (
                              <>
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                {t('drivers.statusActive')}
                              </>
                            ) : (
                              <>
                                <XCircleIcon className="w-3.5 h-3.5" />
                                {t('drivers.statusInactive')}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => toggleCollectDebtMutation.mutate(driver.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                              driver.can_collect_debt
                                ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/30'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={t('drivers.debtCollectTitle')}
                          >
                            <BanknotesIcon className="w-3.5 h-3.5" />
                            {driver.can_collect_debt ? t('drivers.debtCollectEnabled') : t('drivers.debtCollectDisabled')}
                          </button>
                        </div>

                        {/* Date */}
                        <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {formatDate(driver.created_at)}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => openModal(driver)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                            title={t('drivers.editTitle')}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setIsPasswordModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all"
                            title={t('drivers.changePasswordTitle')}
                          >
                            <KeyIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setIsDeleteOpen(true);
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
                            title={t('drivers.deleteTitle')}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.lastPage > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('drivers.previous')}
            </button>
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.lastPage || Math.abs(p - page) <= 2)
              .map((pg, i, arr) => (
                <span key={pg} className="flex items-center">
                  {i > 0 && arr[i - 1] !== pg - 1 && (
                    <span className="px-1.5 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${
                      pg === page
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pg}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(Math.min(pagination.lastPage, page + 1))}
              disabled={page === pagination.lastPage}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('drivers.next')}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedDriver ? t('drivers.modalTitleEdit') : t('drivers.modalTitleAdd')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
              {t('drivers.labelType')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'livreur', label: t('drivers.roleLivreur'), icon: <TruckIcon className="w-5 h-5" />, color: 'blue' },
                { value: 'seller', label: t('drivers.roleSeller'), icon: <ShoppingCartIcon className="w-5 h-5" />, color: 'purple' },
                { value: 'cashvan', label: t('drivers.roleCashvan'), icon: <DevicePhoneMobileIcon className="w-5 h-5" />, color: 'orange' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => !selectedDriver && setFormData({ ...formData, role: opt.value })}
                  disabled={!!selectedDriver}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    formData.role === opt.value
                      ? opt.color === 'blue'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : opt.color === 'purple'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                        : 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${selectedDriver ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {opt.icon}
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
              {t('drivers.labelName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
              placeholder={t('drivers.placeholderFullName')}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
              {t('drivers.labelEmail')} <span className="text-red-500">*</span>
            </label>
            {tenantName ? (
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={formData.email.replace(emailSuffix, '')}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.replace(/[@\s]/g, '') })}
                  className={`input ${isRTL ? 'rounded-s-none' : 'rounded-e-none'} flex-1`}
                  placeholder={t('drivers.placeholderUsername')}
                  required
                  dir="ltr"
                />
                <span className={`inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 border ${isRTL ? 'border-l-0' : 'border-r-0'} border-gray-300 dark:border-gray-600 ${isRTL ? 'rounded-e-lg' : 'rounded-s-lg'} text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap`} dir="ltr">
                  {emailSuffix}
                </span>
              </div>
            ) : (
              <input
                type="text"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
                dir="ltr"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">{t('drivers.labelPhone')}</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
              dir="ltr"
              placeholder={t('drivers.placeholderPhone')}
            />
          </div>
          {!selectedDriver && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                {t('drivers.labelPassword')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                required
                minLength={6}
                dir="ltr"
              />
              <p className="text-[10px] text-gray-400 mt-1">{t('drivers.passwordHint')}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 transition-all"
            >
              {createMutation.isPending || updateMutation.isPending ? t('drivers.saving') : t('drivers.save')}
            </button>
            <button type="button" onClick={closeModal} className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              {t('drivers.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setSelectedDriver(null);
          setPasswordData({ password: '', password_confirmation: '' });
        }}
        title={t('drivers.passwordModalTitle')}
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <KeyIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedDriver?.name}</p>
              <p className="text-xs text-gray-400">{t('drivers.changePasswordFor')}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
              {t('drivers.newPassword')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              className="input"
              required
              minLength={6}
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
              {t('drivers.confirmPassword')} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) =>
                setPasswordData({ ...passwordData, password_confirmation: e.target.value })
              }
              className="input"
              required
              minLength={6}
              dir="ltr"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all"
            >
              {resetPasswordMutation.isPending ? t('drivers.saving') : t('drivers.changePasswordBtn')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setSelectedDriver(null);
                setPasswordData({ password: '', password_confirmation: '' });
              }}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              {t('drivers.cancel')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedDriver(null);
        }}
        onConfirm={() => selectedDriver && deleteMutation.mutate(selectedDriver.id)}
        title={t('drivers.deleteDialogTitle')}
        message={t('drivers.deleteDialogMessage').replace('{name}', selectedDriver?.name || '')}
        confirmText={t('drivers.deleteConfirm')}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
