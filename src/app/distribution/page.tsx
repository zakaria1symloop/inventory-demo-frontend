import type { Metadata } from 'next';
import { WILAYAS } from '@/lib/wilayas';
import { SITE_URL } from '@/lib/site';
import MarketingShell from '@/components/MarketingShell';
import DistributionIndexContent from './DistributionIndexContent';

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
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DistributionIndexContent />
    </MarketingShell>
  );
}
