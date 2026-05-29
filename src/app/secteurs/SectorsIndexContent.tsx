'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { SECTORS } from '@/lib/sectors';

export default function SectorsIndexContent() {
  const { locale } = useLocale();
  const dataLoc = locale === 'ar' ? 'ar' : 'fr';
  const tt = {
    fr: { home: 'Accueil', sectors: 'Secteurs', h1: 'Une solution adaptée à chaque secteur', sub: 'TrackSera couvre tous les métiers de la distribution et du commerce en Algérie. Choisissez votre secteur pour découvrir les fonctionnalités qui vous concernent.', discover: 'Découvrir' },
    ar: { home: 'الرئيسية', sectors: 'القطاعات', h1: 'حل مخصّص لكل قطاع', sub: 'يغطّي تراكسيرا كل مهن التوزيع والتجارة في الجزائر. اختر قطاعك لاكتشاف الميزات الخاصة بنشاطك.', discover: 'اكتشف' },
    en: { home: 'Home', sectors: 'Sectors', h1: 'A solution tailored to every sector', sub: 'TrackSera covers every distribution and retail trade in Algeria. Pick your sector to discover the features that matter to you.', discover: 'Discover' },
  }[locale];

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="text-sm text-violet-200 mb-4">
            <Link href="/" className="hover:text-white">{tt.home}</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{tt.sectors}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{tt.h1}</h1>
          <p className="text-lg text-violet-100/90 max-w-3xl mt-4">{tt.sub}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTORS.map((s) => (
            <Link
              key={s.slug}
              href={`/secteurs/${s.slug}`}
              className="group p-6 rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all"
            >
              <div className="text-4xl mb-3">{s.emoji}</div>
              <h2 className="font-bold text-xl text-gray-900 group-hover:text-violet-700 mb-2">{s.name[dataLoc]}</h2>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{s.pitch[dataLoc]}</p>
              <div className="mt-4 text-violet-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                {tt.discover}
                <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
