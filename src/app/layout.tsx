import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';
import WhatsAppButton from '@/components/WhatsAppButton';
import { SITE_URL } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'تراكسيرا — برنامج إدارة المنتجات، الكاشير والتوزيع في الجزائر | Logiciel Gestion, Caisse & Distribution',
    template: '%s | تراكسيرا',
  },
  description: 'برنامج متكامل لإدارة المنتجات، نقاط البيع (الكاشير) والتوزيع في الجزائر. كاتالوج المنتجات، المخزون والمستودعات، الكاشير POS، الطلبات والتوصيل، البيع المتنقل (Cashvan)، تتبع السائقين، الفوترة والتقارير — كل شيء في منصة واحدة.',
  keywords: [
    // Product management
    'برنامج إدارة المنتجات',
    'برنامج مخزون الجزائر',
    'gestion de produits algerie',
    'gestion de stock algerie',
    // POS / Caisse
    'برنامج كاشير الجزائر',
    'نقطة بيع POS الجزائر',
    'logiciel caisse algerie',
    'logiciel point de vente algerie',
    'logiciel POS algerie',
    // Distribution
    'برنامج إدارة التوزيع',
    'برنامج توزيع الجزائر',
    'logiciel de distribution algerie',
    'logiciel gestion distribution',
    'إدارة الطلبات والتوصيل',
    'البيع المتنقل',
    'cashvan algerie',
    'تتبع السائقين',
    // General
    'برنامج إدارة المبيعات',
    'برنامج فوترة الجزائر',
    'gestion commerciale algerie',
    'logiciel ERP algerie',
    'ERP PME algerie',
    'application gestion commerce algerie',
    'برنامج الجملة والتجزئة',
  ],
  alternates: {
    canonical: '/',
    languages: {
      'ar-DZ': '/',
      'fr-DZ': '/',
      'x-default': '/',
    },
  },
  openGraph: {
    title: 'تراكسيرا — المنتجات، الكاشير والتوزيع في منصة واحدة',
    description: 'حل شامل للمؤسسات الجزائرية: كاتالوج المنتجات، الكاشير POS، الطلبات، التوصيل، البيع المتنقل، المخزون متعدد المستودعات، الفوترة والتقارير.',
    type: 'website',
    locale: 'ar_DZ',
    alternateLocale: ['fr_DZ'],
    siteName: 'TrackSera',
    url: SITE_URL,
    images: [
      {
        url: '/api/og?title=TrackSera&subtitle=Produits+%C2%B7+Caisse+%C2%B7+Distribution',
        width: 1200,
        height: 630,
        alt: 'TrackSera — Gestion de produits, caisse et distribution en Algérie',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrackSera — Produits · Caisse · Distribution',
    description: 'La plateforme tout-en-un pour gérer vos produits, votre caisse et votre distribution en Algérie.',
    images: ['/api/og?title=TrackSera&subtitle=Produits+%C2%B7+Caisse+%C2%B7+Distribution'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': ['Organization', 'LocalBusiness'],
                  '@id': `${SITE_URL}/#organization`,
                  name: 'TrackSera',
                  alternateName: 'تراكسيرا',
                  legalName: 'TrackSera SARL',
                  url: SITE_URL,
                  logo: {
                    '@type': 'ImageObject',
                    url: `${SITE_URL}/t-logo.png`,
                    width: 512,
                    height: 512,
                  },
                  image: `${SITE_URL}/t-logo.png`,
                  description:
                    'Plateforme tout-en-un pour les entreprises algériennes : gestion de produits, caisse (POS), et distribution.',
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'El Biar',
                    addressLocality: 'Alger',
                    addressRegion: 'Alger',
                    postalCode: '16030',
                    addressCountry: 'DZ',
                  },
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: 36.7680,
                    longitude: 3.0297,
                  },
                  telephone: '+213549575512',
                  email: 'contact@tracksera.com',
                  priceRange: '0 DZD - 12900 DZD',
                  openingHoursSpecification: {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                    opens: '08:00',
                    closes: '17:00',
                  },
                  areaServed: [
                    { '@type': 'Country', name: 'Algeria', alternateName: 'الجزائر' },
                  ],
                  serviceArea: {
                    '@type': 'GeoCircle',
                    geoMidpoint: { '@type': 'GeoCoordinates', latitude: 28.0339, longitude: 1.6596 },
                    geoRadius: '2000000',
                  },
                  contactPoint: [
                    {
                      '@type': 'ContactPoint',
                      contactType: 'customer service',
                      telephone: '+213549575512',
                      email: 'contact@tracksera.com',
                      availableLanguage: ['Arabic', 'French'],
                      areaServed: 'DZ',
                    },
                    {
                      '@type': 'ContactPoint',
                      contactType: 'sales',
                      telephone: '+213549575512',
                      email: 'sales@tracksera.com',
                      availableLanguage: ['Arabic', 'French'],
                    },
                  ],
                  knowsLanguage: ['ar', 'fr'],
                  sameAs: [
                    'https://www.facebook.com/tracksera',
                    'https://www.linkedin.com/company/tracksera',
                    'https://www.instagram.com/tracksera',
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: 'TrackSera',
                  alternateName: 'تراكسيرا',
                  description:
                    'Plateforme SaaS algérienne pour la gestion de produits, caisse POS et distribution.',
                  publisher: { '@id': `${SITE_URL}/#organization` },
                  inLanguage: ['ar-DZ', 'fr-DZ'],
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                      '@type': 'EntryPoint',
                      urlTemplate: `${SITE_URL}/blog?q={search_term_string}`,
                    },
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  '@id': `${SITE_URL}/#software`,
                  name: 'TrackSera',
                  alternateName: 'تراكسيرا',
                  applicationCategory: 'BusinessApplication',
                  applicationSubCategory: 'ERP, POS, Distribution Management',
                  operatingSystem: 'Web, Android, iOS',
                  url: SITE_URL,
                  screenshot: `${SITE_URL}/api/og?title=TrackSera&subtitle=Dashboard`,
                  softwareVersion: '2.0',
                  releaseNotes: 'Multi-depot, CashVan, livraisons GPS, facturation conforme Algérie',
                  offers: [
                    {
                      '@type': 'Offer',
                      name: 'Free',
                      price: '0',
                      priceCurrency: 'DZD',
                      description: 'Plan gratuit — 25 produits',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Starter',
                      price: '2900',
                      priceCurrency: 'DZD',
                      description: 'Plan starter — 100 produits',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Pro',
                      price: '6900',
                      priceCurrency: 'DZD',
                      description: 'Plan pro — 500 produits',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Business',
                      price: '12900',
                      priceCurrency: 'DZD',
                      description: 'Plan business — 2000 produits',
                      availability: 'https://schema.org/InStock',
                    },
                  ],
                  aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: '4.8',
                    reviewCount: '52',
                    bestRating: '5',
                    worstRating: '1',
                  },
                  description:
                    'Plateforme SaaS tout-en-un pour l\'Algérie : catalogue produits, caisse (POS), stock multi-dépôts, commandes, livraisons, CashVan, suivi GPS, facturation conforme.',
                  featureList: [
                    'Catalogue produits et gestion de stock multi-dépôts',
                    'Caisse (POS) et ventes en magasin',
                    'Gestion des commandes et clients',
                    'Livraisons et tournées',
                    'Vente mobile CashVan',
                    'Suivi GPS des livreurs',
                    'Facturation conforme Algérie (TVA, timbre, mentions obligatoires)',
                    'Tableau de bord temps réel et rapports',
                  ],
                },
                {
                  '@type': 'FAQPage',
                  '@id': `${SITE_URL}/#faq`,
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'Qu\'est-ce que TrackSera ? — ما هو تراكسيرا؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'TrackSera est une plateforme SaaS algérienne tout-en-un pour gérer vos produits, caisse (POS), stock multi-dépôts, commandes, livraisons, vente mobile CashVan, suivi GPS des livreurs, et facturation conforme à la législation algérienne (TVA, timbre fiscal, mentions obligatoires). تراكسيرا هو منصة سحابية جزائرية متكاملة لإدارة المنتجات، الكاشير، المخزون متعدد المستودعات، الطلبات، التوصيل، البيع المتنقل وتتبع السائقين بالـ GPS.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Quel est le prix de TrackSera ? — كم سعر تراكسيرا؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'TrackSera commence gratuitement (25 produits). Plans payants : Starter 2 900 DZD/mois (100 produits), Pro 6 900 DZD/mois (500 produits), Business 12 900 DZD/mois (2 000 produits). Essai gratuit 14 jours. Paiement en dinars via CCP, BaridiMob, ou virement bancaire.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'TrackSera fonctionne-t-il hors ligne ? — هل يعمل بدون انترنت؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Oui. Les applications mobiles TrackSera (Vendeur, Livreur, CashVan) fonctionnent entièrement hors ligne avec synchronisation automatique dès que la connexion revient. Idéal pour les zones avec couverture faible en Algérie.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'La facturation est-elle conforme à la législation algérienne ? — هل الفوترة متوافقة مع القانون الجزائري؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Oui. TrackSera génère des factures conformes : TVA, timbre fiscal (en pourcentage), RC, NIF, NIS, AI, RIB, mentions obligatoires, numérotation séquentielle, et impression A4 ou ticket caisse 80mm.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Qu\'est-ce que CashVan ? — ما هو الكاشفان؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'CashVan est le système de vente mobile où le vendeur charge un véhicule avec des produits et vend directement aux clients sur la route. TrackSera fournit une application CashVan complète : chargement du stock, vente, facturation instantanée, impression Bluetooth, gestion des retours, et rapport de fin de tournée — fonctionne hors ligne.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Quels secteurs utilisent TrackSera ? — أي قطاعات تستخدم تراكسيرا؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Distributeurs en gros, magasins de détail, supérettes, alimentation et boissons, matériaux de construction, produits de nettoyage, pharmacies, parapharmacies, cosmétiques, fournitures de bureau, tabac, et délégués médicaux et commerciaux dans les 58 wilayas d\'Algérie.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'TrackSera supporte-t-il l\'arabe et le français ? — هل يدعم العربية والفرنسية؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Oui, interface complète en arabe (RTL) et français. Toutes les applications, factures et rapports sont disponibles dans les deux langues. Support technique également bilingue.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'Comment commencer avec TrackSera ? — كيف أبدأ؟',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Inscrivez-vous gratuitement en 5 minutes et bénéficiez de 14 jours d\'essai complet sans carte bancaire. Ajoutez vos produits et clients, puis utilisez tous les modules : caisse, commandes, livraisons, CashVan, stock, facturation et rapports.',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <WhatsAppButton />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                direction: 'rtl',
                fontFamily: 'Tajawal',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
