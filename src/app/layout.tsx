import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';
import WhatsAppButton from '@/components/WhatsAppButton';
import { SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/i18n/locales';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'تراكسيرا — برنامج إدارة المنتجات، الكاشير والتوزيع في الجزائر | Logiciel Gestion, Caisse & Distribution',
    template: '%s | تراكسيرا',
  },
  description: 'برنامج متكامل لإدارة المنتجات، نقاط البيع (الكاشير) والتوزيع في الجزائر. كاتالوج المنتجات، المخزون والمستودعات، الكاشير POS، الطلبات والتوصيل، البيع المتنقل (Cashvan)، تتبع السائقين، الفوترة والتقارير — كل شيء في منصة واحدة.',
  keywords: [
    // Product & stock management — what Algerians actually type
    'برنامج إدارة المنتجات',
    'برنامج مخزون الجزائر',
    'برنامج مخزون',
    'برنامج محل',
    'تطبيق إدارة محل',
    'برنامج تجارة',
    'gestion de produits algerie',
    'gestion de stock algerie',
    'programme gestion stock',
    'programme stock magasin',
    'logiciel commerce algerie',
    // POS / Caisse
    'برنامج كاشير الجزائر',
    'برنامج كاشير',
    'برنامج نقطة البيع',
    'نقطة بيع POS الجزائر',
    'logiciel caisse algerie',
    'logiciel point de vente algerie',
    'logiciel POS algerie',
    // Facturation
    'برنامج فاتورة',
    'برنامج فوترة الجزائر',
    'logiciel facturation algerie',
    // Distribution
    'برنامج إدارة التوزيع',
    'برنامج توزيع الجزائر',
    'logiciel de distribution algerie',
    'logiciel gestion distribution',
    'إدارة الطلبات والتوصيل',
    'البيع المتنقل',
    'cashvan algerie',
    'تتبع السائقين',
    // Wholesale / retail
    'برنامج الجملة والتجزئة',
    'برنامج بيع وشراء',
    'برنامج محاسبة الجزائر',
    'logiciel grossiste algerie',
    'gestion commerciale algerie',
    'application gestion commerce algerie',
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Middleware sets x-locale on the request (and a follow-up cookie).
  // On a first hit the cookie isn't readable yet, so prefer the header.
  const hdrs = await headers();
  const cookieStore = await cookies();
  const headerLocale = hdrs.get('x-locale');
  const cookieLocale = cookieStore.get('locale')?.value;
  const candidate = headerLocale || cookieLocale;
  const initialLocale: Locale =
    candidate === 'ar' || candidate === 'fr' || candidate === 'en'
      ? candidate
      : 'en';
  const htmlDir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={initialLocale} dir={htmlDir}>
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
                  priceRange: '$0 - $99',
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
                    'Logiciel algérien en ligne pour la gestion commerciale, le stock, la facturation, la caisse POS et la distribution.',
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
                      priceCurrency: 'USD',
                      description: 'Free plan — 25 products, 14-day trial of paid features',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Starter',
                      price: '19',
                      priceCurrency: 'USD',
                      description: 'Starter plan — 100 products',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Pro',
                      price: '49',
                      priceCurrency: 'USD',
                      description: 'Pro plan — 500 products, multi-warehouse, POS, GPS',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Business',
                      price: '99',
                      priceCurrency: 'USD',
                      description: 'Business plan — 2000 products, CashVan, full mobile apps',
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
                    'Logiciel tout-en-un pour l\'Algérie : gestion commerciale, catalogue produits, caisse (POS), stock multi-dépôts, commandes, livraisons, CashVan, suivi GPS, facturation conforme.',
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
              ],
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <Providers initialLocale={initialLocale}>
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
