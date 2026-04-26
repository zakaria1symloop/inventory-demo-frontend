import type { Metadata } from 'next';
import Link from 'next/link';
import { WILAYAS } from '@/lib/wilayas';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Logiciel de distribution dans les 58 wilayas d\'Algérie | TrackSera',
  description:
    'TrackSera est utilisé par les distributeurs, grossistes et magasins dans les 58 wilayas d\'Algérie. Découvrez la solution adaptée à votre wilaya : caisse POS, stock, livraisons, CashVan et facturation conforme.',
  keywords: [
    'logiciel distribution algerie',
    'logiciel gestion algerie wilayas',
    'برنامج توزيع الجزائر',
    'برنامج إدارة توزيع جميع الولايات',
  ],
  alternates: {
    canonical: '/distribution',
    languages: { 'ar-DZ': '/distribution', 'fr-DZ': '/distribution', 'x-default': '/distribution' },
  },
  openGraph: {
    title: 'TrackSera dans les 58 wilayas d\'Algérie',
    description: 'Une solution unique pour les distributeurs et magasins de toute l\'Algérie.',
    url: `${SITE_URL}/distribution`,
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ'],
    type: 'website',
  },
};

export default function DistributionIndexPage() {
  // Group by region
  const byRegion: Record<string, typeof WILAYAS> = {};
  WILAYAS.forEach((w) => {
    if (!byRegion[w.region.fr]) byRegion[w.region.fr] = [];
    byRegion[w.region.fr].push(w);
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/distribution#page`,
        url: `${SITE_URL}/distribution`,
        name: 'TrackSera dans les 58 wilayas d\'Algérie',
        description: 'Solution de gestion et distribution pour toutes les wilayas algériennes.',
        inLanguage: ['fr-DZ', 'ar-DZ'],
        isPartOf: { '@id': `${SITE_URL}/#website` },
        hasPart: WILAYAS.map((w) => ({
          '@type': 'WebPage',
          name: `Distribution à ${w.name.fr}`,
          url: `${SITE_URL}/distribution/${w.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Distribution par wilaya', item: `${SITE_URL}/distribution` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="text-sm text-blue-200 mb-4">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Distribution par wilaya</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            TrackSera dans les 58 wilayas d&apos;Algérie
          </h1>
          <p className="text-2xl text-blue-100 mb-2" dir="rtl" lang="ar">
            تراكسيرا في 58 ولاية في الجزائر
          </p>
          <p className="text-lg text-blue-100/90 max-w-3xl mt-6">
            Une plateforme unique de gestion, caisse POS et distribution — adaptée aux entreprises de chaque wilaya,
            du Nord côtier aux oasis du Sud.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {Object.entries(byRegion).map(([region, wilayas]) => (
          <div key={region}>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{region}</h2>
            <p className="text-sm text-gray-500 mb-5">{wilayas.length} wilaya{wilayas.length > 1 ? 's' : ''}</p>
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
                      <div className="font-bold text-gray-900 group-hover:text-blue-700">{w.name.fr}</div>
                      <div className="text-sm text-gray-500" dir="rtl" lang="ar">{w.name.ar}</div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
