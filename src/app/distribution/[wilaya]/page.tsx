import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WILAYAS, getWilaya } from '@/lib/wilayas';
import { SITE_URL } from '@/lib/site';
import MarketingShell from '@/components/MarketingShell';
import WilayaContent from './WilayaContent';

type Params = Promise<{ wilaya: string }>;

export function generateStaticParams() {
  return WILAYAS.map((w) => ({ wilaya: w.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { wilaya } = await params;
  const w = getWilaya(wilaya);
  if (!w) return { title: 'Wilaya introuvable', robots: { index: false, follow: false } };

  const titleFr = `Logiciel de gestion & distribution à ${w.name.fr} (${w.code})`;
  const desc = `${w.pitch.fr} TrackSera est le logiciel algérien tout-en-un pour distributeurs, grossistes et magasins à ${w.name.fr}. Caisse POS, gestion stock multi-dépôts, livraisons GPS, CashVan et facturation conforme.`;

  return {
    title: titleFr,
    description: desc,
    keywords: [
      `logiciel gestion ${w.name.fr.toLowerCase()}`,
      `logiciel distribution ${w.name.fr.toLowerCase()}`,
      `logiciel caisse ${w.name.fr.toLowerCase()}`,
      `logiciel facturation ${w.name.fr.toLowerCase()}`,
      `logiciel commerce ${w.name.fr.toLowerCase()}`,
      `logiciel point de vente ${w.name.fr.toLowerCase()}`,
      `programme gestion stock ${w.name.fr.toLowerCase()}`,
      `application gestion magasin ${w.name.fr.toLowerCase()}`,
      `gestion stock ${w.name.fr.toLowerCase()}`,
      `POS ${w.name.fr.toLowerCase()}`,
      `cashvan ${w.name.fr.toLowerCase()}`,
      `برنامج إدارة ${w.name.ar}`,
      `برنامج توزيع ${w.name.ar}`,
      `برنامج كاشير ${w.name.ar}`,
      `برنامج فاتورة ${w.name.ar}`,
      `برنامج مخزون ${w.name.ar}`,
      `برنامج محل ${w.name.ar}`,
      `تطبيق إدارة محل ${w.name.ar}`,
      `برنامج نقطة البيع ${w.name.ar}`,
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
        serviceType: 'Logiciel de gestion commerciale et distribution',
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
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <WilayaContent w={w} related={related} />
    </MarketingShell>
  );
}
