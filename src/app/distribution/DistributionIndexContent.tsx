'use client';

import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { WILAYAS } from '@/lib/wilayas';

export default function DistributionIndexContent() {
  const { locale } = useLocale();
  const dataLoc = locale === 'ar' ? 'ar' : 'fr';

  const tt = {
    fr: {
      home: 'Accueil', crumb: 'Distribution par wilaya',
      h1: "TrackSera dans les 58 wilayas d'Algérie",
      sub: 'Une plateforme unique de gestion, caisse POS et distribution — adaptée aux entreprises de chaque wilaya, du Nord côtier aux oasis du Sud.',
      count: (n: number) => `${n} wilaya${n > 1 ? 's' : ''}`,
    },
    ar: {
      home: 'الرئيسية', crumb: 'التوزيع حسب الولاية',
      h1: 'تراكسيرا في 58 ولاية في الجزائر',
      sub: 'منصّة واحدة للإدارة ونقطة البيع والتوزيع — مناسبة لشركات كل ولاية، من شمال الساحل إلى واحات الجنوب.',
      count: (n: number) => `${n} ولاية`,
    },
    en: {
      home: 'Home', crumb: 'Distribution by wilaya',
      h1: 'TrackSera across all 58 wilayas of Algeria',
      sub: 'One platform for management, POS and distribution — tailored to the businesses of every wilaya, from the northern coast to the southern oases.',
      count: (n: number) => `${n} wilaya${n > 1 ? 's' : ''}`,
    },
  }[locale];

  const byRegion: Record<string, typeof WILAYAS> = {};
  WILAYAS.forEach((w) => {
    const key = w.region[dataLoc];
    if (!byRegion[key]) byRegion[key] = [];
    byRegion[key].push(w);
  });

  return (
    <main className="bg-white">
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="text-sm text-blue-200 mb-4">
            <Link href="/" className="hover:text-white">{tt.home}</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{tt.crumb}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{tt.h1}</h1>
          <p className="text-lg text-blue-100/90 max-w-3xl mt-4">{tt.sub}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {Object.entries(byRegion).map(([region, wilayas]) => (
          <div key={region}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{region}</h2>
            <p className="text-sm text-gray-500 mb-5">{tt.count(wilayas.length)}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {wilayas.sort((a, b) => a.code - b.code).map((w) => (
                <Link
                  key={w.slug}
                  href={`/distribution/${w.slug}`}
                  className="group p-4 rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 font-mono">#{w.code}</div>
                      <div className="font-bold text-gray-900 group-hover:text-blue-700">{w.name[dataLoc]}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
