'use client';

import { useState, useEffect } from 'react';
import { tripsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';

interface Trip {
  id: number;
  seller_id: number;
  vehicle_id?: number;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  seller?: { id: number; name: string };
  vehicle?: { id: number; name: string };
  stores_count?: number;
  orders_count?: number;
}

export default function TripsPage() {
  const { t, locale } = useLocale();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.key === 'Insert' || (e.altKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        toast(t('trips.comingSoon'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [t]);

  const fetchTrips = async () => {
    try {
      const response = await tripsApi.getAll();
      setTrips(response.data.data || response.data);
    } catch (error) {
      toast.error(t('trips.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString(locale === 'fr' ? 'fr-FR' : 'ar-DZ');
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      active: { class: 'badge-success', text: t('trips.statusActive') },
      completed: { class: 'badge-info', text: t('trips.statusCompleted') },
      cancelled: { class: 'badge-danger', text: t('trips.statusCancelled') },
    };
    return badges[status] || { class: 'badge-secondary', text: status };
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = !searchTerm || trip.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="spinner"></div></div>;
  }

  return (
    <div>
      {/* Shortcuts hint — desktop only */}
      <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg mb-4 items-center gap-6 text-sm">
        <span className="font-medium">{t('trips.shortcuts')}</span>
        <span><kbd className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">Insert</kbd> {t('trips.addNew')}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{t('trips.title')}</h1>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <input
            type="text"
            placeholder={t('trips.searchBySeller')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full sm:max-w-xs"
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select w-full sm:max-w-xs">
            <option value="">{t('trips.allStatuses')}</option>
            <option value="active">{t('trips.statusActive')}</option>
            <option value="completed">{t('trips.statusCompleted')}</option>
            <option value="cancelled">{t('trips.statusCancelled')}</option>
          </select>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[800px] sm:min-w-0 w-full">
          <thead>
            <tr>
              <th>{t('trips.colId')}</th>
              <th>{t('trips.colSeller')}</th>
              <th>{t('trips.colVehicle')}</th>
              <th>{t('trips.colStartTime')}</th>
              <th>{t('trips.colEndTime')}</th>
              <th>{t('trips.colStores')}</th>
              <th>{t('trips.colOrders')}</th>
              <th>{t('trips.colStatus')}</th>
              <th>{t('trips.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">{t('trips.noTrips')}</td></tr>
            ) : (
              filteredTrips.map((trip, index) => {
                const statusBadge = getStatusBadge(trip.status);
                return (
                  <tr key={trip.id}>
                    <td>{index + 1}</td>
                    <td className="font-medium">{trip.seller?.name || '-'}</td>
                    <td>{trip.vehicle?.name || '-'}</td>
                    <td>{formatDateTime(trip.start_time)}</td>
                    <td>{trip.end_time ? formatDateTime(trip.end_time) : '-'}</td>
                    <td>{trip.stores_count || 0}</td>
                    <td>{trip.orders_count || 0}</td>
                    <td><span className={`badge ${statusBadge.class}`}>{statusBadge.text}</span></td>
                    <td>
                      <button onClick={() => toast(t('trips.comingSoonDetails'))} className="text-gray-600 hover:text-gray-800">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
