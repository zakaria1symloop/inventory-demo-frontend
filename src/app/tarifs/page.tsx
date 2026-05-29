import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import TarifsClient from './TarifsClient';

export const metadata: Metadata = {
  title: 'Tarifs TrackSera — Logiciel de gestion, caisse & distribution',
  description:
    'Tarifs simples et transparents pour TrackSera : gestion de produits, caisse (POS), stock, livraison, Cashvan et facturation. Essai gratuit 14 jours sans carte bancaire. À partir de 4 500 DZD/mois.',
  keywords: [
    'tracksera pricing',
    'tarif logiciel gestion',
    'tarif logiciel distribution algerie',
    'tarif POS',
    'distribution management software pricing',
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
      'Essai gratuit 14 jours. Tarifs à partir de 4 500 DZD/mois. Gestion de produits, caisse (POS), stock, livraison et Cashvan dans une seule plateforme.',
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ', 'en'],
    images: [
      {
        url: '/api/og?title=Tarifs+TrackSera&subtitle=Essai+gratuit+14+jours+%E2%80%93+%C3%A0+partir+de+4500+DZD%2Fmois&category=Tarifs&theme=blue',
        width: 1200,
        height: 630,
        alt: 'Tarifs TrackSera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs TrackSera',
    description: 'Gestion produits, caisse & distribution — à partir de 4 500 DZD/mois.',
    images: [
      '/api/og?title=Tarifs+TrackSera&subtitle=Essai+gratuit+14+jours&category=Tarifs&theme=blue',
    ],
  },
};

export default function TarifsPage() {
  const canonical = `${SITE_URL}/tarifs`;

  // price: null = "contact us" (no fixed price). Currency is DZD.
  const offers: { name: string; price: string | null; description: string }[] = [
    { name: 'Free', price: '0', description: 'Essai gratuit 14 jours, sans carte bancaire.' },
    { name: 'Starter', price: '4500', description: 'Commerces et petits distributeurs — jusqu’à 500 produits, 3 utilisateurs.' },
    { name: 'Business', price: null, description: 'Sans limite — produits et utilisateurs illimités, CashVan, multi-entrepôts. Sur devis, nous contacter.' },
  ];

  const faqs = [
    {
      q: 'Puis-je essayer TrackSera avant de payer ?',
      a: "Oui, un essai gratuit complet de 14 jours sans carte bancaire. Vous avez accès à toutes les fonctionnalités.",
    },
    {
      q: 'Comment puis-je payer ?',
      a: "Paiement par carte bancaire, CCP ou BaridiMob. La facturation est mensuelle ou annuelle, et vous pouvez changer de moyen de paiement à tout moment.",
    },
    {
      q: 'Les prix incluent-ils les taxes ?',
      a: "Les prix sont affichés en dinar algérien (DZD), toutes taxes comprises. Aucun frais caché ni frais d'installation.",
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
          'Logiciel de gestion de la distribution pour distributeurs et grossistes en Algérie : stock, caisse (POS), commandes, livraison, vente mobile (CashVan) et facturation.',
        brand: { '@type': 'Brand', name: 'TrackSera' },
        offers: offers.map((o) => {
          const offer: Record<string, unknown> = {
            '@type': 'Offer',
            name: o.name,
            description: o.description,
            url: canonical,
            availability: 'https://schema.org/InStock',
          };
          if (o.price !== null) {
            offer.price = o.price;
            offer.priceCurrency = 'DZD';
            offer.priceSpecification = {
              '@type': 'UnitPriceSpecification',
              price: o.price,
              priceCurrency: 'DZD',
              unitText: 'MONTH',
            };
          }
          return offer;
        }),
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
