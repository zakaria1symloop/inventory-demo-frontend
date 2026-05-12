'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useLocale } from '@/lib/i18n/context';
import SiteFooter from '@/components/SiteFooter';
import { faqData, faqCategories, type FaqCategory } from './faq-data';

const UI = {
  ar: {
    badge: 'الأسئلة الشائعة',
    title: 'كل ما تحتاج معرفته حول TrackSera',
    subtitle:
      'إجابات واضحة على الأسئلة الأكثر تكراراً من طرف الموزعين والتجار وأصحاب الشركات في الجزائر.',
    all: 'كل الأسئلة',
    search: 'ابحث في الأسئلة...',
    empty: 'لا توجد نتائج. جرّب كلمة أخرى أو تواصل معنا.',
    stillQuestionsTitle: 'لا تزال لديك أسئلة؟',
    stillQuestionsSub:
      'فريقنا متاح للإجابة على كل أسئلتك حول TrackSera — عبر الواتساب، الهاتف، أو البريد الإلكتروني.',
    contactBtn: 'تواصل معنا',
    tryBtn: 'ابدأ التجربة المجانية',
    backHome: 'العودة للرئيسية',
  },
  fr: {
    badge: 'FAQ',
    title: 'Tout ce que vous voulez savoir sur TrackSera',
    subtitle:
      'Des réponses claires aux questions les plus fréquentes des distributeurs, commerçants et entrepreneurs algériens.',
    all: 'Toutes les questions',
    search: 'Rechercher dans les questions...',
    empty: 'Aucun résultat. Essayez un autre mot ou contactez-nous.',
    stillQuestionsTitle: "Vous avez encore des questions ?",
    stillQuestionsSub:
      'Notre équipe est disponible pour répondre à toutes vos questions sur TrackSera — via WhatsApp, téléphone ou email.',
    contactBtn: 'Nous contacter',
    tryBtn: "Démarrer l'essai gratuit",
    backHome: "Retour à l'accueil",
  },
  en: {
    badge: 'FAQ',
    title: 'Everything you need to know about TrackSera',
    subtitle:
      'Clear answers to the most common questions from retailers, wholesalers, and distributors.',
    all: 'All questions',
    search: 'Search questions...',
    empty: 'No results. Try different keywords or contact us.',
    stillQuestionsTitle: 'Still have questions?',
    stillQuestionsSub:
      'Our team is available to answer all your questions about TrackSera — via WhatsApp, phone, or email.',
    contactBtn: 'Contact us',
    tryBtn: 'Start free trial',
    backHome: 'Back to home',
  },
};

export default function FaqClient() {
  const { locale } = useLocale();
  const ui = UI[locale];
  const [selectedCat, setSelectedCat] = useState<FaqCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqData.filter((item) => {
      if (selectedCat !== 'all' && item.category !== selectedCat) return false;
      if (!q) return true;
      const hay = (item.q[locale] + ' ' + item.a[locale]).toLowerCase();
      return hay.includes(q);
    });
  }, [selectedCat, query, locale]);

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <Link href="/" className="flex items-center gap-2">
              <img src="/t.png" alt="TrackSera" className="w-7 h-7" />
              <span className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">TrackSera</span>
            </Link>
            <div className="hidden md:flex items-center gap-7 text-[13px] text-gray-600">
              <Link href="/#modules" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الوحدات' : locale === 'en' ? 'Modules' : 'Modules'}
              </Link>
              <Link href="/tarifs" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الأسعار' : locale === 'en' ? 'Pricing' : 'Tarifs'}
              </Link>
              <Link href="/faq" className="text-gray-900 font-medium">
                {locale === 'ar' ? 'الأسئلة' : locale === 'en' ? 'FAQ' : 'FAQ'}
              </Link>
              <Link href="/blog" className="hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'المدونة' : locale === 'en' ? 'Blog' : 'Blog'}
              </Link>
            </div>
            <Link
              href="/register"
              className="text-[13px] font-medium px-3.5 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              {locale === 'ar' ? 'ابدأ مجاناً' : locale === 'en' ? 'Start free' : 'Essai gratuit'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-gray-100">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #000 0 1px, transparent 1px 18px), repeating-linear-gradient(-45deg, #000 0 1px, transparent 1px 18px)',
          }}
        />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 py-20 sm:py-24 text-center">
          <p className="text-[13px] font-semibold text-blue-600 tracking-wide mb-3">{ui.badge}</p>
          <h1 className="text-[32px] sm:text-[46px] font-bold tracking-[-0.025em] text-gray-900 max-w-[760px] mx-auto leading-[1.1]">
            {ui.title}
          </h1>
          <p className="mt-5 text-[16px] text-gray-500 max-w-[620px] mx-auto leading-relaxed">{ui.subtitle}</p>

          {/* Search */}
          <div className="mt-10 max-w-[560px] mx-auto relative">
            <svg
              className={`w-5 h-5 text-gray-400 absolute top-1/2 -translate-y-1/2 ${locale === 'ar' ? 'right-4' : 'left-4'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={ui.search}
              className={`w-full bg-white border border-gray-200 rounded-xl py-3.5 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all ${
                locale === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'
              }`}
            />
          </div>
        </div>
      </section>

      {/* ── Category filter ── */}
      <section className="py-8 border-b border-gray-100 bg-gray-50/40 sticky top-[60px] z-40 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-4 py-2 text-[13px] font-medium rounded-full transition-colors ${
                selectedCat === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {ui.all}
            </button>
            {(Object.keys(faqCategories) as FaqCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 text-[13px] font-medium rounded-full transition-colors ${
                  selectedCat === cat
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {faqCategories[cat][locale]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Questions list ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[820px] mx-auto px-5 sm:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[15px] text-gray-500">{ui.empty}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border-y border-gray-100">
              {filtered.map((item, i) => {
                const key = `${item.category}-${i}-${item.q[locale].slice(0, 10)}`;
                const open = openIdx === key;
                return (
                  <div key={key}>
                    <button
                      onClick={() => setOpenIdx(open ? null : key)}
                      className={`w-full flex items-center justify-between py-5 ${
                        locale === 'ar' ? 'text-right' : 'text-left'
                      } group`}
                    >
                      <span className="text-[15px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors pr-4 leading-snug">
                        {item.q[locale]}
                      </span>
                      <svg
                        className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {open && (
                      <div
                        className="pb-6 text-[14px] text-gray-600 leading-relaxed whitespace-pre-line"
                        dangerouslySetInnerHTML={{ __html: item.a[locale] }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Still have questions CTA ── */}
      <section className="py-16 sm:py-20 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="relative rounded-2xl bg-gray-900 text-white p-10 sm:p-14 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 16px), repeating-linear-gradient(-45deg, #fff 0 1px, transparent 1px 16px)',
              }}
            />
            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-[620px]">
                <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] mb-3">
                  {ui.stillQuestionsTitle}
                </h2>
                <p className="text-[15px] text-gray-300 leading-relaxed">{ui.stillQuestionsSub}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/#contact"
                  className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-5 py-3 rounded-lg text-[14px] font-medium hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  {ui.contactBtn}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-white/20 px-5 py-3 rounded-lg text-[14px] font-medium hover:bg-white/5 transition-colors whitespace-nowrap"
                >
                  {ui.tryBtn}
                </Link>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 rtl:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {ui.backHome}
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter lang={locale} />
    </div>
  );
}
