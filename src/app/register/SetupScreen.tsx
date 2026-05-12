'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/i18n/context';

/**
 * Premium minimal "Setting up your account" screen.
 * Monochrome, hairline details, refined typography. Linear/Vercel-style.
 */
export default function SetupScreen() {
  const { t, locale, dir } = useLocale();
  const [elapsed, setElapsed] = useState(0);
  const [systemMessageIndex, setSystemMessageIndex] = useState(0);

  const systemMessages = [
    t('auth.setupSys1'),
    t('auth.setupSys2'),
    t('auth.setupSys3'),
    t('auth.setupSys4'),
    t('auth.setupSys5'),
    t('auth.setupSys6'),
    t('auth.setupSys7'),
  ];

  useEffect(() => {
    const tick = setInterval(() => setElapsed((e) => e + 0.1), 100);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const rotate = setInterval(() => {
      setSystemMessageIndex((i) => (i + 1) % systemMessages.length);
    }, 3000);
    return () => clearInterval(rotate);
  }, [systemMessages.length]);

  const step1Done = elapsed >= 3;
  const step2Done = elapsed >= 22;
  const step3Active = elapsed >= 22;
  const isRtl = dir === 'rtl';

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-white"
      style={{
        fontFamily:
          locale === 'ar'
            ? '"Tajawal", "Inter", "Segoe UI", system-ui, sans-serif'
            : '"Inter", "Segoe UI", system-ui, sans-serif',
      }}
    >
      {/* Subtle noise grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
        }}
      />

      {/* Hairline grid — almost invisible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.018) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[480px] px-6">
        {/* Mark */}
        <div
          className="mb-14 flex items-center justify-center"
          style={{ animation: 'fade-in 0.6s ease-out both' }}
        >
          <div className="relative h-12 w-12">
            {/* Pulsing concentric rings */}
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-neutral-900/15"
              style={{ animation: 'ring 2.6s ease-out infinite' }}
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-neutral-900/15"
              style={{
                animation: 'ring 2.6s ease-out infinite',
                animationDelay: '1.3s',
              }}
            />

            {/* Mark */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <svg
                  className="h-4 w-4 text-neutral-900"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-12 text-center">
          <p
            className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400"
            style={{ animation: 'fade-up 0.7s ease-out 0.1s both' }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-900/40" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neutral-900" />
            </span>
            {t('auth.setupBadge')}
          </p>

          <h1
            className="mb-4 text-[32px] font-semibold leading-[1.1] tracking-tight text-neutral-950 sm:text-[38px]"
            style={{
              animation: 'fade-up 0.8s ease-out 0.2s both',
              letterSpacing: '-0.02em',
            }}
          >
            {t('auth.setupHeading')}
          </h1>

          <p
            className="mx-auto max-w-[380px] text-[14.5px] leading-relaxed text-neutral-500"
            style={{ animation: 'fade-up 0.8s ease-out 0.3s both' }}
          >
            {t('auth.setupSubheading')}
          </p>
        </div>

        {/* Steps */}
        <div
          className="mb-10"
          style={{ animation: 'fade-up 0.9s ease-out 0.4s both' }}
        >
          <ol className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
            <Step
              title={t('auth.setupStep1Title')}
              caption={t('auth.setupStep1Caption')}
              state={step1Done ? 'done' : 'active'}
              isRtl={isRtl}
            />
            <Step
              title={t('auth.setupStep2Title')}
              caption={
                step2Done
                  ? t('auth.setupStep2Done')
                  : systemMessages[systemMessageIndex]
              }
              state={step2Done ? 'done' : step1Done ? 'active' : 'pending'}
              dynamicCaption={!step2Done && step1Done}
              isRtl={isRtl}
            />
            <Step
              title={t('auth.setupStep3Title')}
              caption={t('auth.setupStep3Caption')}
              state={step3Active ? 'active' : 'pending'}
              isRtl={isRtl}
              isLast
            />
          </ol>
        </div>

        {/* Footer hint */}
        <div
          className="text-center"
          style={{ animation: 'fade-up 1s ease-out 0.5s both' }}
        >
          <p className="text-[12.5px] text-neutral-400">
            {t('auth.setupFooter')}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes ring {
          0% {
            transform: scale(0.9);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.7);
            opacity: 0;
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fade-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes caption-fade {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes dot-bounce {
          0%,
          80%,
          100% {
            transform: scale(0.6);
            opacity: 0.4;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

interface StepProps {
  title: string;
  caption: string;
  state: 'done' | 'active' | 'pending';
  isLast?: boolean;
  dynamicCaption?: boolean;
  isRtl?: boolean;
}

function Step({ title, caption, state, isLast, dynamicCaption, isRtl }: StepProps) {
  return (
    <li className="group relative flex items-start gap-4 py-3">
      {/* Connector */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute top-[28px] h-full w-px"
          style={{
            [isRtl ? 'right' : 'left']: '11px',
            background:
              state === 'done'
                ? 'linear-gradient(to bottom, rgba(23,23,23,1), rgba(23,23,23,0.15))'
                : 'rgba(0,0,0,0.06)',
          }}
        />
      )}

      {/* Indicator */}
      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center pt-0.5">
        {state === 'done' ? (
          <div
            className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-neutral-950 text-white"
            style={{ animation: 'fade-in 0.3s ease-out' }}
          >
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
        ) : state === 'active' ? (
          <div className="relative flex h-[22px] w-[22px] items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border border-neutral-200"
              aria-hidden
            />
            <span
              className="absolute inset-0 rounded-full border border-transparent"
              style={{
                borderTopColor: '#0a0a0a',
                animation: 'spin 0.9s linear infinite',
              }}
              aria-hidden
            />
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-950" />
          </div>
        ) : (
          <div className="h-[22px] w-[22px] rounded-full border border-neutral-200" />
        )}
      </div>

      {/* Text */}
      <div className="flex-1 pb-1">
        <h3
          className={`text-[14px] font-medium tracking-tight transition-colors ${
            state === 'pending' ? 'text-neutral-400' : 'text-neutral-950'
          }`}
        >
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[12.5px] leading-relaxed">
          <span
            key={dynamicCaption ? caption : 'static'}
            className={`transition-colors ${
              state === 'pending'
                ? 'text-neutral-300'
                : state === 'active'
                ? 'text-neutral-600'
                : 'text-neutral-500'
            }`}
            style={
              dynamicCaption
                ? { animation: 'caption-fade 0.4s ease-out' }
                : undefined
            }
          >
            {caption}
          </span>
          {state === 'active' && (
            <span className="inline-flex items-center gap-0.5">
              <span
                className="h-[3px] w-[3px] rounded-full bg-neutral-400"
                style={{ animation: 'dot-bounce 1.4s ease-in-out infinite' }}
              />
              <span
                className="h-[3px] w-[3px] rounded-full bg-neutral-400"
                style={{
                  animation: 'dot-bounce 1.4s ease-in-out infinite',
                  animationDelay: '0.2s',
                }}
              />
              <span
                className="h-[3px] w-[3px] rounded-full bg-neutral-400"
                style={{
                  animation: 'dot-bounce 1.4s ease-in-out infinite',
                  animationDelay: '0.4s',
                }}
              />
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
