import type { Metadata } from 'next';
import { SECTORS } from '@/lib/sectors';
import { SITE_URL } from '@/lib/site';
import MarketingShell from '@/components/MarketingShell';
import SectorsIndexContent from './SectorsIndexContent';

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
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SectorsIndexContent />
    </MarketingShell>
  );
}
