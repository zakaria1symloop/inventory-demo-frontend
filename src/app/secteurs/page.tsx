import type { Metadata } from 'next';
import Link from 'next/link';
import { SECTORS } from '@/lib/sectors';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Logiciel par secteur d\'activité | TrackSera Algérie',
  description:
    'TrackSera couvre tous les secteurs de la distribution en Algérie : agroalimentaire, boissons, pharmacie, BTP, cosmétiques, textile et plus. Découvrez la solution adaptée à votre métier.',
  keywords: [
    'logiciel par secteur algerie',
    'gestion par metier',
    'برنامج حسب القطاع',
  ],
  alternates: { canonical: '/secteurs' },
};

export default function SectorsIndexPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Secteurs d\'activité couverts par TrackSera',
    url: `${SITE_URL}/secteurs`,
    inLanguage: ['fr-DZ', 'ar-DZ'],
    hasPart: SECTORS.map((s) => ({
      '@type': 'WebPage',
      name: `Logiciel ${s.name.fr}`,
      url: `${SITE_URL}/secteurs/${s.slug}`,
    })),
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="text-sm text-violet-200 mb-4">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Secteurs</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Une solution adaptée à chaque secteur
          </h1>
          <p className="text-2xl text-violet-100 mb-2" dir="rtl" lang="ar">
            حل مخصص لكل قطاع
          </p>
          <p className="text-lg text-violet-100/90 max-w-3xl mt-6">
            TrackSera couvre tous les métiers de la distribution et du commerce en Algérie. Choisissez votre secteur
            pour découvrir les fonctionnalités spécifiques qui vous concernent.
          </p>
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
              <h2 className="font-bold text-xl text-gray-900 group-hover:text-violet-700 mb-1">{s.name.fr}</h2>
              <p className="text-sm text-gray-500 mb-3" dir="rtl" lang="ar">{s.name.ar}</p>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{s.pitch.fr}</p>
              <div className="mt-4 text-violet-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Découvrir
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
