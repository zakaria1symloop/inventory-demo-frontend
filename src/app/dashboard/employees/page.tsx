'use client';

import { useState, useEffect } from 'react';
import { employeesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  UsersIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Employee {
  id: number;
  name: string;
  phone?: string;
  position?: string;
  salary: number;
  hire_date?: string;
  is_active: boolean;
  notes?: string;
  dispenses_sum_amount?: number;
}

const initialFormData = {
  name: '',
  phone: '',
  position: '',
  salary: 0,
  hire_date: '',
  is_active: true,
  notes: '',
};

export default function EmployeesPage() {
  const { t, locale } = useLocale();
  const isRTL = locale === 'ar';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeesApi.getAll({ per_page: 100 });
      setEmployees(response.data.data || response.data);
    } catch (error) {
      toast.error(t('employeesPage.toastLoadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t('employeesPage.toastNameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await employeesApi.update(editingId, formData);
        toast.success(t('employeesPage.toastUpdateSuccess'));
      } else {
        await employeesApi.create(formData);
        toast.success(t('employeesPage.toastCreateSuccess'));
      }
      setShowModal(false);
      setFormData(initialFormData);
      setEditingId(null);
      fetchEmployees();
    } catch (error) {
      toast.error(t('employeesPage.toastSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.name,
      phone: employee.phone || '',
      position: employee.position || '',
      salary: employee.salary,
      hire_date: employee.hire_date || '',
      is_active: employee.is_active,
      notes: employee.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('employeesPage.confirmDelete'))) return;
    try {
      await employeesApi.delete(id);
      toast.success(t('employeesPage.toastDeleteSuccess'));
      fetchEmployees();
    } catch (error) {
      toast.error(t('employeesPage.toastDeleteError'));
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await employeesApi.toggleActive(id);
      fetchEmployees();
    } catch (error) {
      toast.error(t('employeesPage.toastStatusError'));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ');
  };

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.phone?.includes(searchTerm)
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Insert key or Alt+N: open add modal
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">{t('employeesPage.pageTitle')}</h1>
            <p className="text-sm text-gray-400 mt-1">{t('employeesPage.addEmployee')}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition-colors"
          title={t('employeesPage.shortcutHint')}
        >
          <PlusIcon className="w-4 h-4" />
          {t('employeesPage.addEmployee')}
          <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-medium">Insert</kbd>
        </button>
      </div>

      {/* ─── Table Card ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Search */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={t('employeesPage.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`input w-full ${isRTL ? 'pr-10' : 'pl-10'} text-sm`}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>{t('employeesPage.thName')}</th>
                <th>{t('employeesPage.thPhone')}</th>
                <th>{t('employeesPage.thPosition')}</th>
                <th>{t('employeesPage.thSalary')}</th>
                <th>{t('employeesPage.thHireDate')}</th>
                <th>{t('employeesPage.thTotalDispenses')}</th>
                <th>{t('employeesPage.thStatus')}</th>
                <th>{t('employeesPage.thActions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('employeesPage.noEmployees')}</td></tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="font-medium text-gray-900 dark:text-white">{emp.name}</td>
                    <td dir="ltr" className="dark:text-gray-300">{emp.phone || '-'}</td>
                    <td className="dark:text-gray-300">{emp.position || '-'}</td>
                    <td className="dark:text-gray-300">{formatCurrency(emp.salary)}</td>
                    <td className="dark:text-gray-300">{emp.hire_date ? formatDate(emp.hire_date) : '-'}</td>
                    <td className="text-red-600 dark:text-red-400">{formatCurrency(emp.dispenses_sum_amount || 0)}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(emp.id)}
                        className={`badge cursor-pointer ${emp.is_active ? 'badge-success' : 'badge-danger'}`}
                      >
                        {emp.is_active ? t('employeesPage.statusActive') : t('employeesPage.statusInactive')}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(emp.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                          <TrashIcon className="w-5 h-5" />
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

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-l from-teal-600 to-cyan-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">{editingId ? t('employeesPage.modalTitleEdit') : t('employeesPage.modalTitleAdd')}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* Form body */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('employeesPage.labelName')} {t('employeesPage.required')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('employeesPage.labelPhone')}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('employeesPage.labelPosition')}</label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('employeesPage.labelSalary')}</label>
                    <input
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                      className="input"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('employeesPage.labelHireDate')}</label>
                    <DateInput
                      value={formData.hire_date}
                      onChange={(v) => setFormData({ ...formData, hire_date: v })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">{t('employeesPage.labelNotes')}</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('employeesPage.labelActiveEmployee')}</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isSaving} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors disabled:opacity-50">
                    {isSaving ? t('employeesPage.saving') : editingId ? t('employeesPage.update') : t('employeesPage.add')}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {t('employeesPage.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
