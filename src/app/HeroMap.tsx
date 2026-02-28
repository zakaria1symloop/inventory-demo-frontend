'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Routes spread left & right so desktop center stays clear for glass card ── */
const ROUTES = [
  // Left cluster (west Algiers) — Hub: Draria
  { from: { lat: 36.72, lng: 2.96 }, to: { lat: 36.74, lng: 2.93 }, color: '#6366f1' },  // → Ouled Fayet
  { from: { lat: 36.72, lng: 2.96 }, to: { lat: 36.70, lng: 2.95 }, color: '#818cf8' },  // → Baba Hassen
  { from: { lat: 36.72, lng: 2.96 }, to: { lat: 36.66, lng: 2.97 }, color: '#a78bfa' },  // → Birtouta
  // Right cluster (east Algiers) — Hub: near Bab Ezzouar
  { from: { lat: 36.73, lng: 3.18 }, to: { lat: 36.71, lng: 3.21 }, color: '#34d399' },  // → Dar El Beida
  { from: { lat: 36.73, lng: 3.18 }, to: { lat: 36.73, lng: 3.28 }, color: '#fbbf24' },  // → Rouiba
  { from: { lat: 36.73, lng: 3.18 }, to: { lat: 36.70, lng: 3.15 }, color: '#f472b6' },  // → Les Eucalyptus
];

const TRAIL_LENGTH = 8;

function lerp(coords: [number, number][], t: number): [number, number] {
  const n = coords.length - 1;
  const raw = t * n;
  const i = Math.min(Math.floor(raw), n - 1);
  const f = raw - i;
  const a = coords[i];
  const b = coords[i + 1] || a;
  return [a[1] + (b[1] - a[1]) * f, a[0] + (b[0] - a[0]) * f];
}

function injectMapStyles() {
  if (document.getElementById('heromap-styles')) return;
  const style = document.createElement('style');
  style.id = 'heromap-styles';
  style.textContent = `
    @keyframes hm-sonar {
      0%   { transform: translate(-50%,-50%) scale(0.3); opacity: 0.7; }
      100% { transform: translate(-50%,-50%) scale(2.8); opacity: 0; }
    }
    @keyframes hm-ping {
      0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
      50%      { transform: translate(-50%,-50%) scale(1.15); opacity: 0.8; }
    }
    @keyframes hm-marker-breathe {
      0%, 100% { filter: drop-shadow(0 0 6px var(--c)) drop-shadow(0 0 12px var(--c)); }
      50%      { filter: drop-shadow(0 0 10px var(--c)) drop-shadow(0 0 22px var(--c)); }
    }
    @keyframes hm-dash-flow {
      to { stroke-dashoffset: -40; }
    }
    .hm-hub-sonar {
      position: absolute; top: 50%; left: 50%;
      width: 50px; height: 50px; border-radius: 50%;
      transform: translate(-50%,-50%) scale(0.3);
      pointer-events: none;
    }
    .hm-hub-sonar-1 { animation: hm-sonar 2.4s ease-out infinite; }
    .hm-hub-sonar-2 { animation: hm-sonar 2.4s ease-out 0.8s infinite; }
    .hm-hub-sonar-3 { animation: hm-sonar 2.4s ease-out 1.6s infinite; }
    .hm-hub-core {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      animation: hm-ping 2s ease-in-out infinite;
    }
    .hm-marker {
      --c: #fff;
      animation: hm-marker-breathe 2s ease-in-out infinite;
      transition: transform 0.1s linear;
    }
    .hm-trail-dot {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%,-50%);
      border-radius: 50%;
      pointer-events: none;
      transition: opacity 0.4s ease;
    }
    .hm-route-flow {
      stroke-dasharray: 12 8;
      animation: hm-dash-flow 1.2s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

export default function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const rafRef = useRef(0);
  const initRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;
    injectMapStyles();

    const isMobile = window.innerWidth < 640;

    /* Auto-fit camera to all route points */
    const allPoints: [number, number][] = [];
    ROUTES.forEach((r) => {
      allPoints.push([r.from.lat, r.from.lng]);
      allPoints.push([r.to.lat, r.to.lng]);
    });
    const bounds = L.latLngBounds(allPoints);

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      boxZoom: false,
    });

    map.fitBounds(bounds, { padding: [50, 50] });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    /* ── Instant loading indicators — pulsing dots + dashed connector lines ── */
    const loadingLayers: L.Layer[] = [];

    ROUTES.forEach((route) => {
      /* Thin dashed line connecting from → to as a "skeleton" */
      const skeleton = L.polyline(
        [[route.from.lat, route.from.lng], [route.to.lat, route.to.lng]],
        { color: route.color, weight: 2, opacity: 0.15, dashArray: '6 8', interactive: false },
      ).addTo(map);
      loadingLayers.push(skeleton);
    });

    /* Pulsing dots at unique points */
    const seenPts = new Set<string>();
    ROUTES.forEach((route) => {
      [
        { lat: route.from.lat, lng: route.from.lng, color: route.color, size: 16 },
        { lat: route.to.lat, lng: route.to.lng, color: route.color, size: 10 },
      ].forEach((p) => {
        const key = `${p.lat},${p.lng}`;
        if (seenPts.has(key)) return;
        seenPts.add(key);
        const m = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [p.size * 2, p.size * 2],
            iconAnchor: [p.size, p.size],
            html: `
              <div style="position:relative;width:${p.size * 2}px;height:${p.size * 2}px">
                <div style="
                  position:absolute;inset:0;border-radius:50%;
                  background:${p.color}25;
                  animation: hm-sonar 1.8s ease-out infinite;
                "></div>
                <div style="
                  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:${p.size}px;height:${p.size}px;border-radius:50%;
                  background:${p.color};border:2px solid white;
                  box-shadow: 0 0 8px ${p.color}55;
                  animation: hm-ping 1.5s ease-in-out infinite;
                "></div>
              </div>
            `,
          }),
          interactive: false,
        }).addTo(map);
        loadingLayers.push(m);
      });
    });

    /* Remove loading indicators when a route draws */
    let loadingCleared = false;
    function clearLoading() {
      if (loadingCleared) return;
      loadingCleared = true;
      loadingLayers.forEach((l) => l.remove());
    }

    /* ── Fetch & draw each OSRM route instantly as it loads ── */
    const abortCtrl = new AbortController();

    const vehicles: {
      marker: L.Marker;
      trailDots: L.Marker[];
      coords: [number, number][];
      speed: number;
      color: string;
      history: [number, number][];
    }[] = [];

    let animStarted = false;
    let t0: number | null = null;
    let lastTrailUpdate = 0;

    function tick(ts: number) {
      if (!mapRef.current) return;
      if (!t0) t0 = ts;
      const elapsed = ts - t0;

      const shouldUpdateTrail = elapsed - lastTrailUpdate > 80;
      if (shouldUpdateTrail) lastTrailUpdate = elapsed;

      vehicles.forEach((v) => {
        const cycle = (elapsed % (v.speed * 2)) / v.speed;
        const t = cycle <= 1 ? cycle : 2 - cycle;
        const pos = lerp(v.coords, t);
        v.marker.setLatLng(pos);

        if (shouldUpdateTrail) {
          v.history.unshift(pos);
          if (v.history.length > TRAIL_LENGTH) v.history.pop();

          v.trailDots.forEach((dot, idx) => {
            if (v.history[idx + 1]) {
              dot.setLatLng(v.history[idx + 1]);
            }
          });
        }
      });

      rafRef.current = requestAnimationFrame(tick);
    }

    function startAnim() {
      if (!animStarted) {
        animStarted = true;
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    /* Draw a single route on the map as soon as it loads */
    function drawLoadedRoute(coords: [number, number][], i: number, color: string) {
      if (!mapRef.current) return;
      clearLoading();
      const latLngs: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);

      /* Soft shadow */
      L.polyline(latLngs, {
        color: '#000', weight: isMobile ? 10 : 8, opacity: isMobile ? 0.06 : 0.04,
        interactive: false, lineCap: 'round', lineJoin: 'round',
      }).addTo(mapRef.current!);

      /* Base route */
      L.polyline(latLngs, {
        color, weight: isMobile ? 4 : 3, opacity: isMobile ? 0.3 : 0.18,
        interactive: false, lineCap: 'round', lineJoin: 'round',
      }).addTo(mapRef.current!);

      /* Animated flowing dashed overlay */
      const flowLine = L.polyline(latLngs, {
        color, weight: isMobile ? 3.5 : 2.5, opacity: isMobile ? 0.7 : 0.55,
        interactive: false, lineCap: 'round', lineJoin: 'round',
        className: 'hm-route-flow',
      }).addTo(mapRef.current!);

      const el = flowLine.getElement() as HTMLElement | null;
      if (el) el.style.animationDuration = `${1 + i * 0.15}s`;

      /* Vehicles + trails (desktop only) */
      if (!isMobile) {
        const trailDots: L.Marker[] = [];
        for (let t = 0; t < TRAIL_LENGTH; t++) {
          const size = Math.max(4, 10 - t * 1);
          const opacity = Math.max(0.06, 0.35 - t * 0.04);
          const dot = L.marker(lerp(coords, 0), {
            icon: L.divIcon({
              className: '',
              iconSize: [size, size],
              iconAnchor: [size / 2, size / 2],
              html: `<div class="hm-trail-dot" style="
                width:${size}px;height:${size}px;
                background:${color};
                opacity:${opacity};
                box-shadow: 0 0 ${4 + (TRAIL_LENGTH - t)}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')};
              "></div>`,
            }),
            interactive: false,
          }).addTo(mapRef.current!);
          trailDots.push(dot);
        }

        const vehicleIcon = L.divIcon({
          className: '',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          html: `
            <div class="hm-marker" style="--c:${color};width:28px;height:28px;position:relative">
              <div style="
                width:28px;height:28px;border-radius:50%;
                background: linear-gradient(135deg, ${color}, ${color}cc);
                border:3px solid white;
                box-shadow: 0 2px 12px ${color}88, 0 0 20px ${color}44;
                display:flex;align-items:center;justify-content:center;
              ">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                </svg>
              </div>
            </div>
          `,
        });

        const marker = L.marker(lerp(coords, 0), {
          icon: vehicleIcon,
          interactive: false,
        }).addTo(mapRef.current!);

        vehicles.push({ marker, trailDots, coords, speed: 14000 + i * 2500, color, history: [] });
        startAnim();
      }
    }

    /* Fire all fetches in parallel — each draws as soon as it resolves */
    ROUTES.forEach((route, i) => {
      fetch(
        `https://router.project-osrm.org/route/v1/driving/${route.from.lng},${route.from.lat};${route.to.lng},${route.to.lat}?overview=full&geometries=geojson`,
        { signal: abortCtrl.signal },
      )
        .then((res) => res.json())
        .then((json) => {
          const coords: [number, number][] | undefined = json.routes?.[0]?.geometry?.coordinates;
          if (coords) drawLoadedRoute(coords, i, route.color);
        })
        .catch(() => {});
    });

    /* Add hub + destination markers (desktop only) — show immediately */
    if (!isMobile) {
      const hubs = [
        { lat: 36.72, lng: 2.96, color: '#4f46e5' },
        { lat: 36.73, lng: 3.18, color: '#059669' },
      ];

      hubs.forEach((h) => {
        L.marker([h.lat, h.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [60, 60],
            iconAnchor: [30, 30],
            html: `
              <div style="position:relative;width:60px;height:60px">
                <div class="hm-hub-sonar hm-hub-sonar-1" style="border:2px solid ${h.color}40"></div>
                <div class="hm-hub-sonar hm-hub-sonar-2" style="border:2px solid ${h.color}30"></div>
                <div class="hm-hub-sonar hm-hub-sonar-3" style="border:2px solid ${h.color}20"></div>
                <div class="hm-hub-core" style="
                  width:36px;height:36px;border-radius:10px;
                  background:linear-gradient(135deg, ${h.color}, ${h.color}dd);
                  border:3px solid white;
                  box-shadow: 0 4px 20px ${h.color}55, 0 0 30px ${h.color}22;
                  display:flex;align-items:center;justify-content:center;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
              </div>
            `,
          }),
          interactive: false,
        }).addTo(map);
      });

      ROUTES.forEach((r) => {
        L.marker([r.to.lat, r.to.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            html: `
              <div style="position:relative;width:22px;height:22px">
                <div style="
                  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:22px;height:22px;border-radius:50%;
                  background:${r.color}18;
                "></div>
                <div style="
                  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:12px;height:12px;border-radius:50%;
                  background:${r.color};border:2.5px solid white;
                  box-shadow: 0 2px 8px ${r.color}66, 0 0 16px ${r.color}33;
                "></div>
              </div>
            `,
          }),
          interactive: false,
        }).addTo(map);
      });
    }

    return () => {
      abortCtrl.abort();
      cancelAnimationFrame(rafRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initRef.current = false;
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40 pointer-events-none" />
    </div>
  );
}
