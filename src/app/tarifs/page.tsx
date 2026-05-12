import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import TarifsClient from './TarifsClient';

export const metadata: Metadata = {
  title: 'Tarifs TrackSera — Logiciel de gestion, caisse & distribution',
  description:
    'Tarifs simples et transparents pour TrackSera : gestion de produits, caisse (POS), stock, livraison, Cashvan et facturation. Essai gratuit 14 jours sans carte bancaire. À partir de $19/mois.',
  keywords: [
    'tracksera pricing',
    'tarif logiciel gestion',
    'tarif POS',
    'distribution management software pricing',
    'business management software pricing',
    'logiciel cashvan tarif',
    'أسعار برنامج كاشير',
    'أسعار برنامج توزيع',
  ],
  alternates: {
    canonical: '/tarifs',
    languages: {
      'ar-DZ': '/tarifs',
      'fr-DZ': '/tarifs',
      'en': '/tarifs',
      'x-default': '/tarifs',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/tarifs`,
    title: 'Tarifs TrackSera — Logiciel de gestion, caisse & distribution',
    description:
      'Essai gratuit 14 jours. Tarifs à partir de $19/mois. Gestion de produits, caisse (POS), stock, livraison et Cashvan dans une seule plateforme.',
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ', 'en'],
    images: [
      {
        url: '/api/og?title=Tarifs+TrackSera&subtitle=Essai+gratuit+14+jours+%E2%80%93+%C3%A0+partir+de+%2419%2Fmois&category=Tarifs&theme=blue',
        width: 1200,
        height: 630,
        alt: 'Tarifs TrackSera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs TrackSera',
    description: 'Gestion produits, caisse & distribution — à partir de $19/mois.',
    images: [
      '/api/og?title=Tarifs+TrackSera&subtitle=Essai+gratuit+14+jours&category=Tarifs&theme=blue',
    ],
  },
};

export default function TarifsPage() {
  const canonical = `${SITE_URL}/tarifs`;

  const offers = [
    { name: 'Free', price: '0', description: '14-day free trial, no credit card required.' },
    { name: 'Starter', price: '19', description: 'Small businesses — 1 user, 100 products.' },
    { name: 'Pro', price: '49', description: 'Medium businesses — 5 users, 500 products, GPS, POS.' },
    { name: 'Business', price: '99', description: 'Large businesses — 10 users, Cashvan, mobile apps.' },
  ];

  const faqs = [
    {
      q: 'Puis-je essayer TrackSera avant de payer ?',
      a: "Oui, un essai gratuit complet de 14 jours sans carte bancaire. Vous avez accès à toutes les fonctionnalités.",
    },
    {
      q: 'Comment puis-je payer ?',
      a: "Paiement par carte bancaire via notre partenaire Paddle. La facturation est mensuelle ou annuelle, et vous pouvez changer de moyen de paiement à tout moment.",
    },
    {
      q: 'Les prix incluent-ils les taxes ?',
      a: "Les prix affichés sont en USD. Les taxes locales (TVA / Sales Tax) peuvent être ajoutées au paiement selon votre pays, calculées et collectées par Paddle en tant que Merchant of Record.",
    },
    {
      q: 'Puis-je changer de formule plus tard ?',
      a: 'Oui, vous pouvez changer de formule à tout moment depuis votre tableau de bord. Le changement prend effet le mois suivant.',
    },
    {
      q: "Que se passe-t-il à la fin de l'essai gratuit ?",
      a: "Votre compte passe en lecture seule si vous ne choisissez pas de formule payante. Vos données restent conservées 30 jours supplémentaires.",
    },
    {
      q: 'Y a-t-il une remise pour un abonnement annuel ?',
      a: '15% de remise sur le tarif mensuel en cas de paiement annuel. Contactez-nous pour les détails.',
    },
    {
      q: 'Mes données sont-elles en sécurité ?',
      a: 'SSL, sauvegardes quotidiennes et sauvegarde hebdomadaire hors-site. Vos données vous appartiennent et peuvent être exportées à tout moment.',
    },
    {
      q: 'Y a-t-il un support en arabe ?',
      a: 'Oui, notre équipe répond en arabe, français et anglais par email, téléphone et WhatsApp.',
    },
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${canonical}#product`,
        name: 'TrackSera',
        description:
          'Cloud business management software for retailers, wholesalers, and distributors. Inventory, POS, orders, delivery, mobile sales (CashVan), and invoicing.',
        brand: { '@type': 'Brand', name: 'TrackSera' },
        offers: offers.map((o) => ({
          '@type': 'Offer',
          name: o.name,
          description: o.description,
          price: o.price,
          priceCurrency: 'USD',
          url: canonical,
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: o.price,
            priceCurrency: 'USD',
            unitText: 'MONTH',
          },
        })),
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
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Tarifs', item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TarifsClient />
    </>
  );
}
