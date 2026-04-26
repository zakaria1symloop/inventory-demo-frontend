import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import TarifsClient from './TarifsClient';

export const metadata: Metadata = {
  title: 'Tarifs TrackSera — Prix gestion produits, caisse & distribution en Algérie',
  description:
    'Tarifs simples et transparents pour TrackSera : gestion de produits, caisse (POS), stock, livraison, Cashvan et facturation. Essai gratuit 14 jours sans carte bancaire. À partir de 2 900 DA/mois.',
  keywords: [
    'prix logiciel gestion algerie',
    'tarif logiciel caisse algerie',
    'prix logiciel distribution algerie',
    'tarif POS algerie',
    'prix logiciel facturation algerie',
    'tarif cashvan',
    'prix erp algerie',
    'أسعار برنامج كاشير الجزائر',
    'أسعار برنامج توزيع الجزائر',
    'أسعار برنامج فوترة الجزائر',
  ],
  alternates: {
    canonical: '/tarifs',
    languages: {
      'ar-DZ': '/tarifs',
      'fr-DZ': '/tarifs',
      'x-default': '/tarifs',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/tarifs`,
    title: 'Tarifs TrackSera — Gestion produits, caisse & distribution en Algérie',
    description:
      'Essai gratuit 14 jours. Tarifs à partir de 2 900 DA/mois. Gestion de produits, caisse (POS), stock, livraison et Cashvan dans une seule plateforme.',
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ'],
    images: [
      {
        url: '/api/og?title=Tarifs+TrackSera&subtitle=Essai+gratuit+14+jours+%E2%80%93+%C3%A0+partir+de+2+900+DA%2Fmois&category=Tarifs&theme=blue',
        width: 1200,
        height: 630,
        alt: 'Tarifs TrackSera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs TrackSera',
    description: 'Gestion produits, caisse & distribution en Algérie — à partir de 2 900 DA/mois.',
    images: [
      '/api/og?title=Tarifs+TrackSera&subtitle=Essai+gratuit+14+jours&category=Tarifs&theme=blue',
    ],
  },
};

export default function TarifsPage() {
  const canonical = `${SITE_URL}/tarifs`;

  const offers = [
    { name: 'Gratuit', price: '0', description: 'Essai 14 jours complet, sans carte bancaire.' },
    { name: 'Starter', price: '2900', description: 'Petites entreprises — 1 utilisateur, 100 produits.' },
    { name: 'Pro', price: '6900', description: 'Entreprises moyennes — 5 utilisateurs, 500 produits, GPS, POS.' },
    { name: 'Business', price: '12900', description: 'Grandes entreprises — 10 utilisateurs, Cashvan, apps mobiles.' },
  ];

  const faqs = [
    {
      q: 'Puis-je essayer TrackSera avant de payer ?',
      a: "Oui, un essai gratuit complet de 14 jours sans carte bancaire. Vous avez accès à toutes les fonctionnalités.",
    },
    {
      q: 'Comment puis-je payer ?',
      a: 'Virement bancaire, CCP et CIB Edahabia. Les factures sont émises mensuellement. Remise disponible pour paiement annuel.',
    },
    {
      q: 'Les prix incluent-ils les taxes ?',
      a: 'Les prix affichés sont hors taxes (HT). La TVA 19% et le droit de timbre sont ajoutés selon la législation algérienne.',
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
      a: 'Oui, notre équipe répond en arabe et en français par email, téléphone et WhatsApp.',
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
          'Plateforme SaaS algérienne pour la gestion des produits, la caisse (POS), le stock, la distribution, la vente mobile Cashvan et la facturation.',
        brand: { '@type': 'Brand', name: 'TrackSera' },
        offers: offers.map((o) => ({
          '@type': 'Offer',
          name: o.name,
          description: o.description,
          price: o.price,
          priceCurrency: 'DZD',
          url: canonical,
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: o.price,
            priceCurrency: 'DZD',
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
