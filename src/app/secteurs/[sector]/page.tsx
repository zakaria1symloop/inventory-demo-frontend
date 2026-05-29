import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SECTORS, getSector } from '@/lib/sectors';
import { SITE_URL } from '@/lib/site';
import MarketingShell from '@/components/MarketingShell';
import SectorContent from './SectorContent';

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

  // French FAQ for structured data (the visible FAQ is localized in SectorContent).
  const faqs = [
    { q: `TrackSera convient-il à la distribution ${s.name.fr} en Algérie ?`, a: `Oui. TrackSera est conçu pour les distributeurs, grossistes et demi-grossistes du secteur ${s.name.fr}, avec prévente, vente directe (CashVan), tournées, suivi GPS, stock multi-dépôts et facturation conforme — dans les 58 wilayas.` },
    { q: `Gère-t-il la vente mobile (CashVan) pour le secteur ${s.name.fr} ?`, a: `Oui. Vos vendeurs ${s.name.fr} vendent et encaissent directement depuis le camion avec stock embarqué, même hors-ligne.` },
    { q: `Puis-je suivre mes livreurs et mes tournées ${s.name.fr} ?`, a: `Oui. TrackSera planifie les tournées par zone et suit les livreurs en direct par GPS, avec preuve de livraison.` },
    { q: `La facturation est-elle conforme à la réglementation algérienne ?`, a: `Oui : TVA, timbre fiscal et mentions obligatoires, avec export PDF professionnel.` },
    { q: `TrackSera fonctionne-t-il sans connexion Internet ?`, a: `Oui. Les applications vendeur, livreur et CashVan fonctionnent hors-ligne et se synchronisent automatiquement dès que la connexion revient.` },
    { q: `Combien coûte TrackSera pour le secteur ${s.name.fr} ?`, a: `Une offre gratuite pour démarrer, la formule Starter à 4 500 DZD/mois, et la formule Business sans limite sur devis.` },
  ];

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
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectorContent s={s} others={otherSectors} />
    </MarketingShell>
  );
}
