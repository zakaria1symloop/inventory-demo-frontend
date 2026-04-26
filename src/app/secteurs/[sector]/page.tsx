import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SECTORS, getSector } from '@/lib/sectors';
import { SITE_URL } from '@/lib/site';

type Params = Promise<{ sector: string }>;

export function generateStaticParams() {
  return SECTORS.map((s) => ({ sector: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { sector } = await params;
  const s = getSector(sector);
  if (!s) return { title: 'Secteur introuvable', robots: { index: false, follow: false } };

  const title = `Logiciel de gestion ${s.name.fr} en Algérie | TrackSera`;
  const desc = `${s.pitch.fr} TrackSera est la plateforme tout-en-un pour les distributeurs et grossistes du secteur ${s.name.fr}.`;

  return {
    title,
    description: desc,
    keywords: s.keywords,
    alternates: {
      canonical: `/secteurs/${s.slug}`,
      languages: { 'ar-DZ': `/secteurs/${s.slug}`, 'fr-DZ': `/secteurs/${s.slug}`, 'x-default': `/secteurs/${s.slug}` },
    },
    openGraph: {
      title,
      description: desc,
      url: `${SITE_URL}/secteurs/${s.slug}`,
      siteName: 'TrackSera',
      locale: 'fr_DZ',
      alternateLocale: ['ar_DZ'],
      type: 'website',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(s.name.fr)}&subtitle=${encodeURIComponent(s.pitch.fr.slice(0, 120))}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function SectorPage({ params }: { params: Params }) {
  const { sector } = await params;
  const s = getSector(sector);
  if (!s) notFound();

  const canonical = `${SITE_URL}/secteurs/${s.slug}`;
  const otherSectors = SECTORS.filter((x) => x.slug !== s.slug).slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${canonical}#service`,
        name: `Logiciel TrackSera pour ${s.name.fr}`,
        serviceType: `Logiciel de gestion ${s.name.fr}`,
        provider: { '@id': `${SITE_URL}/#organization` },
        description: s.pitch.fr,
        areaServed: { '@type': 'Country', name: 'Algeria' },
        offers: { '@type': 'Offer', priceCurrency: 'DZD', price: '0', availability: 'https://schema.org/InStock' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Secteurs', item: `${SITE_URL}/secteurs` },
          { '@type': 'ListItem', position: 3, name: s.name.fr, item: canonical },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="text-sm text-violet-200 mb-4">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <span className="mx-2">›</span>
            <Link href="/secteurs" className="hover:text-white">Secteurs</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{s.name.fr}</span>
          </nav>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{s.emoji}</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                Logiciel de gestion <span className="text-violet-200">{s.name.fr}</span>
              </h1>
              <p className="text-2xl text-violet-100 font-medium mt-2" dir="rtl" lang="ar">
                برنامج إدارة {s.name.ar}
              </p>
            </div>
          </div>
          <p className="text-lg text-violet-100/90 max-w-3xl leading-relaxed mt-6">{s.pitch.fr}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register" className="px-6 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors">
              Essai gratuit 14 jours
            </Link>
            <Link href="/tarifs" className="px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
          Fonctionnalités clés pour {s.name.fr}
        </h2>
        <p className="text-gray-600 mb-10 max-w-3xl">
          TrackSera propose des fonctionnalités spécialement adaptées au secteur <strong>{s.name.fr}</strong> en Algérie,
          sans configuration complexe.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.features.map((f) => (
            <div key={f} className="p-6 rounded-2xl border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900">{f}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Other sectors */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Autres secteurs servis</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {otherSectors.map((o) => (
              <Link
                key={o.slug}
                href={`/secteurs/${o.slug}`}
                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-md transition-all text-center"
              >
                <div className="text-3xl mb-1">{o.emoji}</div>
                <div className="font-semibold text-gray-800 text-sm">{o.name.fr}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Prêt à digitaliser votre activité {s.name.fr} ?
          </h2>
          <p className="text-violet-100 mb-8 text-lg">
            Essayez TrackSera gratuitement pendant 14 jours. Aucune carte bancaire requise.
          </p>
          <Link href="/register" className="inline-block px-8 py-4 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors">
            Créer un compte gratuit
          </Link>
        </div>
      </section>
    </main>
  );
}
