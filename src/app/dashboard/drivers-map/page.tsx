'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { locationApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';
import { PageHeader } from '@/components/dashboard';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

// Dynamically import the map component to avoid SSR issues with Leaflet
const DriverMap = dynamic(() => import('./DriverMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
      <div className="text-gray-500 dark:text-gray-400">...</div>
    </div>
  ),
});

interface Driver {
  id: number;
  name: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  last_location_at: string | null;
  is_online: boolean;
  has_active_delivery: boolean;
  delivery_reference: string | null;
  vehicle_name: string | null;
}

interface DriversData {
  drivers: Driver[];
  online_count: number;
  total_count: number;
  updated_at: string;
}

export default function DriversMapPage() {
  const { t, locale } = useLocale();
  const [driversData, setDriversData] = useState<DriversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await locationApi.getAllDrivers();
      setDriversData(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error(t('driversMap.errorLoading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initial fetch
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDrivers();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDrivers]);

  const onlineDrivers = driversData?.drivers.filter(d => d.is_online) || [];
  const offlineDrivers = driversData?.drivers.filter(d => !d.is_online) || [];

  return (
    <div>
      <PageHeader title={t('driversMap.title')} subtitle={t('driversMap.subtitle')}>
        <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
          />
          {t('driversMap.autoRefresh')}
        </label>
        <button
          onClick={fetchDrivers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 h-[34px] text-[13px] font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('driversMap.refresh')}
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="metric-tile">
          <div className="metric-label">{t('driversMap.totalDrivers')}</div>
          <div className="metric-value tnum">{driversData?.total_count || 0}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-green" aria-hidden />{t('driversMap.online')}</div>
          <div className="metric-value tnum">{driversData?.online_count || 0}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label flex items-center gap-1.5"><span className="metric-dot metric-dot-neutral" aria-hidden />{t('driversMap.offline')}</div>
          <div className="metric-value tnum">{(driversData?.total_count || 0) - (driversData?.online_count || 0)}</div>
        </div>
        <div className="metric-tile">
          <div className="metric-label">{t('driversMap.lastUpdate')}</div>
          <div className="metric-value tnum">{lastUpdate ? lastUpdate.toLocaleTimeString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ') : '-'}</div>
        </div>
      </div>

      {/* Map (untouched) */}
      <div className="card mb-4">
        <DriverMap drivers={driversData?.drivers || []} />
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Online Drivers */}
        <div className="surface-pro p-4">
          <h3 className="surface-heading flex items-center gap-2 mb-3">
            <span className="metric-dot metric-dot-green" aria-hidden />
            {t('driversMap.onlineDrivers')} ({onlineDrivers.length})
          </h3>
          {onlineDrivers.length === 0 ? (
            <div className="t-empty text-center py-4 text-[13px]">{t('driversMap.noOnlineDrivers')}</div>
          ) : (
            <div className="space-y-2">
              {onlineDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </div>

        {/* Offline Drivers */}
        <div className="surface-pro p-4">
          <h3 className="surface-heading flex items-center gap-2 mb-3">
            <span className="metric-dot metric-dot-neutral" aria-hidden />
            {t('driversMap.offlineDrivers')} ({offlineDrivers.length})
          </h3>
          {offlineDrivers.length === 0 ? (
            <div className="t-empty text-center py-4 text-[13px]">{t('driversMap.allDriversOnline')}</div>
          ) : (
            <div className="space-y-2">
              {offlineDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverCard({ driver }: { driver: Driver }) {
  const { t } = useLocale();

  const getTimeSinceUpdate = () => {
    if (!driver.last_location_at) return t('driversMap.unknown');
    const lastUpdate = new Date(driver.last_location_at);
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('driversMap.justNow');
    if (diffMins < 60) return t('driversMap.minutesAgo').replace('{count}', String(diffMins));
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return t('driversMap.hoursAgo').replace('{count}', String(diffHours));
    return t('driversMap.daysAgo').replace('{count}', String(Math.floor(diffHours / 24)));
  };

  return (
    <div className="flex items-center justify-between p-2.5 rounded-md border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-[14px]">
          {driver.name.charAt(0)}
        </div>
        <div>
          <div className="text-[13px] font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
            <span className={`metric-dot ${driver.is_online ? 'metric-dot-green' : 'metric-dot-neutral'}`} aria-hidden />
            {driver.name}
          </div>
          <div className="text-[12px] text-gray-500 dark:text-gray-400">{driver.phone || '-'}</div>
        </div>
      </div>
      <div className="text-end">
        {driver.has_active_delivery && (
          <div className="text-[11px] text-gray-600 dark:text-gray-300 mb-0.5">
            {driver.delivery_reference}
          </div>
        )}
        <div className="text-[11px] text-gray-500 dark:text-gray-400">{getTimeSinceUpdate()}</div>
        {driver.vehicle_name && (
          <div className="text-[11px] text-gray-400 dark:text-gray-500">{driver.vehicle_name}</div>
        )}
      </div>
    </div>
  );
}
