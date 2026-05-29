'use client';

import { useState, useEffect } from 'react';
import { unitsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Unit {
  id: number;
  name: string;
  short_name: string;
  base_unit_id?: number;
  base_unit?: Unit;
  operator?: '*' | '/';
  operation_value?: number;
  is_active: boolean;
  created_at: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    base_unit_id: '',
    operator: '*' as '*' | '/',
    operation_value: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLocale();

  useEffect(() => {
    fetchUnits();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setEditingUnit(null);
        resetForm();
        setShowModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchUnits = async () => {
    try {
      const response = await unitsApi.getAll();
      setUnits(response.data.data || response.data);
    } catch (error) {
      toast.error(t('common.loadError', { item: t('stock.unitsTitle') }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = {
      name: formData.name,
      short_name: formData.short_name,
      is_active: formData.is_active,
      base_unit_id: formData.base_unit_id ? parseInt(formData.base_unit_id) : null,
      operator: formData.base_unit_id ? formData.operator : null,
      operation_value: formData.base_unit_id && formData.operation_value ? parseFloat(formData.operation_value) : null,
    };

    try {
      if (editingUnit) {
        await unitsApi.update(editingUnit.id, data);
        toast.success(t('common.updatedSuccess', { item: t('stock.unitsTitle') }));
      } else {
        await unitsApi.create(data);
        toast.success(t('common.addedSuccess', { item: t('stock.unitsTitle') }));
      }
      setShowModal(false);
      setEditingUnit(null);
      resetForm();
      fetchUnits();
    } catch (error) {
      toast.error(t('common.saveError', { item: t('stock.unitsTitle') }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      short_name: '',
      base_unit_id: '',
      operator: '*',
      operation_value: '',
      is_active: true,
    });
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      short_name: unit.short_name,
      base_unit_id: unit.base_unit_id?.toString() || '',
      operator: unit.operator || '*',
      operation_value: unit.operation_value?.toString() || '',
      is_active: unit.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('stock.confirmDeleteUnit'))) return;

    try {
      await unitsApi.delete(id);
      toast.success(t('common.deletedSuccess', { item: t('stock.unitsTitle') }));
      fetchUnits();
    } catch (error) {
      toast.error(t('common.deleteError', { item: t('stock.unitsTitle') }));
    }
  };

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.short_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const baseUnits = units.filter(u => !u.base_unit_id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t('stock.unitsTitle')}>
        <button
          onClick={() => {
            setEditingUnit(null);
            resetForm();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          {t('stock.addUnit')}
          <kbd className="hidden md:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ms-1">Insert</kbd>
        </button>
      </PageHeader>

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search')}
      />

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="text-end">#</th>
              <th>{t('common.name')}</th>
              <th>{t('stock.shortName')}</th>
              <th>{t('stock.baseUnit')}</th>
              <th>{t('stock.conversion')}</th>
              <th>{t('common.status')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  {t('stock.noUnits')}
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit, index) => (
                <tr key={unit.id}>
                  <td className="tnum">{index + 1}</td>
                  <td className="font-medium">{unit.name}</td>
                  <td>{unit.short_name}</td>
                  <td>{unit.base_unit?.name || '-'}</td>
                  <td>
                    {unit.base_unit_id && unit.operator && unit.operation_value
                      ? `1 ${unit.short_name} = ${unit.operation_value} ${unit.base_unit?.short_name}`
                      : '-'}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      <span className={`metric-dot ${unit.is_active ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
                      {unit.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(unit)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[640px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {editingUnit ? t('stock.editUnit') : t('stock.addUnit')}
                </h2>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('common.name')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder={t('stock.nameExample')}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('stock.shortName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.short_name}
                        onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                        className="input"
                        placeholder={t('stock.shortNameExample')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('stock.baseUnitConversion')}
                    </label>
                    <select
                      value={formData.base_unit_id}
                      onChange={(e) => setFormData({ ...formData, base_unit_id: e.target.value })}
                      className="select"
                    >
                      <option value="">{t('stock.noBaseUnit')}</option>
                      {baseUnits.filter(u => u.id !== editingUnit?.id).map(unit => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name} ({unit.short_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.base_unit_id && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('stock.operation')}
                        </label>
                        <select
                          value={formData.operator}
                          onChange={(e) => setFormData({ ...formData, operator: e.target.value as '*' | '/' })}
                          className="select"
                        >
                          <option value="*">{t('stock.multiply')}</option>
                          <option value="/">{t('stock.divide')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('stock.conversionValue')}
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={formData.operation_value}
                          onChange={(e) => setFormData({ ...formData, operation_value: e.target.value })}
                          className="input"
                          placeholder={t('stock.conversionExample')}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('common.active')}</span>
                    </label>
                  </div>
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? t('common.saving') : t('common.save')}
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
