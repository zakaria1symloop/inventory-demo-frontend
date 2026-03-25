'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { locationApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('driversMap.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('driversMap.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('driversMap.autoRefresh')}</span>
          </label>
          <button
            onClick={fetchDrivers}
            disabled={loading}
            className="btn btn-primary flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('driversMap.refresh')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('driversMap.totalDrivers')}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{driversData?.total_count || 0}</div>
        </div>
        <div className="card p-4 bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-green-700 dark:text-green-300">{t('driversMap.online')}</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{driversData?.online_count || 0}</div>
        </div>
        <div className="card p-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('driversMap.offline')}</div>
          <div className="text-2xl font-bold text-gray-400 dark:text-gray-500">
            {(driversData?.total_count || 0) - (driversData?.online_count || 0)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{t('driversMap.lastUpdate')}</div>
          <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {lastUpdate ? lastUpdate.toLocaleTimeString(locale === 'fr' ? 'fr-DZ' : 'ar-DZ') : '-'}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="card mb-6">
        <DriverMap drivers={driversData?.drivers || []} />
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Online Drivers */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            {t('driversMap.onlineDrivers')} ({onlineDrivers.length})
          </h3>
          {onlineDrivers.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">{t('driversMap.noOnlineDrivers')}</div>
          ) : (
            <div className="space-y-3">
              {onlineDrivers.map((driver) => (
                <DriverCard key={driver.id} driver={driver} />
              ))}
            </div>
          )}
        </div>

        {/* Offline Drivers */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
            {t('driversMap.offlineDrivers')} ({offlineDrivers.length})
          </h3>
          {offlineDrivers.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">{t('driversMap.allDriversOnline')}</div>
          ) : (
            <div className="space-y-3">
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
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
          driver.is_online ? 'bg-green-500' : 'bg-gray-400'
        }`}>
          {driver.name.charAt(0)}
        </div>
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{driver.name}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{driver.phone || '-'}</div>
        </div>
      </div>
      <div className="text-end">
        {driver.has_active_delivery && (
          <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded mb-1">
            {driver.delivery_reference}
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-gray-400">{getTimeSinceUpdate()}</div>
        {driver.vehicle_name && (
          <div className="text-xs text-gray-400 dark:text-gray-500">{driver.vehicle_name}</div>
        )}
      </div>
    </div>
  );
}
