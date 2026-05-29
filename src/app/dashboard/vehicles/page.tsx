'use client';

import { useState, useEffect, useMemo } from 'react';
import { vehiclesApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import toast from 'react-hot-toast';
import GuidedTour from '@/components/GuidedTour';
import type { TourStep } from '@/components/GuidedTour';
import {
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { PageHeader, FilterBar } from '@/components/dashboard';

interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
  model?: string;
  is_active: boolean;
  created_at: string;
}

export default function VehiclesPage() {
  const { t } = useLocale();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    plate_number: '',
    model: '',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTour, setShowTour] = useState(false);

  // Tour steps
  const tourSteps: TourStep[] = useMemo(() => [
    {
      target: '[data-tour="vehicles-header"]',
      title: t('vehicles.tourHeader'),
      desc: t('vehicles.tourHeaderDesc'),
      position: 'bottom' as const,
    },
    {
      target: '[data-tour="vehicles-table"]',
      title: t('vehicles.tourTable'),
      desc: t('vehicles.tourTableDesc'),
      position: 'top' as const,
    },
    {
      target: '[data-tour="vehicles-add"]',
      title: t('vehicles.tourAdd'),
      desc: t('vehicles.tourAddDesc'),
      position: 'bottom' as const,
    },
  ], [t]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        setEditingVehicle(null);
        resetForm();
        setShowModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await vehiclesApi.getAll();
      setVehicles(response.data.data || response.data);
    } catch (error) {
      toast.error(t('vehicles.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, formData);
        toast.success(t('vehicles.updateSuccess'));
      } else {
        await vehiclesApi.create(formData);
        toast.success(t('vehicles.createSuccess'));
      }
      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      fetchVehicles();
    } catch (error) {
      toast.error(t('vehicles.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', plate_number: '', model: '', is_active: true });
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      plate_number: vehicle.plate_number || '',
      model: vehicle.model || '',
      is_active: vehicle.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('vehicles.deleteConfirm'))) return;
    try {
      await vehiclesApi.delete(id);
      toast.success(t('vehicles.deleteSuccess'));
      fetchVehicles();
    } catch (error) {
      toast.error(t('vehicles.deleteError'));
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.plate_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPI counts
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => v.is_active).length;
  const inactiveCount = vehicles.filter(v => !v.is_active).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-4">
      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="vehicles_tour_step"
        />
      )}

      <div data-tour="vehicles-header">
        <PageHeader title={t('vehicles.title')} subtitle={t('vehicles.subtitle')}>
          <button
            onClick={() => {
              localStorage.removeItem('vehicles_tour_step');
              setShowTour(true);
            }}
            className="text-[13px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
          >
            {t('vehicles.tourTitle')}
          </button>
          <button
            onClick={() => { setEditingVehicle(null); resetForm(); setShowModal(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
            data-tour="vehicles-add"
          >
            <PlusIcon className="w-4 h-4" />
            {t('vehicles.addVehicle')}
            <kbd className="hidden md:inline bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-mono ms-1">Insert</kbd>
          </button>
        </PageHeader>
      </div>

      {/* ─── KPI Tiles ─── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-blue" aria-hidden />
            {t('vehicles.totalVehicles')}
          </div>
          <div className="metric-value">{totalCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-green" aria-hidden />
            {t('vehicles.activeVehicles')}
          </div>
          <div className="metric-value">{activeCount}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            {t('vehicles.inactiveVehicles')}
          </div>
          <div className="metric-value">{inactiveCount}</div>
        </div>
      </div>

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('vehicles.search')}
      />

      <div className="table-pro-wrap" data-tour="vehicles-table">
        <table className="table-pro">
          <thead>
            <tr>
              <th className="text-end">#</th>
              <th>{t('vehicles.name')}</th>
              <th>{t('vehicles.plateNumber')}</th>
              <th>{t('vehicles.model')}</th>
              <th>{t('vehicles.status')}</th>
              <th>{t('vehicles.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <TruckIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      {t('vehicles.noVehicles')}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredVehicles.map((vehicle, index) => (
                <tr key={vehicle.id}>
                  <td className="tnum">{index + 1}</td>
                  <td className="font-medium">{vehicle.name}</td>
                  <td dir="ltr">{vehicle.plate_number || '-'}</td>
                  <td>{vehicle.model || '-'}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                      <span className={`metric-dot ${vehicle.is_active ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
                      {vehicle.is_active ? t('vehicles.active') : t('vehicles.inactive')}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                        title={t('vehicles.editVehicle')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        title={t('vehicles.deleteConfirm')}
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

      {/* ─── Modal ─── */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[540px] max-h-[calc(100vh-3rem)] pointer-events-auto">
              <header className="px-5 py-4 border-b dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {editingVehicle ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}
                </h2>
              </header>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t('vehicles.name')} <span className="text-red-500">*</span>
                    </label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('vehicles.plateNumber')}
                      </label>
                      <input
                        type="text"
                        value={formData.plate_number}
                        onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                        className="input"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        {t('vehicles.model')}
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('vehicles.active')}
                      </span>
                    </label>
                  </div>
                </main>
                <footer className="px-5 py-3 border-t dark:border-gray-700 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-secondary"
                  >
                    {t('vehicles.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? t('vehicles.saving') : t('vehicles.save')}
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
