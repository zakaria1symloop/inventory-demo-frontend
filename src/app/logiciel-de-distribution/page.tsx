import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import DistributionLanding from './DistributionLanding';

// ---------------------------------------------------------------------------
// Server wrapper: owns SEO metadata + structured data (FR, the head-term
// language). The visible, animated UI is the locale-aware client component
// <DistributionLanding /> (AR / FR / EN, switches with the language toggle).
// Targets the "logiciel de (gestion de la) distribution" keyword cluster.
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Logiciel de Gestion de la Distribution en Algérie | TrackSera',
  description:
    'TrackSera est le logiciel de gestion de la distribution n°1 en Algérie pour distributeurs et grossistes : prévente, vente directe (CashVan), gestion des tournées, suivi GPS des livreurs, recouvrement, stock multi-dépôts et facturation conforme. Essai gratuit.',
  keywords: [
    'logiciel de distribution',
    'logiciel de gestion de la distribution',
    'logiciel de gestion de distribution',
    'logiciel gestion distribution algerie',
    'logiciel de distribution algerie',
    'logiciel distribution',
    'application de distribution',
    'programme de distribution',
    'solution de distribution',
    'meilleur logiciel de distribution algerie',
    'logiciel pour distributeur',
    'logiciel pour societe de distribution',
    'logiciel pour distributeur agroalimentaire',
    'logiciel grossiste algerie',
    'logiciel demi-grossiste',
    'logiciel de gestion commerciale algerie',
    'logiciel distribution produits alimentaires',
    'logiciel distribution boissons',
    'logiciel distribution FMCG',
    'logiciel distribution pharmaceutique',
    'logiciel de vente en gros',
    'logiciel ERP distribution algerie',
    'logiciel de prevente',
    'logiciel pre-vente algerie',
    'logiciel vente directe',
    'logiciel cashvan',
    'logiciel cashvan algerie',
    'logiciel van sales algerie',
    'logiciel vente mobile',
    'logiciel de gestion des livreurs',
    'logiciel de gestion des tournees',
    'gestion des tournees',
    'logiciel de livraison algerie',
    'suivi GPS livreurs',
    'logiciel de recouvrement',
    'logiciel force de vente',
    'logiciel pour delegues commerciaux',
    'برنامج إدارة التوزيع',
    'برنامج توزيع',
    'برنامج توزيع الجزائر',
    'برنامج الجملة والتوزيع',
    'برنامج البيع المتنقل',
    'برنامج كاش فان',
    'برنامج إدارة المندوبين',
    'برنامج شركة توزيع',
    'افضل برنامج توزيع في الجزائر',
  ],
  alternates: {
    canonical: '/logiciel-de-distribution',
    languages: {
      'fr-DZ': '/logiciel-de-distribution',
      'ar-DZ': '/logiciel-de-distribution',
      'x-default': '/logiciel-de-distribution',
    },
  },
  openGraph: {
    title: 'Logiciel de Gestion de la Distribution en Algérie — TrackSera',
    description:
      'La plateforme tout-en-un pour les distributeurs et grossistes algériens : prévente, vente directe (CashVan), tournées, suivi GPS, recouvrement, stock et facturation conforme.',
    url: `${SITE_URL}/logiciel-de-distribution`,
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ'],
    type: 'website',
    images: [
      {
        url: '/api/og?title=Logiciel+de+Distribution&subtitle=Pr%C3%A9vente+%C2%B7+CashVan+%C2%B7+Tourn%C3%A9es+%C2%B7+Alg%C3%A9rie',
        width: 1200,
        height: 630,
        alt: 'TrackSera — Logiciel de gestion de la distribution en Algérie',
      },
    ],
  },
};

const FEATURE_NAMES = [
  'Prévente (pre-sales)',
  'Vente directe / CashVan',
  'Gestion des tournées',
  'Suivi GPS des livreurs',
  'Recouvrement et caisse',
  'Stock multi-dépôts',
  'Facturation conforme Algérie',
  'Mode hors-ligne',
  'Rapports temps réel',
];

const FAQS = [
  {
    q: 'Qu’est-ce qu’un logiciel de gestion de la distribution ?',
    a: 'Une plateforme qui pilote la prise de commande (prévente), la vente directe depuis le camion (CashVan), les tournées et livraisons, le stock multi-dépôts, le recouvrement et la facturation. TrackSera réunit tout cela dans une seule solution web + mobile adaptée à l’Algérie.',
  },
  {
    q: 'TrackSera fonctionne-t-il sans connexion Internet ?',
    a: 'Oui. Les applications vendeur, livreur et CashVan fonctionnent en mode hors-ligne et se synchronisent automatiquement dès que la connexion revient.',
  },
  {
    q: 'Gère-t-il à la fois la prévente et la vente directe (CashVan) ?',
    a: 'Oui. Vous pouvez travailler en prévente (commande livrée ensuite) et en vente directe / CashVan (vente et encaissement immédiats depuis le camion).',
  },
  {
    q: 'Est-il adapté aux distributeurs et grossistes en Algérie ?',
    a: 'TrackSera est conçu pour les distributeurs, grossistes et demi-grossistes algériens dans les 58 wilayas : agroalimentaire, boissons, pharmacie, cosmétiques, matériaux et plus.',
  },
  {
    q: 'La facturation est-elle conforme à la réglementation algérienne ?',
    a: 'Oui. TrackSera génère des factures conformes : TVA, timbre fiscal et mentions obligatoires, avec export PDF professionnel.',
  },
  {
    q: 'Combien coûte TrackSera ?',
    a: 'Une offre gratuite pour démarrer, la formule Starter à 4 500 DZD/mois, et la formule Business sans limite (produits et utilisateurs illimités) sur devis.',
  },
];

export default function LogicielDistributionPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/logiciel-de-distribution#software`,
        name: 'TrackSera — Logiciel de gestion de la distribution',
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'Distribution Management, Field Sales, Van Sales',
        operatingSystem: 'Web, Android',
        url: `${SITE_URL}/logiciel-de-distribution`,
        inLanguage: ['fr-DZ', 'ar-DZ'],
        description:
          'Logiciel de gestion de la distribution pour distributeurs et grossistes en Algérie : prévente, vente directe (CashVan), gestion des tournées, suivi GPS, recouvrement, stock multi-dépôts et facturation conforme.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'DZD',
          description: 'Offre gratuite pour démarrer',
          availability: 'https://schema.org/InStock',
        },
        featureList: FEATURE_NAMES,
        areaServed: { '@type': 'Country', name: 'Algeria', alternateName: 'الجزائر' },
        publisher: { '@id': `${SITE_URL}/#organization` },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Logiciel de distribution', item: `${SITE_URL}/logiciel-de-distribution` },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/logiciel-de-distribution#faq`,
        mainEntity: FAQS.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DistributionLanding />
    </>
  );
}
