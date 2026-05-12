'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { settingsApi } from '@/lib/api';
import { useLocale } from '@/lib/i18n/context';

export interface TourStep {
  target: string;
  title: string;
  desc: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  beforeShow?: () => void;
  requireClick?: boolean;
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  saveOnComplete?: boolean;
  storageKey?: string;
}

export default function GuidedTour({ steps, onComplete, saveOnComplete = false, storageKey = 'tour_step' }: GuidedTourProps) {
  const { locale, dir } = useLocale();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const total = steps.length;
  const step = steps[currentStep];

  const clickHandlerRef = useRef<{ el: HTMLElement; handler: () => void } | null>(null);

  const cleanupClickHandler = useCallback(() => {
    if (clickHandlerRef.current) {
      const { el, handler } = clickHandlerRef.current;
      el.removeEventListener('click', handler);
      clickHandlerRef.current = null;
    }
  }, []);

  const positionTooltip = useCallback(() => {
    if (!step) return;
    // Find a VISIBLE element matching the selector (skip hidden tab content)
    const allMatches = document.querySelectorAll(step.target) as NodeListOf<HTMLElement>;
    let el: HTMLElement | null = null;
    for (const candidate of allMatches) {
      const rect = candidate.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && candidate.offsetParent !== null) {
        el = candidate;
        break;
      }
    }
    if (!el) {
      if (currentStep < total - 1) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    step.beforeShow?.();

    // Capture rect on next frame for accuracy
    requestAnimationFrame(() => {
      setTargetRect(el.getBoundingClientRect());

      if (step.requireClick) {
        const handler = () => {
          cleanupClickHandler();
          if (currentStep < total - 1) {
            setCurrentStep(prev => prev + 1);
          }
        };
        el.addEventListener('click', handler);
        clickHandlerRef.current = { el, handler };
      }

      setIsVisible(true);
    });
  }, [step, currentStep, total, cleanupClickHandler]);

  useEffect(() => {
    setIsVisible(false);
    cleanupClickHandler();
    requestAnimationFrame(() => positionTooltip());
  }, [currentStep, positionTooltip, cleanupClickHandler]);

  // Recalc rect on resize or scroll so cutout stays aligned
  useEffect(() => {
    const recalc = () => {
      if (!step) return;
      const allMatches = document.querySelectorAll(step.target) as NodeListOf<HTMLElement>;
      for (const candidate of allMatches) {
        const rect = candidate.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && candidate.offsetParent !== null) {
          setTargetRect(rect);
          break;
        }
      }
    };
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [step]);

  const handleNext = () => {
    if (currentStep < total - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    cleanupClickHandler();
    if (saveOnComplete) {
      try { await settingsApi.update({ onboarding_completed: 'true' }); } catch { /* */ }
    }
    localStorage.removeItem(storageKey);
    onComplete();
  };

  // Save/restore step
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const s = parseInt(saved, 10);
      if (!isNaN(s) && s >= 0 && s < total) setCurrentStep(s);
    }
  }, [total, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, String(currentStep));
  }, [currentStep, storageKey]);

  if (!step || !targetRect) {
    return createPortal(
      <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>,
      document.body
    );
  }

  // Smart tooltip positioning
  const tooltipW = typeof window !== 'undefined' ? Math.min(320, window.innerWidth - 32) : 320;
  const tooltipH = 220;
  const gap = 16;
  const rawPos = step.position === 'auto' || !step.position ? calcBestPosition(targetRect, tooltipW, tooltipH, gap) : step.position;
  // In LTR mode, flip left/right so tooltip stays on the correct side of the target
  const pos = dir === 'ltr' ? (rawPos === 'right' ? 'left' : rawPos === 'left' ? 'right' : rawPos) : rawPos;

  const tooltipStyle: React.CSSProperties = {};

  if (pos === 'bottom') {
    tooltipStyle.top = targetRect.bottom + gap;
    tooltipStyle.left = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, targetRect.left + targetRect.width / 2 - tooltipW / 2));
  } else if (pos === 'top') {
    tooltipStyle.top = targetRect.top - tooltipH - gap;
    tooltipStyle.left = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, targetRect.left + targetRect.width / 2 - tooltipW / 2));
  } else if (pos === 'left') {
    tooltipStyle.top = Math.max(16, Math.min(window.innerHeight - tooltipH - 16, targetRect.top + targetRect.height / 2 - tooltipH / 2));
    tooltipStyle.left = targetRect.left - tooltipW - gap;
  } else {
    // right
    tooltipStyle.top = Math.max(16, Math.min(window.innerHeight - tooltipH - 16, targetRect.top + targetRect.height / 2 - tooltipH / 2));
    tooltipStyle.left = targetRect.right + gap;
  }

  // Clamp on screen
  if (typeof tooltipStyle.left === 'number') {
    tooltipStyle.left = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, tooltipStyle.left));
  }
  if (typeof tooltipStyle.top === 'number') {
    tooltipStyle.top = Math.max(16, Math.min(window.innerHeight - tooltipH - 16, tooltipStyle.top));
  }

  // Cutout positioned exactly on target
  const hlPad = 6;

  return createPortal(
    <>
      {/* Click-away overlay (behind the cutout) */}
      <div
        className="fixed inset-0 z-[200] transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
        onClick={step.requireClick ? undefined : handleNext}
      />

      {/* Cutout div: sits exactly on the target, box-shadow creates the dark overlay */}
      <div
        className="fixed z-[200] transition-all duration-300"
        style={{
          top: targetRect.top - hlPad,
          left: targetRect.left - hlPad,
          width: targetRect.width + hlPad * 2,
          height: targetRect.height + hlPad * 2,
          borderRadius: 10,
          opacity: isVisible ? 1 : 0,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px rgba(59,130,246,0.5), 0 0 24px 4px rgba(59,130,246,0.18)',
          pointerEvents: 'none',
          animation: isVisible ? 'tour-ring 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* requireClick: click-catcher over the target */}
      {step.requireClick && (
        <div
          className="fixed z-[201] cursor-pointer"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          onClick={() => {
            const el = document.querySelector(step.target) as HTMLElement | null;
            el?.click();
          }}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes tour-ring {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 2px rgba(59,130,246,0.5), 0 0 24px 4px rgba(59,130,246,0.18); }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.55), 0 0 0 3px rgba(59,130,246,0.7), 0 0 32px 8px rgba(59,130,246,0.25); }
        }
      `}} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[202] max-w-[calc(100vw-2rem)] sm:w-80 transition-all duration-300"
        style={{
          ...tooltipStyle,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'none' : 'translateY(8px)',
        }}
        dir={dir}
      >
        <div className="relative bg-slate-900 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] border border-slate-700 p-5">
          {/* Accent line */}
          <div className="absolute top-0 right-0 left-0 h-[3px] rounded-t-2xl bg-teal-400" />

          {/* Step counter + skip */}
          <div className="flex items-center justify-between mb-3 mt-1">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-bold flex items-center justify-center">
                {currentStep + 1}
              </span>
              <span className="text-xs text-slate-400">
                {locale === 'ar' ? `من ${total}` : locale === 'en' ? `of ${total}` : `sur ${total}`}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleComplete(); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {locale === 'ar' ? 'تخطي الجولة' : locale === 'en' ? 'Skip tour' : 'Passer la visite'}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-700 rounded-full mb-4">
            <div
              className="h-1 rounded-full transition-all duration-500 bg-teal-400"
              style={{ width: `${((currentStep + 1) / total) * 100}%` }}
            />
          </div>

          <h3 className="text-[15px] font-bold text-white mb-2">{step.title}</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">{step.desc}</p>

          {/* Nav */}
          <div className="flex items-center justify-between gap-2">
            {currentStep > 0 ? (
              <button
                onClick={(e) => { e.stopPropagation(); handleBack(); }}
                className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-800 transition-colors"
              >
                {locale === 'ar' ? 'السابق' : locale === 'en' ? 'Previous' : 'Précédent'}
              </button>
            ) : (
              <div />
            )}
            {step.requireClick ? (
              <span className="px-4 py-1.5 text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-pulse">
                {locale === 'ar' ? 'اضغط على العنصر' : locale === 'en' ? 'Click the element' : 'Cliquez sur l\'élément'}
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="px-4 py-1.5 text-sm font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-colors"
              >
                {currentStep < total - 1
                  ? (locale === 'ar' ? 'التالي' : locale === 'en' ? 'Next' : 'Suivant')
                  : (locale === 'ar' ? 'تم' : locale === 'en' ? 'Done' : 'Terminé')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

function calcBestPosition(rect: DOMRect, tw: number, th: number, gap: number): 'top' | 'bottom' | 'left' | 'right' {
  const spaceBottom = window.innerHeight - rect.bottom - gap;
  const spaceTop = rect.top - gap;
  const spaceLeft = rect.left - gap;
  const spaceRight = window.innerWidth - rect.right - gap;

  // On narrow screens, only consider top/bottom (no room for left/right)
  const isNarrow = window.innerWidth < 640;

  // Prefer bottom, then top, then left, then right
  if (spaceBottom >= th) return 'bottom';
  if (spaceTop >= th) return 'top';
  if (!isNarrow && spaceLeft >= tw) return 'left';
  if (!isNarrow && spaceRight >= tw) return 'right';
  return 'bottom';
}
