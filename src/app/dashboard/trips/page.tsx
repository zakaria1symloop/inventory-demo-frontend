'use client';

import { useState, useEffect } from 'react';
import { tripsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader, FilterBar } from '@/components/dashboard';
import { EyeIcon } from '@heroicons/react/24/outline';

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

  const getStatusInfo = (status: string): { dot: string; text: string } => {
    const map: Record<string, { dot: string; text: string }> = {
      active: { dot: 'metric-dot-green', text: t('trips.statusActive') },
      completed: { dot: 'metric-dot-blue', text: t('trips.statusCompleted') },
      cancelled: { dot: 'metric-dot-red', text: t('trips.statusCancelled') },
    };
    return map[status] || { dot: 'metric-dot-neutral', text: status };
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
      <PageHeader title={t('trips.title')} />

      <FilterBar
        search={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('trips.searchBySeller')}
      >
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">{t('trips.allStatuses')}</option>
          <option value="active">{t('trips.statusActive')}</option>
          <option value="completed">{t('trips.statusCompleted')}</option>
          <option value="cancelled">{t('trips.statusCancelled')}</option>
        </select>
      </FilterBar>

      <div className="table-pro-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th>{t('trips.colId')}</th>
              <th>{t('trips.colSeller')}</th>
              <th>{t('trips.colVehicle')}</th>
              <th>{t('trips.colStartTime')}</th>
              <th>{t('trips.colEndTime')}</th>
              <th className="text-end">{t('trips.colStores')}</th>
              <th className="text-end">{t('trips.colOrders')}</th>
              <th>{t('trips.colStatus')}</th>
              <th className="text-end">{t('trips.colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrips.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 t-muted">{t('trips.noTrips')}</td></tr>
            ) : (
              filteredTrips.map((trip, index) => {
                const status = getStatusInfo(trip.status);
                return (
                  <tr key={trip.id}>
                    <td className="tnum t-muted">{index + 1}</td>
                    <td className="t-strong">{trip.seller?.name || '-'}</td>
                    <td>{trip.vehicle?.name || '-'}</td>
                    <td className="tnum t-muted">{formatDateTime(trip.start_time)}</td>
                    <td className="tnum t-muted">{trip.end_time ? formatDateTime(trip.end_time) : '-'}</td>
                    <td className="tnum">{trip.stores_count || 0}</td>
                    <td className="tnum">{trip.orders_count || 0}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gray-700 dark:text-gray-300">
                        <span className={`metric-dot ${status.dot}`} aria-hidden />
                        {status.text}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        onClick={() => toast(t('trips.comingSoonDetails'))}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        title={t('trips.comingSoonDetails')}
                      >
                        <EyeIcon className="w-4 h-4" strokeWidth={1.8} />
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
  );
}
