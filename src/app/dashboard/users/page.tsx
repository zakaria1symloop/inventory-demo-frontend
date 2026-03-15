'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, warehousesApi } from '@/lib/api';
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import type { User } from '@/lib/types';

const roleLabels: Record<string, string> = {
  admin: 'مدير',
  manager: 'مسؤول',
  seller: 'بائع',
  livreur: 'سائق توصيل',
  cashvan: 'بائع متنقل',
};

const planNames: Record<string, string> = {
  free: 'مجاني',
  starter: 'المبتدئ',
  pro: 'المحترف',
  business: 'الأعمال',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const tenantName = '';
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
  const [warehousesList, setWarehousesList] = useState<Array<{ id: number; name: string; is_main?: boolean; assigned_user?: { id: number; name: string } }>>([]);
  const mainWarehouseName = warehousesList.find(w => w.is_main)?.name;
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
      toast.success('تم إضافة المستخدم بنجاح');
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
        toast.error(err.response?.data?.message || 'حدث خطأ أثناء الإضافة');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء التحديث');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, transferToAdmin }: { id: number; transferToAdmin?: boolean }) =>
      usersApi.delete(id, transferToAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم حذف المستخدم بنجاح');
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
        toast.error(data?.message || 'حدث خطأ أثناء الحذف');
      }
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { password: string; password_confirmation: string } }) =>
      usersApi.resetPassword(id, data),
    onSuccess: () => {
      toast.success('تم تغيير كلمة المرور بنجاح');
      setIsPasswordOpen(false);
      setSelectedUser(null);
      setPasswordData({ password: '', password_confirmation: '' });
    },
    onError: () => toast.error('حدث خطأ أثناء تغيير كلمة المرور'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: number) => usersApi.toggleActive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('تم تحديث حالة المستخدم');
    },
    onError: () => toast.error('حدث خطأ'),
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
    // Strip @companyname suffix for sub-users so the input shows just the username
    const editEmail = (user.role !== 'admin' && tenantName && user.email.endsWith(`@${tenantName}.com`))
      ? user.email.replace(`@${tenantName}.com`, '')
      : user.email;
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

  const isSubUserRole = (role: string) => role !== 'admin';
  const emailSuffix = tenantName ? `@${tenantName}.com` : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For sub-user roles, compose full email with @companyname suffix
    const email = isSubUserRole(formData.role) && tenantName
      ? formData.email.replace(emailSuffix, '') + emailSuffix
      : formData.email;

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
    { key: 'name', title: 'الاسم' },
    { key: 'email', title: 'البريد الإلكتروني' },
    { key: 'phone', title: 'الهاتف', render: (item: User) => item.phone || '-' },
    {
      key: 'role',
      title: 'الدور',
      render: (item: User) => (
        <span className="badge badge-info">{roleLabels[item.role]}</span>
      ),
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (item: User) => (
        item.warehouse ? (
          <span className="text-sm text-gray-700 dark:text-gray-300">{item.warehouse.name}</span>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: 'is_active',
      title: 'الحالة',
      render: (item: User) => (
        <button
          onClick={() => toggleActiveMutation.mutate(item.id)}
          className={`badge cursor-pointer ${item.is_active ? 'badge-success' : 'badge-danger'}`}
        >
          {item.is_active ? 'نشط' : 'معطل'}
        </button>
      ),
    },
    {
      key: 'actions',
      title: 'الإجراءات',
      render: (item: User) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUser(item);
              setIsPasswordOpen(true);
            }}
            className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg"
          >
            <KeyIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(item);
              setIsDeleteOpen(true);
            }}
            className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Shortcuts hint */}
      <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 flex items-center gap-6 text-sm">
        <span className="font-medium">اختصارات:</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> إضافة جديد</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المستخدمين</h1>
          <p className="text-gray-500 mt-1">إدارة مستخدمي النظام</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <PlusIcon className="w-5 h-5" />
          إضافة مستخدم
          <kbd className="bg-blue-700 text-white px-1.5 py-0.5 rounded text-xs mr-2">Insert</kbd>
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="select w-48"
          >
            <option value="">جميع الأدوار</option>
            <option value="admin">مدير</option>
            <option value="manager">مسؤول</option>
            <option value="seller">بائع</option>
            <option value="livreur">سائق توصيل</option>
            <option value="cashvan">بائع متنقل</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          searchable
          searchPlaceholder="بحث عن مستخدم..."
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
          emptyMessage="لا يوجد مستخدمين"
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            {isSubUserRole(formData.role) && tenantName ? (
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={formData.email.replace(emailSuffix, '')}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value.replace(/[@\s]/g, '') }))}
                  className="input rounded-l-none flex-1"
                  placeholder="اسم المستخدم"
                  required
                />
                <span className="inline-flex items-center px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-r-lg text-sm text-gray-600 font-medium whitespace-nowrap" dir="ltr">
                  {emailSuffix}
                </span>
              </div>
            ) : (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className="input"
                required
              />
            )}
          </div>

          {!selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value, create_warehouse: false }))}
              className="select"
              required
            >
              <option value="admin">مدير</option>
              <option value="manager">مسؤول</option>
              <option value="seller">بائع</option>
              <option value="livreur">سائق توصيل</option>
              <option value="cashvan">بائع متنقل</option>
            </select>
          </div>

          {(formData.role === 'livreur' || formData.role === 'cashvan') && !selectedUser && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.create_warehouse}
                  onChange={(e) => setFormData((p) => ({ ...p, create_warehouse: e.target.checked, warehouse_id: '' }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-blue-800">
                  {formData.role === 'cashvan' ? 'إنشاء مستودع خاص بالبائع المتنقل' : 'إنشاء مستودع خاص بالسائق'}
                </span>
              </label>
              <p className="text-xs text-blue-600 mt-1 mr-6">سيتم إنشاء مستودع باسم المستخدم تلقائياً</p>
            </div>
          )}

          {!formData.create_warehouse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المستودع</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData((p) => ({ ...p, warehouse_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="select"
              >
                <option value="">-- المستودع الرئيسي تلقائياً --</option>
                {warehousesList
                  .filter(w => {
                    // Don't show main warehouse - it's used automatically
                    if (w.is_main) return false;
                    // Show warehouses that are either unassigned or assigned to the current user
                    if (!w.assigned_user) return true;
                    if (selectedUser && w.assigned_user.id === selectedUser.id) return true;
                    return false;
                  })
                  .map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
              </select>
              {!formData.warehouse_id && mainWarehouseName && (
                <p className="text-xs text-blue-600 mt-1">
                  سيستخدم المنتجات من المستودع الرئيسي ({mainWarehouseName}) تلقائياً
                </p>
              )}
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
              <span className="text-sm font-medium text-gray-700">مستخدم نشط</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="btn btn-primary"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="spinner w-4 h-4"></span>
              ) : selectedUser ? (
                'تحديث'
              ) : (
                'إضافة'
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
        title={`تغيير كلمة المرور - ${selectedUser?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) => setPasswordData((p) => ({ ...p, password_confirmation: e.target.value }))}
              className="input"
              required
              minLength={6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsPasswordOpen(false);
                setPasswordData({ password: '', password_confirmation: '' });
              }}
              className="btn btn-secondary"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="btn btn-primary"
            >
              {resetPasswordMutation.isPending ? (
                <span className="spinner w-4 h-4"></span>
              ) : (
                'تغيير'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => selectedUser && deleteMutation.mutate({ id: selectedUser.id })}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف "${selectedUser?.name}"؟`}
        isLoading={deleteMutation.isPending}
      />

      {/* Caisse Balance Warning */}
      <Modal
        isOpen={!!caisseWarning}
        onClose={() => setCaisseWarning(null)}
        title="تنبيه: الصندوق يحتوي على رصيد"
      >
        {caisseWarning && (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-orange-800 dark:text-orange-300 font-medium">يجب تفريغ الصندوق أولاً</p>
              <p className="text-orange-700 dark:text-orange-400 text-sm mt-2">
                صندوق المستخدم &quot;{caisseWarning.userName}&quot; يحتوي على رصيد{' '}
                <span className="font-bold">
                  {new Intl.NumberFormat('ar-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(caisseWarning.balance)}
                </span>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCaisseWarning(null)} className="btn btn-secondary">
                إلغاء
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: caisseWarning.userId, transferToAdmin: true })}
                disabled={deleteMutation.isPending}
                className="btn btn-primary"
              >
                {deleteMutation.isPending ? (
                  <span className="spinner w-4 h-4"></span>
                ) : (
                  'تحويل الرصيد للصندوق الرئيسي وحذف'
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
        title="تم الوصول للحد الأقصى من المستخدمين"
      >
        {limitError && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 font-bold text-lg">{limitError.current} / {limitError.limit}</p>
              <p className="text-red-600 text-sm mt-1">مستخدم — الحد الأقصى للخطة {planNames[limitError.plan] || limitError.plan}</p>
            </div>

            <p className="text-gray-600 text-sm">{limitError.message}</p>

            {limitError.extra_user_price > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-700 text-sm font-medium">
                  يمكنك إضافة مستخدمين إضافيين بتكلفة {limitError.extra_user_price.toLocaleString()} د.ج/مستخدم شهرياً
                </p>
              </div>
            )}

            {limitError.upgrade_options.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold text-gray-700">أو قم بترقية خطتك:</p>
                {limitError.upgrade_options.map((opt) => (
                  <div key={opt.plan} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <span className="font-medium text-gray-900">{planNames[opt.plan] || opt.plan}</span>
                      <span className="text-xs text-gray-500 mr-2">حتى {opt.user_limit} مستخدم</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600">
                      {opt.price > 0 ? `${opt.price.toLocaleString()} د.ج/شهر` : 'مجاني'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={() => setLimitError(null)} className="btn btn-secondary">
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
