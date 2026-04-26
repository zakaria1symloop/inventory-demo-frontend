import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WILAYAS, getWilaya } from '@/lib/wilayas';
import { SITE_URL } from '@/lib/site';

type Params = Promise<{ wilaya: string }>;

export function generateStaticParams() {
  return WILAYAS.map((w) => ({ wilaya: w.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { wilaya } = await params;
  const w = getWilaya(wilaya);
  if (!w) return { title: 'Wilaya introuvable', robots: { index: false, follow: false } };

  const titleFr = `Logiciel de gestion & distribution à ${w.name.fr} (${w.code}) — TrackSera`;
  const titleAr = `برنامج إدارة وتوزيع في ${w.name.ar} — تراكسيرا`;
  const desc = `${w.pitch.fr} TrackSera est la plateforme SaaS algérienne tout-en-un pour distributeurs, grossistes et magasins à ${w.name.fr}. Caisse POS, stock multi-dépôts, livraisons GPS, CashVan et facturation conforme.`;

  return {
    title: `${titleFr} | ${titleAr}`,
    description: desc,
    keywords: [
      `logiciel gestion ${w.name.fr.toLowerCase()}`,
      `logiciel distribution ${w.name.fr.toLowerCase()}`,
      `logiciel caisse ${w.name.fr.toLowerCase()}`,
      `برنامج إدارة ${w.name.ar}`,
      `برنامج توزيع ${w.name.ar}`,
      `برنامج كاشير ${w.name.ar}`,
      `gestion stock ${w.name.fr.toLowerCase()}`,
      `POS ${w.name.fr.toLowerCase()}`,
      `cashvan ${w.name.fr.toLowerCase()}`,
    ],
    alternates: {
      canonical: `/distribution/${w.slug}`,
      languages: {
        'ar-DZ': `/distribution/${w.slug}`,
        'fr-DZ': `/distribution/${w.slug}`,
        'x-default': `/distribution/${w.slug}`,
      },
    },
    openGraph: {
      title: titleFr,
      description: desc,
      url: `${SITE_URL}/distribution/${w.slug}`,
      siteName: 'TrackSera',
      locale: 'fr_DZ',
      alternateLocale: ['ar_DZ'],
      type: 'website',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(titleFr)}&subtitle=${encodeURIComponent(w.pitch.fr.slice(0, 120))}`,
          width: 1200,
          height: 630,
          alt: titleFr,
        },
      ],
    },
  };
}

export default async function WilayaPage({ params }: { params: Params }) {
  const { wilaya } = await params;
  const w = getWilaya(wilaya);
  if (!w) notFound();

  const canonical = `${SITE_URL}/distribution/${w.slug}`;

  // Related wilayas in the same region (max 6)
  const related = WILAYAS.filter((x) => x.region.fr === w.region.fr && x.slug !== w.slug).slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: `Logiciel de gestion & distribution à ${w.name.fr}`,
        description: w.pitch.fr,
        inLanguage: ['fr-DZ', 'ar-DZ'],
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: {
          '@type': 'Place',
          name: w.name.fr,
          alternateName: w.name.ar,
          address: { '@type': 'PostalAddress', addressLocality: w.name.fr, addressRegion: w.region.fr, addressCountry: 'DZ' },
          geo: { '@type': 'GeoCoordinates', latitude: w.lat, longitude: w.lng },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Distribution par wilaya', item: `${SITE_URL}/distribution` },
          { '@type': 'ListItem', position: 3, name: w.name.fr, item: canonical },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${canonical}#service`,
        serviceType: 'Logiciel de gestion et distribution SaaS',
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: {
          '@type': 'Place',
          name: w.name.fr,
          alternateName: w.name.ar,
          containedInPlace: { '@type': 'Country', name: 'Algeria' },
        },
        description: `${w.pitch.fr} TrackSera fournit aux distributeurs et magasins de ${w.name.fr} une plateforme tout-en-un.`,
        offers: { '@type': 'Offer', priceCurrency: 'DZD', price: '0', availability: 'https://schema.org/InStock' },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white">Accueil</Link>
            <span>›</span>
            <Link href="/distribution" className="hover:text-white">Distribution</Link>
            <span>›</span>
            <span className="text-white">{w.name.fr}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Logiciel de gestion & distribution à <span className="text-blue-200">{w.name.fr}</span> ({w.code})
          </h1>
          <p className="text-2xl text-blue-100 font-medium mb-2" dir="rtl" lang="ar">
            برنامج إدارة وتوزيع في {w.name.ar}
          </p>
          <p className="text-lg text-blue-100/90 max-w-3xl leading-relaxed mt-6">{w.pitch.fr}</p>
          <p className="text-base text-blue-100/80 mt-4 max-w-3xl">
            <strong>TrackSera</strong> aide les distributeurs, grossistes, supérettes et magasins de la wilaya de{' '}
            <strong>{w.name.fr}</strong> ({w.region.fr}) à digitaliser leurs opérations : caisse POS, stock multi-dépôts,
            livraisons avec suivi GPS, vente mobile CashVan et facturation conforme à la législation algérienne.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/register" className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors">
              Essai gratuit 14 jours
            </Link>
            <Link href="/tarifs" className="px-6 py-3 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
              Voir les tarifs
            </Link>
          </div>
        </div>
      </section>

      {/* Why TrackSera in this wilaya */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
          Pourquoi les entreprises de {w.name.fr} choisissent TrackSera
        </h2>
        <p className="text-gray-600 mb-10 max-w-3xl">
          Une plateforme conçue pour les réalités du marché algérien : facturation conforme, support bilingue arabe/français,
          paiement en dinars (CCP, BaridiMob, virement) et applications mobiles fonctionnant <strong>hors ligne</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { t: 'Caisse POS rapide', d: `Encaissement instantané pour vos magasins à ${w.name.fr}, support du ticket 80 mm et imprimante Bluetooth.` },
            { t: 'Stock multi-dépôts', d: `Gérez plusieurs dépôts à ${w.name.fr} et dans toute la région ${w.region.fr} avec inventaire en temps réel.` },
            { t: 'Livraisons GPS', d: `Suivi en direct des livreurs sur la carte. Tournées optimisées dans ${w.name.fr} et alentours.` },
            { t: 'CashVan (vente mobile)', d: 'Le commercial vend depuis sa camionnette, hors ligne. Synchronisation automatique au retour.' },
            { t: 'Facturation conforme', d: 'TVA, timbre fiscal, RC, NIF, NIS, AI, RIB, mentions obligatoires — tout en un clic.' },
            { t: 'Tableau de bord temps réel', d: 'Ventes, marges, stocks et créances par magasin et par commercial — visibles 24/7.' },
          ].map((f) => (
            <div key={f.t} className="p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
              <h3 className="font-bold text-lg text-gray-900 mb-2">{f.t}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Secteurs servis à {w.name.fr}</h2>
          <p className="text-gray-600 mb-8 max-w-3xl">
            Distributeurs en gros · Grossistes alimentaires · Supérettes & magasins · Pharmacies · Cosmétiques ·
            Matériaux de construction · Produits d&apos;entretien · Quincaillerie · Boissons · Textile · Tabac & papeterie
          </p>
          <div className="flex flex-wrap gap-2">
            {['Alimentation', 'Boissons', 'Cosmétiques', 'Pharmacie', 'BTP', 'Quincaillerie', 'Textile', 'Bureautique'].map((s) => (
              <span key={s} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700">
                {s} {w.name.fr}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Related wilayas */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
            Autres wilayas de la région {w.region.fr}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/distribution/${r.slug}`}
                className="p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
              >
                <div className="text-xs text-gray-400">{r.code}</div>
                <div className="font-semibold text-gray-800 text-sm">{r.name.fr}</div>
                <div className="text-xs text-gray-500" dir="rtl" lang="ar">{r.name.ar}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Prêt à digitaliser votre distribution à {w.name.fr} ?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Essayez TrackSera gratuitement pendant 14 jours. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/register" className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors">
              Créer un compte gratuit
            </Link>
            <Link href="/blog" className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-bold rounded-xl hover:bg-white/20 transition-colors">
              Lire notre blog
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
