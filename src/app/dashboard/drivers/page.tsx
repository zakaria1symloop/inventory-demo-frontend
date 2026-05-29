'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
  BanknotesIcon,
  UsersIcon,
  TruckIcon,
  ShoppingCartIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import { PageHeader, FilterBar } from '@/components/dashboard';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  is_active: boolean;
  can_collect_debt: boolean;
  sell_from_main_stock: boolean;
  created_at: string;
}

const roleDot: Record<string, string> = {
  livreur: 'metric-dot-blue',
  seller: 'metric-dot-violet',
  cashvan: 'metric-dot-orange',
};

export default function DriversPage() {
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
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

  const toggleSellFromMainStockMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleSellFromMainStock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success(locale === 'ar' ? 'تم تحديث إعداد البيع من المخزون الرئيسي' : 'Paramètre vente depuis stock principal mis à jour');
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
      const editEmail = driver.email;
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
    const email = formData.email;

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
  const livreurCount = drivers.filter(d => d.role === 'livreur').length;
  const sellerCount = drivers.filter(d => d.role === 'seller').length;
  const cashvanCount = drivers.filter(d => d.role === 'cashvan').length;

  if (isLoading && !data) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-4">
      {showTour && (
        <GuidedTour
          steps={driversTourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="drivers_tour_step"
        />
      )}

      <div data-tour="drivers-title">
        <PageHeader title={t('drivers.pageTitle')} subtitle={t('drivers.pageSubtitle')}>
          <button
            onClick={() => setShowTour(true)}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
            title={t('drivers.tourButton')}
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
            {t('drivers.tourButton')}
          </button>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            data-tour="drivers-add"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('drivers.addEmployee')}</span>
            <span className="sm:hidden">{t('drivers.addShort')}</span>
            <kbd className="hidden md:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ms-1">Insert</kbd>
          </button>
        </PageHeader>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" data-tour="drivers-kpis">
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            {t('drivers.kpiTotal')}
          </div>
          <div className="metric-value">{pagination?.total || drivers.length}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            {t('drivers.kpiLivreurs')}
          </div>
          <div className="metric-value">{livreurCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-violet" aria-hidden />
            {t('drivers.kpiSellers')}
          </div>
          <div className="metric-value">{sellerCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-orange" aria-hidden />
            {t('drivers.kpiCashvan')}
          </div>
          <div className="metric-value">{cashvanCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-green" aria-hidden />
            {t('drivers.kpiActiveInactive')}
          </div>
          <div className="metric-value">{activeCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div data-tour="drivers-chips">
        <FilterBar
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder={t('drivers.searchPlaceholder')}
        >
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="all">{t('drivers.filterAll')}</option>
            <option value="livreur">{t('drivers.filterLivreurs')}</option>
            <option value="seller">{t('drivers.filterSellers')}</option>
            <option value="cashvan">{t('drivers.filterCashvan')}</option>
          </select>
        </FilterBar>
      </div>

      {/* Table */}
      <div data-tour="drivers-list">
        {drivers.length === 0 ? (
          <div className="surface-pro p-12 text-center">
            <UsersIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('drivers.noEmployees')}</p>
            <button onClick={() => openModal()} className="mt-3 text-sm text-gray-700 dark:text-gray-200 hover:underline font-bold">
              {t('drivers.addFirstEmployee')}
            </button>
          </div>
        ) : (
          <div className="table-pro-wrap">
            <table className="table-pro">
              <thead>
                <tr>
                  <th>{t('drivers.labelName')}</th>
                  <th>{t('drivers.labelType')}</th>
                  <th>{t('drivers.labelEmail')}</th>
                  <th>{t('drivers.labelPhone')}</th>
                  <th>{t('drivers.statusActive')}</th>
                  <th>{t('drivers.debtCollectTitle')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="font-medium">{driver.name}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${roleDot[driver.role] || 'metric-dot-neutral'}`} aria-hidden />
                        {roleLabels[driver.role] || driver.role}
                      </span>
                    </td>
                    <td dir="ltr">{driver.email}</td>
                    <td dir="ltr">{driver.phone || '-'}</td>
                    <td>
                      <button
                        onClick={() => toggleActiveMutation.mutate(driver.id)}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:underline"
                      >
                        <span className={`metric-dot ${driver.is_active ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                        {driver.is_active ? t('drivers.statusActive') : t('drivers.statusInactive')}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleCollectDebtMutation.mutate(driver.id)}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:underline"
                          title={t('drivers.debtCollectTitle')}
                        >
                          <BanknotesIcon className="w-3.5 h-3.5" />
                          {driver.can_collect_debt ? t('drivers.debtCollectEnabled') : t('drivers.debtCollectDisabled')}
                        </button>
                        {driver.role === 'cashvan' && (
                          <button
                            onClick={() => toggleSellFromMainStockMutation.mutate(driver.id)}
                            className="inline-flex items-center gap-1 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:underline"
                            title={locale === 'ar' ? 'البيع من المخزون الرئيسي' : 'Vendre depuis stock principal'}
                          >
                            <CubeIcon className="w-3.5 h-3.5" />
                            {driver.sell_from_main_stock
                              ? (locale === 'ar' ? 'مخزون رئيسي' : 'Stock principal')
                              : (locale === 'ar' ? 'تحويل' : 'Transfert')}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openModal(driver)}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={t('drivers.editTitle')}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            setIsPasswordModalOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                          title={t('drivers.changePasswordTitle')}
                        >
                          <KeyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDriver(driver);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                          title={t('drivers.deleteTitle')}
                        >
                          <TrashIcon className="w-4 h-4" />
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
        {pagination && pagination.lastPage > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('drivers.previous')}
            </button>
            {Array.from({ length: pagination.lastPage }, (_, i) => i + 1)
              .filter(p => p === 1 || p === pagination.lastPage || Math.abs(p - page) <= 2)
              .map((pg, i, arr) => (
                <span key={`page-${pg}`} className="flex items-center">
                  {i > 0 && arr[i - 1] !== pg - 1 && (
                    <span className="px-1.5 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => setPage(pg)}
                    className={`w-9 h-9 text-sm font-bold rounded-md transition-all ${
                      pg === page
                        ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
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
              className="px-3 py-1.5 text-sm font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('drivers.next')}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[560px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {selectedDriver ? t('drivers.modalTitleEdit') : t('drivers.modalTitleAdd')}
                </h2>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">
                      {t('drivers.labelType')} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'livreur', label: t('drivers.roleLivreur'), icon: <TruckIcon className="w-5 h-5" /> },
                        { value: 'seller', label: t('drivers.roleSeller'), icon: <ShoppingCartIcon className="w-5 h-5" /> },
                        { value: 'cashvan', label: t('drivers.roleCashvan'), icon: <DevicePhoneMobileIcon className="w-5 h-5" /> },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => !selectedDriver && setFormData({ ...formData, role: opt.value })}
                          disabled={!!selectedDriver}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-md border text-sm font-medium transition-all ${
                            formData.role === opt.value
                              ? 'border-gray-900 dark:border-gray-200 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white'
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
                    <input
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                      required
                      dir="ltr"
                    />
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
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button type="button" onClick={closeModal} className="btn btn-secondary">
                    {t('drivers.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn btn-primary"
                  >
                    {createMutation.isPending || updateMutation.isPending ? t('drivers.saving') : t('drivers.save')}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Password Reset Modal */}
      {isPasswordModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => {
            setIsPasswordModalOpen(false);
            setSelectedDriver(null);
            setPasswordData({ password: '', password_confirmation: '' });
          }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('drivers.passwordModalTitle')}
                </h2>
              </header>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
                    <div className="w-9 h-9 rounded-md bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
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
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordModalOpen(false);
                      setSelectedDriver(null);
                      setPasswordData({ password: '', password_confirmation: '' });
                    }}
                    className="btn btn-secondary"
                  >
                    {t('drivers.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="btn btn-primary"
                  >
                    {resetPasswordMutation.isPending ? t('drivers.saving') : t('drivers.changePasswordBtn')}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}

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
