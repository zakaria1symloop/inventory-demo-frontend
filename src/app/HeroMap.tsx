'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Algeria distribution network ── */

const HUBS = [
  { lat: 36.7538, lng: 3.0588, color: '#3b82f6' },   // Algiers
  { lat: 35.6969, lng: -0.6331, color: '#8b5cf6' },   // Oran
  { lat: 36.3650, lng: 6.6147, color: '#10b981' },    // Constantine
  { lat: 36.1898, lng: 5.4108, color: '#f59e0b' },    // Sétif
  { lat: 35.5567, lng: 6.1744, color: '#ef4444' },    // Batna
];

const ROUTES = [
  // From Algiers (main hub — 10 routes)
  { from: [36.7538, 3.0588], to: [35.6969, -0.6331], color: '#818cf8', curve: -0.18 },   // → Oran
  { from: [36.7538, 3.0588], to: [36.3650, 6.6147],  color: '#34d399', curve: 0.14 },    // → Constantine
  { from: [36.7538, 3.0588], to: [36.1898, 5.4108],  color: '#fbbf24', curve: 0.10 },    // → Sétif
  { from: [36.7538, 3.0588], to: [36.4700, 2.8300],  color: '#60a5fa', curve: -0.40 },   // → Blida
  { from: [36.7538, 3.0588], to: [36.7117, 4.0456],  color: '#a78bfa', curve: -0.15 },   // → Tizi Ouzou
  { from: [36.7538, 3.0588], to: [36.1647, 1.3325],  color: '#fb923c', curve: -0.14 },   // → Chlef
  { from: [36.7538, 3.0588], to: [36.7500, 5.0833],  color: '#2dd4bf', curve: 0.08 },    // → Béjaïa
  { from: [36.7538, 3.0588], to: [34.6707, 3.2503],  color: '#f472b6', curve: 0.14 },    // → Djelfa
  { from: [36.7538, 3.0588], to: [36.2644, 2.7544],  color: '#38bdf8', curve: -0.35 },   // → Médéa
  { from: [36.7538, 3.0588], to: [36.3800, 3.9000],  color: '#67e8f9', curve: -0.12 },   // → Bouira
  // From Oran (west hub — 4 routes)
  { from: [35.6969, -0.6331], to: [34.8781, -1.3150], color: '#c084fc', curve: -0.22 },   // → Tlemcen
  { from: [35.6969, -0.6331], to: [35.9333, 0.0833],  color: '#e879f9', curve: 0.22 },    // → Mostaganem
  { from: [35.6969, -0.6331], to: [35.3700, -0.2833], color: '#d8b4fe', curve: -0.25 },   // → Sidi Bel Abbès
  { from: [35.6969, -0.6331], to: [35.4308, 0.8414],  color: '#f0abfc', curve: 0.15 },    // → Relizane
  // From Constantine (east hub — 4 routes)
  { from: [36.3650, 6.6147], to: [36.9000, 7.7667],  color: '#6ee7b7', curve: 0.18 },    // → Annaba
  { from: [36.3650, 6.6147], to: [35.5567, 6.1744],  color: '#4ade80', curve: 0.18 },    // → Batna
  { from: [36.3650, 6.6147], to: [36.8764, 6.9061],  color: '#86efac', curve: -0.20 },   // → Skikda
  { from: [36.3650, 6.6147], to: [36.8000, 5.7667],  color: '#a7f3d0', curve: 0.25 },    // → Jijel
  // From Sétif (central hub — 3 routes)
  { from: [36.1898, 5.4108], to: [35.7050, 4.5420],  color: '#fcd34d', curve: -0.18 },   // → M'sila
  { from: [36.1898, 5.4108], to: [35.4000, 5.0000],  color: '#fde68a', curve: 0.16 },    // → Bordj Bou Arréridj
  { from: [36.1898, 5.4108], to: [36.6500, 4.8500],  color: '#fef08a', curve: -0.20 },   // → Béjaïa (south route)
  // From Batna (south hub — 3 routes)
  { from: [35.5567, 6.1744], to: [34.8481, 5.7280],  color: '#fca5a5', curve: 0.18 },    // → Biskra
  { from: [35.5567, 6.1744], to: [35.0547, 7.6331],  color: '#f87171', curve: -0.15 },   // → Tébessa
  { from: [35.5567, 6.1744], to: [35.3833, 7.5833],  color: '#fb7185', curve: 0.12 },    // → Khenchela
] as const;

const TRAIL_LENGTH = 6;

/* ── Helpers ── */

function generateArc(
  from: readonly number[],
  to: readonly number[],
  curvature: number,
  segments = 80,
): [number, number][] {
  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const dx = to[1] - from[1];
  const dy = to[0] - from[0];
  const ctrl = [mid[0] + dx * curvature, mid[1] - dy * curvature];

  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    pts.push([
      u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1],
    ]);
  }
  return pts;
}

function lerp(coords: [number, number][], t: number): [number, number] {
  const n = coords.length - 1;
  const raw = t * n;
  const i = Math.min(Math.floor(raw), n - 1);
  const f = raw - i;
  const a = coords[i];
  const b = coords[i + 1] || a;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

/* ── CSS injection ── */

function injectStyles() {
  if (document.getElementById('hm2-css')) return;
  const s = document.createElement('style');
  s.id = 'hm2-css';
  s.textContent = `
    @keyframes hm2-sonar {
      0%   { transform: translate(-50%,-50%) scale(0.5); opacity: 0.6; }
      100% { transform: translate(-50%,-50%) scale(3.5); opacity: 0; }
    }
    @keyframes hm2-ping {
      0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
      50%      { transform: translate(-50%,-50%) scale(1.15); opacity: 0.85; }
    }
    @keyframes hm2-glow {
      0%, 100% { box-shadow: 0 0 4px var(--c), 0 0 10px var(--c); }
      50%      { box-shadow: 0 0 8px var(--c), 0 0 20px var(--c); }
    }
    @keyframes hm2-dash {
      to { stroke-dashoffset: -30; }
    }
    @keyframes hm2-notif {
      0%   { opacity: 0; transform: translate(-50%, 5px) scale(0.8); }
      12%  { opacity: 1; transform: translate(-50%, -8px) scale(1); }
      80%  { opacity: 1; transform: translate(-50%, -8px) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -20px) scale(0.9); }
    }
    @keyframes hm2-dest-pulse {
      0%, 100% { transform: translate(-50%,-50%) scale(1); opacity: 0.5; }
      50%      { transform: translate(-50%,-50%) scale(2.2); opacity: 0; }
    }
    .hm2-flow {
      stroke-dasharray: 10 6;
      animation: hm2-dash 1s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

/* ── Component ── */

export default function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const rafRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Prevent double-init — but allow re-init after cleanup
    if (mapRef.current) return;

    injectStyles();

    const isMobile = window.innerWidth < 640;
    const segments = isMobile ? 50 : 80;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timersRef.current = timers;

    // Helper to track all timeouts
    function later(fn: () => void, ms: number) {
      timers.push(setTimeout(fn, ms));
    }

    // Generate all arc paths
    const arcs = ROUTES.map((r) => generateArc(r.from, r.to, r.curve, segments));

    // Compute bounds
    const allPts: [number, number][] = [];
    ROUTES.forEach((r) => {
      allPts.push([r.from[0], r.from[1]]);
      allPts.push([r.to[0], r.to[1]]);
    });

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
    map.fitBounds(L.latLngBounds(allPts), { padding: isMobile ? [15, 15] : [50, 50] });
    mapRef.current = map;

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    /* ── Vehicle animation state ── */
    const vehicles: {
      marker: L.Marker;
      trailDots: L.Marker[];
      coords: [number, number][];
      speed: number;
      history: [number, number][];
    }[] = [];

    let t0: number | null = null;
    let lastTrailUpdate = 0;
    let animStarted = false;

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
            if (v.history[idx + 1]) dot.setLatLng(v.history[idx + 1]);
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

    /* ── Hub markers ── */
    HUBS.forEach((hub, hIdx) => {
      const hubSize = isMobile ? 26 : 42;
      const sonarSize = isMobile ? 36 : 68;

      later(() => {
        if (!mapRef.current) return;
        L.marker([hub.lat, hub.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [sonarSize, sonarSize],
            iconAnchor: [sonarSize / 2, sonarSize / 2],
            html: `
              <div style="position:relative;width:${sonarSize}px;height:${sonarSize}px">
                ${!isMobile ? `
                  <div style="position:absolute;top:50%;left:50%;width:${sonarSize}px;height:${sonarSize}px;border-radius:50%;border:1.5px solid ${hub.color}55;animation:hm2-sonar 2.8s ease-out infinite"></div>
                  <div style="position:absolute;top:50%;left:50%;width:${sonarSize}px;height:${sonarSize}px;border-radius:50%;border:1.5px solid ${hub.color}35;animation:hm2-sonar 2.8s ease-out 0.9s infinite"></div>
                  <div style="position:absolute;top:50%;left:50%;width:${sonarSize}px;height:${sonarSize}px;border-radius:50%;border:1.5px solid ${hub.color}22;animation:hm2-sonar 2.8s ease-out 1.8s infinite"></div>
                ` : ''}
                <div style="
                  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:${hubSize}px;height:${hubSize}px;border-radius:${isMobile ? '8px' : '12px'};
                  background:linear-gradient(135deg, ${hub.color}, ${hub.color}cc);
                  border:${isMobile ? '2px' : '3px'} solid rgba(255,255,255,0.85);
                  box-shadow: 0 2px 12px ${hub.color}55, 0 0 24px ${hub.color}22;
                  display:flex;align-items:center;justify-content:center;
                  animation: hm2-ping 2.5s ease-in-out infinite;
                ">
                  <svg width="${isMobile ? 11 : 17}" height="${isMobile ? 11 : 17}" viewBox="0 0 24 24" fill="white" stroke="none">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                </div>
              </div>
            `,
          }),
          interactive: false,
        }).addTo(mapRef.current);
      }, 80 + hIdx * 120);
    });

    /* ── Staggered route drawing ── */
    arcs.forEach((arcPts, i) => {
      const route = ROUTES[i];

      later(() => {
        if (!mapRef.current) return;

        // Glow / shadow layer
        const glow = L.polyline(arcPts, {
          color: route.color,
          weight: isMobile ? 7 : 6,
          opacity: 0.12,
          interactive: false,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapRef.current);

        // Main route line
        const line = L.polyline(arcPts, {
          color: route.color,
          weight: isMobile ? 3 : 2.5,
          opacity: 0,
          interactive: false,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapRef.current);

        // Draw animation via stroke-dashoffset
        requestAnimationFrame(() => {
          const glowEl = glow.getElement() as SVGPathElement | null;
          const lineEl = line.getElement() as SVGPathElement | null;

          if (lineEl) {
            const len = lineEl.getTotalLength();
            lineEl.style.opacity = '0.75';
            lineEl.style.strokeDasharray = `${len}`;
            lineEl.style.strokeDashoffset = `${len}`;
            lineEl.getBoundingClientRect();
            lineEl.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
            lineEl.style.strokeDashoffset = '0';
          }
          if (glowEl) {
            const len = glowEl.getTotalLength();
            glowEl.style.strokeDasharray = `${len}`;
            glowEl.style.strokeDashoffset = `${len}`;
            glowEl.getBoundingClientRect();
            glowEl.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
            glowEl.style.strokeDashoffset = '0';
          }
        });

        // After draw animation: add flowing overlay + vehicle
        later(() => {
          if (!mapRef.current) return;

          const flow = L.polyline(arcPts, {
            color: route.color,
            weight: isMobile ? 2 : 1.5,
            opacity: 0.5,
            interactive: false,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'hm2-flow',
          }).addTo(mapRef.current);

          const flowEl = flow.getElement() as HTMLElement | null;
          if (flowEl) flowEl.style.animationDuration = `${0.8 + i * 0.08}s`;

          // Vehicle + comet trail (desktop only)
          if (!isMobile) {
            const trailDots: L.Marker[] = [];
            for (let t = 0; t < TRAIL_LENGTH; t++) {
              const size = Math.max(3, 8 - t);
              const opacity = Math.max(0.05, 0.4 - t * 0.06);
              const dot = L.marker(lerp(arcPts, 0), {
                icon: L.divIcon({
                  className: '',
                  iconSize: [size, size],
                  iconAnchor: [size / 2, size / 2],
                  html: `<div style="
                    width:${size}px;height:${size}px;border-radius:50%;
                    background:${route.color};opacity:${opacity};
                    box-shadow: 0 0 ${3 + (TRAIL_LENGTH - t)}px ${route.color};
                  "></div>`,
                }),
                interactive: false,
              }).addTo(mapRef.current!);
              trailDots.push(dot);
            }

            const marker = L.marker(lerp(arcPts, 0), {
              icon: L.divIcon({
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                html: `<div style="
                  --c:${route.color};
                  width:20px;height:20px;border-radius:50%;
                  background:${route.color};
                  border:2.5px solid rgba(255,255,255,0.9);
                  animation: hm2-glow 2s ease-in-out infinite;
                "></div>`,
              }),
              interactive: false,
            }).addTo(mapRef.current!);

            vehicles.push({
              marker,
              trailDots,
              coords: arcPts,
              speed: 10000 + i * 1500,
              history: [],
            });
            startAnim();
          }
        }, 1600);
      }, 200 + i * 120);
    });

    /* ── Destination dots ── */
    ROUTES.forEach((r, rIdx) => {
      later(() => {
        if (!mapRef.current) return;
        const dotSize = isMobile ? 7 : 12;
        L.marker([r.to[0], r.to[1]], {
          icon: L.divIcon({
            className: '',
            iconSize: [dotSize * 2, dotSize * 2],
            iconAnchor: [dotSize, dotSize],
            html: `
              <div style="position:relative;width:${dotSize * 2}px;height:${dotSize * 2}px">
                ${!isMobile ? `
                  <div style="
                    position:absolute;top:50%;left:50%;
                    width:${dotSize * 2}px;height:${dotSize * 2}px;border-radius:50%;
                    background:${r.color}30;
                    animation: hm2-dest-pulse 2.5s ease-in-out infinite;
                  "></div>
                ` : ''}
                <div style="
                  position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                  width:${dotSize}px;height:${dotSize}px;border-radius:50%;
                  background:${r.color};
                  border:${isMobile ? '1.5px' : '2.5px'} solid rgba(255,255,255,0.85);
                  box-shadow: 0 0 8px ${r.color}88, 0 0 16px ${r.color}44;
                "></div>
              </div>
            `,
          }),
          interactive: false,
        }).addTo(mapRef.current);
      }, 400 + rIdx * 120);
    });

    /* ── Delivery notification popups (desktop only) ── */
    if (!isMobile) {
      let notifIdx = 0;
      later(() => {
        notifIntervalRef.current = setInterval(() => {
          if (!mapRef.current) return;
          const route = ROUTES[notifIdx % ROUTES.length];
          const notif = L.marker([route.to[0], route.to[1]], {
            icon: L.divIcon({
              className: '',
              iconSize: [120, 32],
              iconAnchor: [60, 44],
              html: `<div style="
                background:${route.color};color:white;
                padding:5px 14px;border-radius:16px;
                font-size:11px;font-weight:700;font-family:system-ui,sans-serif;
                white-space:nowrap;letter-spacing:0.02em;
                box-shadow: 0 4px 16px ${route.color}44, 0 0 12px ${route.color}22;
                animation: hm2-notif 3.5s ease forwards;
                text-align:center;
              ">&#x2713; تم التسليم</div>`,
            }),
            interactive: false,
          }).addTo(mapRef.current);
          later(() => notif.remove(), 3600);
          notifIdx++;
        }, 3000);
      }, 200 + ROUTES.length * 120 + 1800);
    }

    return () => {
      // Clear ALL pending timeouts
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      cancelAnimationFrame(rafRef.current);
      if (notifIntervalRef.current) {
        clearInterval(notifIntervalRef.current);
        notifIntervalRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
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
