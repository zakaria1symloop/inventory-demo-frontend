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
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Vehicle {
  id: number;
  name: string;
  plate_number?: string;
  model?: string;
  is_active: boolean;
  created_at: string;
}

export default function VehiclesPage() {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';

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
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Insert key or Alt+N: open add modal
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div className="space-y-5">
      {/* Guided Tour */}
      {showTour && (
        <GuidedTour
          steps={tourSteps}
          onComplete={() => setShowTour(false)}
          storageKey="vehicles_tour_step"
        />
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div data-tour="vehicles-header" className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <TruckIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[1.65rem] font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
              {t('vehicles.title')}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1.5">
              {t('vehicles.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tour button - text only */}
          <button
            onClick={() => {
              localStorage.removeItem('vehicles_tour_step');
              setShowTour(true);
            }}
            className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
          >
            {t('vehicles.tourTitle')}
          </button>
          {/* Add vehicle button */}
          <button
            onClick={() => { setEditingVehicle(null); resetForm(); setShowModal(true); }}
            className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 active:scale-[0.98] transition-all duration-200"
            data-tour="vehicles-add"
          >
            <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
            {t('vehicles.addVehicle')}
            <kbd className="hidden sm:inline bg-teal-700/60 px-1.5 py-0.5 rounded text-[10px] font-mono">Insert</kbd>
          </button>
        </div>
      </div>

      {/* ─── Shortcuts hint ─── */}
      <div className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-xl flex items-center gap-6 text-xs">
        <span className="font-semibold">{t('vehicles.shortcuts')}</span>
        <span>
          <kbd className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded text-[10px] font-mono">Insert</kbd>
          {' '}{t('vehicles.insertNew')}
        </span>
      </div>

      {/* ─── KPI Strip ─── */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className={`grid grid-cols-3 sm:divide-x ${isRTL ? 'sm:divide-x-reverse' : ''} divide-gray-100 dark:divide-gray-700`}>
          {/* Total vehicles */}
          <div className="group relative p-5 hover:bg-teal-50/40 dark:hover:bg-teal-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-2.5">
                <TruckIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-gray-900 dark:text-white tabular-nums leading-none">{totalCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vehicles.totalVehicles')}</div>
            </div>
          </div>
          {/* Active */}
          <div className="group relative p-5 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-green-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mb-2.5">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-green-600 dark:text-green-400 tabular-nums leading-none">{activeCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vehicles.activeVehicles')}</div>
            </div>
          </div>
          {/* Inactive */}
          <div className="group relative p-5 hover:bg-red-50/40 dark:hover:bg-red-900/10 transition-colors duration-200">
            <div className="absolute top-0 inset-x-0 h-[3px] bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-b" />
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-2.5">
                <XCircleIcon className="w-4 h-4" />
              </div>
              <div className="text-3xl font-black text-red-500 dark:text-red-400 tabular-nums leading-none">{inactiveCount}</div>
              <div className="text-[11px] font-semibold text-gray-400 mt-2">{t('vehicles.inactiveVehicles')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table Card ─── */}
      <div
        data-tour="vehicles-table"
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-sm">
            <MagnifyingGlassIcon className={`w-4 h-4 text-gray-400 dark:text-gray-500 absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t('vehicles.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-colors ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
                  #
                </th>
                <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
                  {t('vehicles.name')}
                </th>
                <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
                  {t('vehicles.plateNumber')}
                </th>
                <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
                  {t('vehicles.model')}
                </th>
                <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
                  {t('vehicles.status')}
                </th>
                <th className="text-start text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 py-3">
                  {t('vehicles.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <TruckIcon className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                        {t('vehicles.noVehicles')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((vehicle, index) => (
                  <tr
                    key={vehicle.id}
                    className="group hover:bg-teal-50/30 dark:hover:bg-teal-900/10 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {vehicle.name}
                      </span>
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
                        {vehicle.plate_number || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {vehicle.model || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {vehicle.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          {t('vehicles.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                          <XCircleIcon className="w-3.5 h-3.5" />
                          {t('vehicles.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEdit(vehicle)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                          title={t('vehicles.editVehicle')}
                        >
                          <PencilSquareIcon className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title={t('vehicles.deleteConfirm')}
                        >
                          <TrashIcon className="w-[18px] h-[18px]" />
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal content */}
          <div
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal gradient header */}
            <div className="bg-gradient-to-l from-teal-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <TruckIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {editingVehicle ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}
                </h2>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('vehicles.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-colors"
                  required
                />
              </div>

              {/* Plate number + Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('vehicles.plateNumber')}
                  </label>
                  <input
                    type="text"
                    value={formData.plate_number}
                    onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-colors"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('vehicles.model')}
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              {/* Active checkbox */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-teal-600 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-teal-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('vehicles.active')}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 active:scale-[0.98] transition-all duration-200"
                >
                  {isSubmitting ? t('vehicles.saving') : t('vehicles.save')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 active:scale-[0.98] transition-all duration-200"
                >
                  {t('vehicles.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
