'use client';

import { useState, useEffect } from 'react';
import { warehousesApi, usersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';

interface AssignedUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Warehouse {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  is_main: boolean;
  is_active: boolean;
  assigned_user?: AssignedUser;
  created_at: string;
}

interface UserOption {
  id: number;
  name: string;
  role: string;
  warehouse_id?: number;
}

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_main: false,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningWarehouse, setAssigningWarehouse] = useState<Warehouse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Insert key or Alt+N: open add modal
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setEditingWarehouse(null);
        resetForm();
        setShowModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchWarehouses = async () => {
    try {
      const response = await warehousesApi.getAll();
      setWarehouses(response.data.data || response.data);
    } catch (error) {
      toast.error(t('common.loadError', { item: t('stock.warehousesTitle') }));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getAll({ per_page: 100 });
      const allUsers = response.data.data || response.data;
      setUsers(allUsers);
    } catch {
      // ignore
    }
  };

  const handleOpenAssign = (warehouse: Warehouse) => {
    setAssigningWarehouse(warehouse);
    setSelectedUserId(warehouse.assigned_user?.id || '');
    fetchUsers();
    setShowAssignModal(true);
  };

  const handleAssignUser = async () => {
    if (!assigningWarehouse) return;
    setIsAssigning(true);
    try {
      await warehousesApi.assignUser(
        assigningWarehouse.id,
        selectedUserId === '' ? null : Number(selectedUserId)
      );
      toast.success(t('stock.managerUpdated'));
      setShowAssignModal(false);
      setAssigningWarehouse(null);
      fetchWarehouses();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t('stock.managerError'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingWarehouse) {
        await warehousesApi.update(editingWarehouse.id, formData);
        toast.success(t('common.updatedSuccess', { item: t('stock.warehousesTitle') }));
      } else {
        await warehousesApi.create(formData);
        toast.success(t('common.addedSuccess', { item: t('stock.warehousesTitle') }));
      }
      setShowModal(false);
      setEditingWarehouse(null);
      resetForm();
      fetchWarehouses();
    } catch (error) {
      toast.error(t('common.saveError', { item: t('stock.warehousesTitle') }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      is_main: false,
      is_active: true,
    });
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      is_main: warehouse.is_main,
      is_active: warehouse.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('stock.confirmDeleteWarehouse'))) return;

    try {
      await warehousesApi.delete(id);
      toast.success(t('common.deletedSuccess', { item: t('stock.warehousesTitle') }));
      fetchWarehouses();
    } catch (error) {
      toast.error(t('common.deleteError', { item: t('stock.warehousesTitle') }));
    }
  };

  const filteredWarehouses = warehouses.filter(warehouse =>
    warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    warehouse.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Shortcuts hint — desktop only */}
      <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 items-center gap-6 text-sm">
        <span className="font-medium">{t('common.shortcuts') + ':'}</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> {t('common.addNew')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{t('stock.warehousesTitle')}</h1>
        <button
          onClick={() => {
            setEditingWarehouse(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary inline-flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('stock.addWarehouse')}
          <kbd className="hidden md:inline bg-blue-700 px-1.5 py-0.5 rounded text-xs ms-1">Insert</kbd>
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full sm:max-w-xs"
          />
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[720px] sm:min-w-0 w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('common.name')}</th>
              <th>{t('stock.address')}</th>
              <th>{t('stock.phone')}</th>
              <th>{t('stock.manager')}</th>
              <th>{t('stock.mainWarehouse')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarehouses.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  {t('stock.noWarehouses')}
                </td>
              </tr>
            ) : (
              filteredWarehouses.map((warehouse, index) => (
                <tr key={warehouse.id}>
                  <td>{index + 1}</td>
                  <td className="font-medium">{warehouse.name}</td>
                  <td>{warehouse.address || '-'}</td>
                  <td dir="ltr">{warehouse.phone || '-'}</td>
                  <td>
                    {warehouse.assigned_user ? (
                      <button
                        onClick={() => handleOpenAssign(warehouse)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {warehouse.assigned_user.name}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenAssign(warehouse)}
                        className="text-xs text-gray-400 hover:text-blue-600 cursor-pointer"
                      >
                        {t('stock.assign')}
                      </button>
                    )}
                  </td>
                  <td>
                    {warehouse.is_main ? (
                      <span className="badge badge-info">{t('stock.mainWarehouse')}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${warehouse.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {warehouse.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(warehouse)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(warehouse.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingWarehouse ? t('stock.editWarehouse') : t('stock.addWarehouse')}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder={t('stock.warehouseNameExample')}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('stock.address')}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    placeholder={t('stock.addressExample')}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('stock.phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+\s-]/g, '') })}
                    className="input"
                    placeholder={t('stock.phoneExample')}
                    dir="ltr"
                    inputMode="tel"
                    pattern="[\d+\s-]*"
                    maxLength={20}
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_main}
                      onChange={(e) => setFormData({ ...formData, is_main: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{t('stock.isMain')}</span>
                  </label>
                </div>

                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">{t('common.active')}</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
                    {isSubmitting ? t('common.saving') : t('common.save')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {showAssignModal && assigningWarehouse && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {t('stock.assignManager', { name: assigningWarehouse.name })}
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('stock.user')}
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="select w-full"
                >
                  <option value="">{t('stock.noManager')}</option>
                  {users
                    .filter(u => !u.warehouse_id || u.warehouse_id === assigningWarehouse.id)
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'admin' ? t('stock.roleAdmin') : u.role === 'manager' ? t('stock.roleManager') : u.role === 'seller' ? t('stock.roleSeller') : u.role === 'livreur' ? t('stock.roleDriver') : t('stock.roleCashvan')})
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAssignUser}
                  disabled={isAssigning}
                  className="btn btn-primary flex-1"
                >
                  {isAssigning ? t('common.saving') : t('common.save')}
                </button>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
