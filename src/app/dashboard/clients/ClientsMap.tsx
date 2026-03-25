'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocale } from '@/lib/i18n/context';

interface ClientMapItem {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  gps_lat?: number;
  gps_lng?: number;
  balance: number;
  combined_debt?: number;
  client_category?: { id: number; name: string };
  source?: 'web' | 'app';
  is_active: boolean;
}

interface ClientsMapProps {
  clients: ClientMapItem[];
  onClientClick?: (clientId: number) => void;
}

const createClientIcon = (hasDebt: boolean, isActive: boolean) => {
  const color = !isActive ? '#9ca3af' : hasDebt ? '#ef4444' : '#22c55e';
  return L.divIcon({
    className: 'custom-client-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

export default function ClientsMap({ clients, onClientClick }: ClientsMapProps) {
  const { t, locale, dir } = useLocale();
  const isRTL = dir === 'rtl';
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-DZ' : 'fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center on Biskra, Algeria
    const defaultCenter: [number, number] = [34.8416, 5.7289];

    mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when clients change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const validClients = clients.filter(c => c.gps_lat && c.gps_lng);

    if (validClients.length === 0) return;

    const textDir = isRTL ? 'rtl' : 'ltr';
    const textAlign = isRTL ? 'right' : 'left';

    validClients.forEach(client => {
      const debt = Number(client.combined_debt) || 0;
      const icon = createClientIcon(debt > 0, client.is_active);

      const marker = L.marker([client.gps_lat!, client.gps_lng!], { icon })
        .addTo(mapRef.current!);

      const debtLabel = t('clients.debtLabel');
      const disabledLabel = t('clients.disabledLegend');
      const fromAppLabel = t('clients.fromAppLabel');
      const fromPlatformLabel = t('clients.fromPlatformLabel');

      const popupContent = `
        <div style="direction: ${textDir}; text-align: ${textAlign}; min-width: 180px; font-family: sans-serif;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">${client.name}</div>
          ${client.phone ? `<div style="font-size: 12px; color: #666; margin-bottom: 3px;">${client.phone}</div>` : ''}
          ${client.address ? `<div style="font-size: 12px; color: #666; margin-bottom: 3px;">${client.address}</div>` : ''}
          ${client.client_category ? `
            <div style="margin: 4px 0;">
              <span style="padding: 2px 8px; background: #dbeafe; color: #1e40af; border-radius: 4px; font-size: 11px;">
                ${client.client_category.name}
              </span>
            </div>
          ` : ''}
          <div style="margin-top: 6px; padding: 6px 8px; background: ${debt > 0 ? '#fef2f2' : '#f0fdf4'}; border-radius: 6px;">
            <span style="font-weight: bold; color: ${debt > 0 ? '#dc2626' : '#16a34a'}; font-size: 13px;">
              ${debt > 0 ? debtLabel : ''}${formatCurrency(debt)}
            </span>
          </div>
          ${!client.is_active ? `<div style="margin-top: 4px; font-size: 11px; color: #ef4444; font-weight: bold;">${disabledLabel}</div>` : ''}
          ${client.source ? `
            <div style="margin-top: 4px; font-size: 10px; color: #888;">
              ${client.source === 'app' ? fromAppLabel : fromPlatformLabel}
            </div>
          ` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);

      if (onClientClick) {
        marker.on('click', () => onClientClick(client.id));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validClients.length > 0) {
      const bounds = L.latLngBounds(
        validClients.map(c => [c.gps_lat!, c.gps_lng!] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [clients, onClientClick, locale, isRTL, t]);

  const clientsWithGps = clients.filter(c => c.gps_lat && c.gps_lng);
  const clientsWithDebt = clientsWithGps.filter(c => (Number(c.combined_debt) || 0) > 0);

  return (
    <div className="relative">
      <div ref={mapContainerRef} className="h-[550px] rounded-lg z-0" />

      {/* Stats overlay */}
      <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]`}>
        <div className="text-sm font-semibold mb-2 dark:text-gray-100">{t('clients.clientsOnMap')}</div>
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{clientsWithGps.length}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{t('clients.outOfTotal', { total: clients.length })}</div>
      </div>

      {/* Legend */}
      <div className={`absolute bottom-4 ${isRTL ? 'right-4' : 'left-4'} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]`}>
        <div className="text-sm font-semibold mb-2 dark:text-gray-100">{t('clients.legend')}</div>
        <div className="space-y-2 text-xs dark:text-gray-300">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 shadow"></div>
            <span>{t('clients.noDebtLegend', { count: clientsWithGps.length - clientsWithDebt.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 shadow"></div>
            <span>{t('clients.hasDebtLegend', { count: clientsWithDebt.length })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 shadow"></div>
            <span>{t('clients.disabledLegend')}</span>
          </div>
        </div>
      </div>

      {clientsWithGps.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30 rounded-lg z-[500]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-2">📍</div>
            <p className="text-gray-700 dark:text-gray-200 font-medium">{t('clients.noClientsWithGps')}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('clients.addGpsHint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
