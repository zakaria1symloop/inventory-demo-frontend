'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, warehousesApi } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon, UsersIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { User } from '@/lib/types';
import { useLocale } from '@/lib/i18n/context';

export default function UsersPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'seller',
    is_active: true,
    warehouse_id: '' as number | '',
    create_warehouse: false,
  });
  const [warehousesList, setWarehousesList] = useState<Array<{ id: number; name: string; assigned_user?: { id: number; name: string } }>>([]);
  const [passwordData, setPasswordData] = useState({
    password: '',
    password_confirmation: '',
  });
  const [limitError, setLimitError] = useState<{
    message: string;
    limit: number;
    current: number;
    plan: string;
    extra_user_price: number;
    upgrade_options: Array<{ plan: string; user_limit: number; price: number }>;
  } | null>(null);
  const [caisseWarning, setCaisseWarning] = useState<{
    userId: number;
    userName: string;
    balance: number;
  } | null>(null);

  const roleLabels: Record<string, string> = {
    admin: t('users.roleAdmin'),
    manager: t('users.roleManager'),
    seller: t('users.roleSeller'),
    livreur: t('users.roleLivreur'),
    cashvan: t('users.roleCashvan'),
  };

  const planNames: Record<string, string> = {
    free: t('users.planFree'),
    starter: t('users.planStarter'),
    pro: t('users.planPro'),
    business: t('users.planBusiness'),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: async () => {
      const response = await usersApi.getAll({ page, search, role: roleFilter, per_page: 15 });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.toastCreateSuccess'));
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { status?: number; data?: { message?: string; limit?: number; current?: number; plan?: string; extra_user_price?: number; upgrade_options?: Array<{ plan: string; user_limit: number; price: number }> } } };
      if (err.response?.status === 403 && err.response?.data?.limit) {
        setLimitError({
          message: err.response.data.message || '',
          limit: err.response.data.limit || 0,
          current: err.response.data.current || 0,
          plan: err.response.data.plan || 'free',
          extra_user_price: err.response.data.extra_user_price || 0,
          upgrade_options: err.response.data.upgrade_options || [],
        });
        handleCloseModal();
      } else {
        toast.error(err.response?.data?.message || t('users.toastCreateError'));
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.toastUpdateSuccess'));
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('users.toastUpdateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, transferToAdmin }: { id: number; transferToAdmin?: boolean }) =>
      usersApi.delete(id, transferToAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.toastDeleteSuccess'));
      setIsDeleteOpen(false);
      setCaisseWarning(null);
      setSelectedUser(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string; can_transfer?: boolean; caisse_balance?: number } } };
      const data = err.response?.data;
      if (data?.can_transfer && data?.caisse_balance && data.caisse_balance > 0) {
        setCaisseWarning({
          userId: selectedUser!.id,
          userName: selectedUser!.name,
          balance: data.caisse_balance,
        });
        setIsDeleteOpen(false);
      } else {
        toast.error(data?.message || t('users.toastDeleteError'));
      }
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { password: string; password_confirmation: string } }) =>
      usersApi.resetPassword(id, data),
    onSuccess: () => {
      toast.success(t('users.toastPasswordSuccess'));
      setIsPasswordOpen(false);
      setSelectedUser(null);
      setPasswordData({ password: '', password_confirmation: '' });
    },
    onError: () => toast.error(t('users.toastPasswordError')),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(t('users.toastStatusSuccess'));
    },
    onError: () => toast.error(t('users.toastStatusError')),
  });

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesApi.getAll();
      setWarehousesList(response.data.data || response.data);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Insert key or Alt+N: open add modal
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        handleOpenCreate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'seller',
      is_active: true,
      warehouse_id: '',
      create_warehouse: false,
    });
    fetchWarehouses();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    const editEmail = user.email;
    setFormData({
      name: user.name,
      email: editEmail,
      password: '',
      phone: user.phone || '',
      role: user.role,
      is_active: user.is_active,
      warehouse_id: user.warehouse_id || '',
      create_warehouse: false,
    });
    fetchWarehouses();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = formData.email;

    const data: Record<string, unknown> = {
      name: formData.name,
      email,
      phone: formData.phone || null,
      role: formData.role,
      is_active: formData.is_active,
      warehouse_id: formData.create_warehouse ? null : (formData.warehouse_id === '' ? null : formData.warehouse_id),
    };

    if (!selectedUser) {
      data.password = formData.password;
      if (formData.create_warehouse && (formData.role === 'livreur' || formData.role === 'cashvan')) {
        data.create_warehouse = true;
      }
    }

    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      resetPasswordMutation.mutate({ id: selectedUser.id, data: passwordData });
    }
  };

  const columns = [
    { key: 'name', title: t('users.thName') },
    { key: 'email', title: t('users.thEmail') },
    { key: 'phone', title: t('users.thPhone'), render: (item: User) => item.phone || '-' },
    {
      key: 'role',
      title: t('users.thRole'),
      render: (item: User) => (
        <span className="badge badge-info">{roleLabels[item.role]}</span>
      ),
    },
    {
      key: 'warehouse',
      title: t('users.thWarehouse'),
      render: (item: User) => (
        item.warehouse ? (
          <span className="text-sm text-gray-700 dark:text-gray-300">{item.warehouse.name}</span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        )
      ),
    },
    {
      key: 'is_active',
      title: t('users.thStatus'),
      render: (item: User) => (
        <button
          onClick={() => toggleActiveMutation.mutate(item.id)}
          className={`badge cursor-pointer ${item.is_active ? 'badge-success' : 'badge-danger'}`}
        >
          {item.is_active ? t('users.statusActive') : t('users.statusInactive')}
        </button>
      ),
    },
    {
      key: 'actions',
      title: t('users.thActions'),
      render: (item: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUser(item);
              setIsPasswordOpen(true);
            }}
            className="p-1.5 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg"
          >
            <KeyIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(item);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('users.pageTitle')}</h1>
            <p className="text-sm text-gray-400 mt-1">{t('users.pageSubtitle')}</p>
          </div>
        </div>
        <button onClick={handleOpenCreate} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors">
          <PlusIcon className="w-4 h-4" />
          {t('users.addUser')}
          <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium">Insert</kbd>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select w-48"
            >
              <option value="">{t('users.allRoles')}</option>
              <option value="admin">{t('users.roleAdmin')}</option>
              <option value="manager">{t('users.roleManager')}</option>
              <option value="seller">{t('users.roleSeller')}</option>
              <option value="livreur">{t('users.roleLivreur')}</option>
              <option value="cashvan">{t('users.roleCashvan')}</option>
            </select>
          </div>
        </div>
        <div className="p-0">
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          searchable
          searchPlaceholder={t('users.searchPlaceholder')}
          onSearch={setSearch}
          pagination={
            data && {
              currentPage: data.current_page,
              lastPage: data.last_page,
              total: data.total,
              perPage: data.per_page,
              onPageChange: setPage,
            }
          }
          emptyMessage={t('users.emptyMessage')}
        />
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? t('users.modalEdit') : t('users.modalAdd')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.labelName')}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.labelEmail')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              className="input"
              required
            />
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.labelPassword')}</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                className="input"
                required
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.labelPhone')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.labelRole')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value, create_warehouse: false }))}
              className="select"
              required
            >
              <option value="admin">{t('users.roleAdmin')}</option>
              <option value="manager">{t('users.roleManager')}</option>
              <option value="seller">{t('users.roleSeller')}</option>
              <option value="livreur">{t('users.roleLivreur')}</option>
              <option value="cashvan">{t('users.roleCashvan')}</option>
            </select>
          </div>

          {(formData.role === 'livreur' || formData.role === 'cashvan') && !selectedUser && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.create_warehouse}
                  onChange={(e) => setFormData((p) => ({ ...p, create_warehouse: e.target.checked, warehouse_id: '' }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  {formData.role === 'cashvan' ? t('users.createWarehouseCashvan') : t('users.createWarehouseLivreur')}
                </span>
              </label>
              <p className={`text-xs text-blue-600 dark:text-blue-400 mt-1 ${isRTL ? 'mr-6' : 'ml-6'}`}>{t('users.createWarehouseHint')}</p>
            </div>
          )}

          {!formData.create_warehouse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.labelWarehouse')}</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData((p) => ({ ...p, warehouse_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="select"
              >
                <option value="">{t('users.noWarehouse')}</option>
                {warehousesList
                  .filter(w => {
                    // Show warehouses that are either unassigned or assigned to the current user
                    if (!w.assigned_user) return true;
                    if (selectedUser && w.assigned_user.id === selectedUser.id) return true;
                    return false;
                  })
                  .map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('users.labelActiveUser')}</span>
            </label>
          </div>

          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-3 pt-4`}>
            <button type="button" onClick={handleCloseModal} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {t('users.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="spinner w-4 h-4"></span>
              ) : selectedUser ? (
                t('users.update')
              ) : (
                t('users.add')
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isPasswordOpen}
        onClose={() => {
          setIsPasswordOpen(false);
          setPasswordData({ password: '', password_confirmation: '' });
        }}
        title={`${t('users.resetPasswordTitle')} - ${selectedUser?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.newPassword')}</label>
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData((p) => ({ ...p, password: e.target.value }))}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.confirmPassword')}</label>
            <input
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) => setPasswordData((p) => ({ ...p, password_confirmation: e.target.value }))}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-3 pt-4`}>
            <button
              type="button"
              onClick={() => {
                setIsPasswordOpen(false);
                setPasswordData({ password: '', password_confirmation: '' });
              }}
              className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('users.cancel')}
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {resetPasswordMutation.isPending ? (
                <span className="spinner w-4 h-4"></span>
              ) : (
                t('users.changePassword')
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => selectedUser && deleteMutation.mutate({ id: selectedUser.id })}
        title={t('users.deleteTitle')}
        message={t('users.deleteConfirm', { name: selectedUser?.name || '' })}
        isLoading={deleteMutation.isPending}
      />

      {/* Caisse Balance Warning */}
      <Modal
        isOpen={!!caisseWarning}
        onClose={() => setCaisseWarning(null)}
        title={t('users.caisseWarningTitle')}
      >
        {caisseWarning && (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-orange-800 dark:text-orange-300 font-medium">{t('users.caisseMustEmpty')}</p>
              <p className="text-orange-700 dark:text-orange-400 text-sm mt-2">
                {t('users.caisseBalanceMsg', { name: caisseWarning.userName })}{' '}
                <span className="font-bold">
                  {new Intl.NumberFormat(isRTL ? 'ar-DZ' : 'fr-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(caisseWarning.balance)}
                </span>
              </p>
            </div>
            <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} gap-3`}>
              <button onClick={() => setCaisseWarning(null)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('users.cancel')}
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: caisseWarning.userId, transferToAdmin: true })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                {deleteMutation.isPending ? (
                  <span className="spinner w-4 h-4"></span>
                ) : (
                  t('users.transferAndDelete')
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* User Limit Modal */}
      <Modal
        isOpen={!!limitError}
        onClose={() => setLimitError(null)}
        title={t('users.limitTitle')}
      >
        {limitError && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-700 dark:text-red-300 font-bold text-lg">{limitError.current} / {limitError.limit}</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{t('users.limitUsersCount', { plan: planNames[limitError.plan] || limitError.plan })}</p>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm">{limitError.message}</p>

            {limitError.extra_user_price > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                  {t('users.limitExtraPrice', { price: limitError.extra_user_price.toLocaleString() })}
                </p>
              </div>
            )}

            {limitError.upgrade_options.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('users.limitUpgrade')}</p>
                {limitError.upgrade_options.map((opt) => (
                  <div key={opt.plan} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{planNames[opt.plan] || opt.plan}</span>
                      <span className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>{t('users.limitUpTo', { limit: String(opt.user_limit) })}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {opt.price > 0 ? t('users.limitPriceMonth', { price: opt.price.toLocaleString() }) : t('users.limitFree')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} pt-2`}>
              <button onClick={() => setLimitError(null)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {t('users.close')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
