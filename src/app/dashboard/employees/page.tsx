'use client';

import { useState, useEffect } from 'react';
import { employeesApi } from '@/lib/api';
import DateInput from '@/components/ui/DateInput';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
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
    <div className="space-y-4">
      <PageHeader title={t('employeesPage.pageTitle')} subtitle={t('employeesPage.addEmployee')}>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData(initialFormData);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
          title={t('employeesPage.shortcutHint')}
        >
          <PlusIcon className="w-4 h-4" />
          {t('employeesPage.addEmployee')}
          <kbd className="hidden md:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ms-1">Insert</kbd>
        </button>
      </PageHeader>

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('employeesPage.searchPlaceholder')}
      />

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('employeesPage.thName')}</th>
              <th>{t('employeesPage.thPhone')}</th>
              <th>{t('employeesPage.thPosition')}</th>
              <th className="text-end">{t('employeesPage.thSalary')}</th>
              <th>{t('employeesPage.thHireDate')}</th>
              <th className="text-end">{t('employeesPage.thTotalDispenses')}</th>
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
                  <td className="font-medium">{emp.name}</td>
                  <td dir="ltr">{emp.phone || '-'}</td>
                  <td>{emp.position || '-'}</td>
                  <td className="tnum">{formatCurrency(emp.salary)}</td>
                  <td>{emp.hire_date ? formatDate(emp.hire_date) : '-'}</td>
                  <td className="tnum">{formatCurrency(emp.dispenses_sum_amount || 0)}</td>
                  <td>
                    <button
                      onClick={() => handleToggleActive(emp.id)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300 hover:underline"
                    >
                      <span className={`metric-dot ${emp.is_active ? 'metric-dot-green' : 'metric-dot-red'}`} aria-hidden />
                      {emp.is_active ? t('employeesPage.statusActive') : t('employeesPage.statusInactive')}
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[600px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {editingId ? t('employeesPage.modalTitleEdit') : t('employeesPage.modalTitleAdd')}
                </h2>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
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
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^\d+\s-]/g, '') })}
                        className="input"
                        dir="ltr"
                        inputMode="tel"
                        pattern="[\d+\s-]*"
                        maxLength={20}
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
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    {t('employeesPage.cancel')}
                  </button>
                  <button type="submit" disabled={isSaving} className="btn btn-primary">
                    {isSaving ? t('employeesPage.saving') : editingId ? t('employeesPage.update') : t('employeesPage.add')}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
