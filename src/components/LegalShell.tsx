'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from './SiteFooter';
import type { ReactNode } from 'react';

type LegalLocale = 'ar' | 'fr' | 'en';

interface LegalContent {
  badge: { ar: string; fr: string; en: string };
  title: { ar: string; fr: string; en: string };
  effectiveDate: { ar: string; fr: string; en: string };
  body: { ar: ReactNode; fr: ReactNode; en: ReactNode };
}

const NAV = {
  ar: { modules: 'الوحدات', pricing: 'الأسعار', faq: 'الأسئلة', blog: 'المدونة', cta: 'ابدأ مجاناً' },
  fr: { modules: 'Modules', pricing: 'Tarifs', faq: 'FAQ', blog: 'Blog', cta: 'Essai gratuit' },
  en: { modules: 'Modules', pricing: 'Pricing', faq: 'FAQ', blog: 'Blog', cta: 'Free trial' },
};

function detectInitialLocale(): LegalLocale {
  if (typeof window === 'undefined') return 'en';
  // 1. Explicit ?lang= query param wins
  const params = new URLSearchParams(window.location.search);
  const q = params.get('lang');
  if (q === 'ar' || q === 'fr' || q === 'en') return q;
  // 2. Persisted choice from previous visit on these legal pages
  const stored = window.localStorage.getItem('legal_lang');
  if (stored === 'ar' || stored === 'fr' || stored === 'en') return stored as LegalLocale;
  // 3. Default to English. Legal pages primarily serve international reviewers
  //    (Paddle KYC) and English-speaking visitors. Users can switch via the
  //    EN/FR/AR toggle at the top of the page if they prefer.
  return 'en';
}

export default function LegalShell({ content }: { content: LegalContent }) {
  // SSR renders EN; client mounts and may switch based on saved choice or query.
  const [L, setL] = useState<LegalLocale>('en');

  useEffect(() => {
    setL(detectInitialLocale());
  }, []);

  const choose = (next: LegalLocale) => {
    setL(next);
    if (typeof window !== 'undefined') window.localStorage.setItem('legal_lang', next);
  };

  const nav = NAV[L];
  const isRtl = L === 'ar';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <Link href="/" className="flex items-center gap-2">
              <img src="/t.png" alt="TrackSera" className="w-7 h-7" />
              <span className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">TrackSera</span>
            </Link>
            <div className="hidden md:flex items-center gap-7 text-[13px] text-gray-600">
              <Link href="/#modules" className="hover:text-gray-900 transition-colors">{nav.modules}</Link>
              <Link href="/tarifs" className="hover:text-gray-900 transition-colors">{nav.pricing}</Link>
              <Link href="/faq" className="hover:text-gray-900 transition-colors">{nav.faq}</Link>
              <Link href="/blog" className="hover:text-gray-900 transition-colors">{nav.blog}</Link>
            </div>
            <Link
              href="/register"
              className="text-[13px] font-medium px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              {nav.cta}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-gray-100">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
          {/* Language switcher (page-local) */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center bg-white border border-gray-200 rounded-full p-0.5 shadow-sm">
              {(['en', 'fr', 'ar'] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => choose(code)}
                  className={`px-3 py-1 text-[12px] font-semibold rounded-full transition ${
                    L === code ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
                  }`}
                  aria-pressed={L === code}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[12px] font-semibold text-blue-600 tracking-wide uppercase mb-3">
            {content.badge[L]}
          </p>
          <h1 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.025em] text-gray-900 leading-[1.1]">
            {content.title[L]}
          </h1>
          <p className="mt-4 text-[14px] text-gray-500">{content.effectiveDate[L]}</p>
        </div>
      </section>

      {/* Body */}
      <article className="max-w-[820px] mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="prose prose-gray max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-[22px] prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-[17px] prose-h3:mt-8 prose-h3:mb-2 prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-gray-700 prose-li:text-[15px] prose-li:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900">
          {content.body[L]}
        </div>
      </article>

      <SiteFooter lang={isRtl ? 'ar' : 'fr'} />
    </div>
  );
}
