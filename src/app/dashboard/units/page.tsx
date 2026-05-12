'use client';

import { useState, useEffect } from 'react';
import { unitsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      // Insert or Alt+N: Open add modal
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
    <div>
      {/* Shortcuts hint — desktop only */}
      <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 items-center gap-6 text-sm">
        <span className="font-medium">{t('common.shortcuts') + ':'}</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> {t('common.addNew')}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{t('stock.unitsTitle')}</h1>
        <button
          onClick={() => {
            setEditingUnit(null);
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary inline-flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('stock.addUnit')}
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
        <table className="min-w-[640px] sm:min-w-0 w-full">
          <thead>
            <tr>
              <th>#</th>
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
                  <td>{index + 1}</td>
                  <td className="font-medium">{unit.name}</td>
                  <td>{unit.short_name}</td>
                  <td>{unit.base_unit?.name || '-'}</td>
                  <td>
                    {unit.base_unit_id && unit.operator && unit.operation_value
                      ? `1 ${unit.short_name} = ${unit.operation_value} ${unit.base_unit?.short_name}`
                      : '-'}
                  </td>
                  <td>
                    <span className={`badge ${unit.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {unit.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(unit)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
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
                {editingUnit ? t('stock.editUnit') : t('stock.addUnit')}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
    </div>
  );
}
