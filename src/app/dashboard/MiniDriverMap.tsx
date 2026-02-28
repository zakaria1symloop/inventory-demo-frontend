'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

interface MiniDriverMapProps {
  drivers: Driver[];
}

const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });
};

const onlineIcon = createIcon('#22c55e');
const offlineIcon = createIcon('#9ca3af');
const activeDeliveryIcon = createIcon('#3b82f6');

export default function MiniDriverMap({ drivers }: MiniDriverMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = [34.8416, 5.7289];

    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const validDrivers = drivers.filter(d => d.latitude && d.longitude);
    if (validDrivers.length === 0) return;

    validDrivers.forEach(driver => {
      const icon = driver.has_active_delivery
        ? activeDeliveryIcon
        : driver.is_online
        ? onlineIcon
        : offlineIcon;

      const marker = L.marker([driver.latitude!, driver.longitude!], { icon })
        .addTo(mapRef.current!);

      const popupContent = `
        <div style="direction: rtl; text-align: right; min-width: 120px; font-size: 12px;">
          <div style="font-weight: bold;">${driver.name}</div>
          <div style="font-size: 10px; color: ${driver.is_online ? '#16a34a' : '#9ca3af'}; margin-top: 2px;">
            ${driver.is_online ? 'متصل' : 'غير متصل'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    if (validDrivers.length > 0) {
      const bounds = L.latLngBounds(
        validDrivers.map(d => [d.latitude!, d.longitude!] as [number, number])
      );
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [drivers]);

  return (
    <div ref={mapContainerRef} className="h-full w-full rounded-lg" style={{ minHeight: '300px' }} />
  );
}
