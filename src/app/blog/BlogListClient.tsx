'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useLocale } from '@/lib/i18n/context';
import { blogPosts, categoryLabels, type BlogCategory } from '@/lib/blog-data';

const UI = {
  ar: {
    badge: 'المدونة',
    title: 'رؤى عملية لموزعي الجزائر',
    subtitle: 'أدلة، تحديثات منتج، وأخبار قطاع التوزيع. كل ما تحتاج معرفته لإدارة عملياتك بذكاء.',
    all: 'الكل',
    readMore: 'اقرأ المقال',
    minRead: 'دقيقة قراءة',
    empty: 'لا توجد مقالات في هذه الفئة بعد.',
    backHome: 'العودة للرئيسية',
  },
  fr: {
    badge: 'Blog',
    title: 'Des insights concrets pour les distributeurs algériens',
    subtitle: 'Guides, mises à jour produit, et actualités du secteur. Tout ce qu\'il faut savoir pour piloter vos opérations intelligemment.',
    all: 'Tous',
    readMore: 'Lire l\'article',
    minRead: 'min de lecture',
    empty: 'Aucun article dans cette catégorie pour le moment.',
    backHome: 'Retour à l\'accueil',
  },
};

export default function BlogListClient() {
  const { locale, setLocale } = useLocale();
  const ui = UI[locale];
  const [selectedCat, setSelectedCat] = useState<BlogCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const list = selectedCat === 'all' ? blogPosts : blogPosts.filter((p) => p.category === selectedCat);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedCat]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

            <div className="hidden md:flex items-center gap-7">
              <Link href="/#how-it-works" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'كيف يعمل' : 'Comment ça marche'}
              </Link>
              <Link href="/#modules" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الوحدات' : 'Modules'}
              </Link>
              <Link href="/#pricing" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الأسعار' : 'Tarifs'}
              </Link>
              <Link href="/blog" className="text-[13px] text-gray-900 font-semibold">
                {locale === 'ar' ? 'المدونة' : 'Blog'}
              </Link>
              <Link href="/#contact" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'تواصل معنا' : 'Contact'}
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                <button
                  onClick={() => setLocale('ar')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    locale === 'ar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  عربي
                </button>
                <button
                  onClick={() => setLocale('fr')}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    locale === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  FR
                </button>
              </div>
              <Link href="/login" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الدخول' : 'Connexion'}
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors"
              >
                {locale === 'ar' ? 'ابدأ مجاناً' : 'Commencer'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Header ── */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-blue-100/40 via-indigo-100/30 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 bg-gray-100 rounded-full text-[11px] font-semibold uppercase tracking-wider text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            {ui.badge}
          </div>
          <h1 className="text-[38px] sm:text-[52px] font-bold text-gray-900 tracking-[-0.03em] leading-[1.05]">
            {ui.title}
          </h1>
          <p className="mt-5 max-w-[600px] mx-auto text-[16px] text-gray-500 leading-relaxed">
            {ui.subtitle}
          </p>
        </div>
      </section>

      {/* ── Category filter ── */}
      <section className="pb-10">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {(['all', 'guides', 'product', 'industry'] as const).map((cat) => {
              const label = cat === 'all' ? ui.all : categoryLabels[cat][locale];
              const isActive = selectedCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-4 py-2 text-[13px] font-medium rounded-full transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Posts grid ── */}
      <section className="pb-24">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16">{ui.empty}</p>
          ) : (
            <div className="max-w-[760px] mx-auto divide-y divide-gray-100">
              {filtered.map((post, idx) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block py-8 first:pt-0 transition-colors"
                  style={{ animation: `fadeUp 0.6s ${idx * 0.08}s both` }}
                >
                  <div className="flex items-center gap-3 mb-3 text-[11px] font-semibold uppercase tracking-wider">
                    <span className="text-blue-600">{categoryLabels[post.category][locale]}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400">{formatDate(post.date)}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-gray-400">{post.readTime} {ui.minRead}</span>
                  </div>
                  <h3 className="text-[22px] sm:text-[24px] font-bold text-gray-900 leading-snug tracking-[-0.02em] group-hover:text-blue-600 transition-colors">
                    {post.title[locale]}
                  </h3>
                  <p className="mt-3 text-[15px] text-gray-500 leading-relaxed line-clamp-2">
                    {post.excerpt[locale]}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {ui.readMore}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/t.png" alt="TrackSera" className="w-6 h-6" />
            <span className="text-[13px] font-semibold text-gray-900">TrackSera</span>
            <span className="text-[12px] text-gray-400">© {new Date().getFullYear()}</span>
          </div>
          <Link href="/" className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
            ← {ui.backHome}
          </Link>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
