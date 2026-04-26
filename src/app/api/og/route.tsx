import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
  rose: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)',
  orange: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
  sky: 'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',
  violet: 'linear-gradient(135deg, #8b5cf6 0%, #6b21a8 100%)',
  emerald: 'linear-gradient(135deg, #10b981 0%, #15803d 100%)',
  slate: 'linear-gradient(135deg, #475569 0%, #27272a 100%)',
  default: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get('title')?.slice(0, 120) || 'TrackSera';
  const subtitle = searchParams.get('subtitle')?.slice(0, 180) || '';
  const category = searchParams.get('category')?.slice(0, 40) || '';
  const theme = searchParams.get('theme') || 'default';
  const background = GRADIENTS[theme] || GRADIENTS.default;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background,
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Crosshatch texture */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18,
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 14px)',
          }}
        />
        {/* Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Top row: brand + category */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
              }}
            >
              T
            </div>
            TrackSera
          </div>
          {category && (
            <div
              style={{
                display: 'flex',
                padding: '10px 22px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {category}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', maxWidth: '92%' }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              display: 'flex',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 28,
                fontSize: 28,
                fontWeight: 400,
                opacity: 0.85,
                lineHeight: 1.4,
                display: 'flex',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 22,
            opacity: 0.85,
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex' }}>tracksera.com</div>
          <div style={{ display: 'flex' }}>Produits · Caisse · Distribution · Algérie</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
