import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import Providers from '@/components/Providers';
import './globals.css';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.tracksera.com'),
  title: {
    default: 'تراكسيرا — برنامج إدارة التوزيع في الجزائر | Logiciel de Distribution',
    template: '%s | تراكسيرا',
  },
  description: 'برنامج إدارة التوزيع الأول في الجزائر. إدارة الطلبات، التوصيل، البيع المتنقل (Cashvan)، تتبع السائقين، إدارة المخزون والمستودعات، الفوترة والتقارير المالية. حل متكامل لشركات التوزيع والجملة. Logiciel de gestion de distribution en Algérie.',
  keywords: [
    // Arabic keywords
    'برنامج إدارة التوزيع',
    'برنامج توزيع الجزائر',
    'برنامج تسيير التوزيع',
    'برنامج إدارة المبيعات',
    'برنامج تسيير المبيعات الجزائر',
    'إدارة الطلبات والتوصيل',
    'البيع المتنقل',
    'تتبع السائقين',
    'إدارة المخزون والمستودعات',
    'برنامج فوترة الجزائر',
    'برنامج الجملة والتجزئة',
    'برنامج كاش فان',
    'تطبيق إدارة الموزعين',
    'برنامج تسيير المخزون',
    'برنامج محاسبة التوزيع',
    'برنامج المندوب الطبي',
    'تطبيق المندوب التجاري',
    'إدارة بونات الطلب',
    'délégué médical algérie',
    // French keywords
    'logiciel de distribution algerie',
    'logiciel gestion distribution',
    'gestion commerciale algerie',
    'logiciel ERP distribution',
    'logiciel de gestion commerciale algerie',
    'logiciel de facturation algerie',
    'gestion de tournees livraison',
    'logiciel cashvan algerie',
    'logiciel grossiste algerie',
    'gestion stock distribution',
    'suivi livreurs GPS',
    // English keywords
    'distribution management software algeria',
    'cashvan algerie',
    'delivery tracking software algeria',
    'wholesale management system',
  ],
  alternates: {
    canonical: '/',
    languages: {
      'ar-DZ': '/',
      'fr-DZ': '/',
      'x-default': '/',
    },
  },
  verification: {
    google: 'REPLACE_WITH_GOOGLE_VERIFICATION_CODE',
  },
  category: 'business software',
  openGraph: {
    title: 'تراكسيرا — برنامج إدارة التوزيع في الجزائر',
    description: 'حل متكامل لشركات التوزيع: طلبات، توصيل، بيع متنقل، تتبع سائقين، مخزون، فوترة وتقارير مالية.',
    type: 'website',
    locale: 'ar_DZ',
    url: 'https://www.tracksera.com',
    siteName: 'تراكسيرا - TrackSera',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'تراكسيرا - برنامج إدارة التوزيع في الجزائر',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تراكسيرا — برنامج إدارة التوزيع في الجزائر',
    description: 'حل متكامل لشركات التوزيع: طلبات، توصيل، بيع متنقل، تتبع سائقين، مخزون وتقارير.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/t.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: '/t.png',
    shortcut: '/t.png',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'LocalBusiness'],
      '@id': 'https://www.tracksera.com/#organization',
      name: 'TrackSera',
      alternateName: 'تراكسيرا',
      url: 'https://www.tracksera.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.tracksera.com/t.png',
        width: 512,
        height: 512,
      },
      image: 'https://www.tracksera.com/t.png',
      description: 'برنامج إدارة التوزيع الأول في الجزائر — Logiciel N°1 de gestion de distribution en Algérie',
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
      areaServed: {
        '@type': 'Country',
        name: 'Algeria',
        alternateName: 'الجزائر',
      },
      serviceArea: {
        '@type': 'GeoCircle',
        geoMidpoint: { '@type': 'GeoCoordinates', latitude: 36.7, longitude: 3.0 },
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
          email: 'contact@tracksera.com',
          availableLanguage: ['Arabic', 'French'],
        },
      ],
      sameAs: [],
      knowsLanguage: ['ar', 'fr'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://www.tracksera.com/#website',
      url: 'https://www.tracksera.com',
      name: 'TrackSera - تراكسيرا',
      description: 'برنامج إدارة التوزيع في الجزائر — Logiciel de gestion de distribution en Algérie',
      publisher: { '@id': 'https://www.tracksera.com/#organization' },
      inLanguage: ['ar', 'fr'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.tracksera.com/blog?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.tracksera.com/#software',
      name: 'TrackSera',
      alternateName: 'تراكسيرا',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Distribution Management Software',
      operatingSystem: 'Web, Android',
      description: 'برنامج إدارة التوزيع المتكامل: إدارة الطلبات، التوصيل، البيع المتنقل، تتبع السائقين، المخزون، الفوترة والتقارير المالية. Logiciel complet de gestion de distribution en Algérie.',
      offers: [
        {
          '@type': 'Offer',
          name: 'مجاني - Gratuit',
          price: '0',
          priceCurrency: 'DZD',
          description: 'خطة مجانية - 25 منتج',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'المبتدئ - Starter',
          price: '2900',
          priceCurrency: 'DZD',
          billingIncrement: 'P1M',
          description: 'خطة المبتدئ - 100 منتج',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'المحترف - Pro',
          price: '6900',
          priceCurrency: 'DZD',
          billingIncrement: 'P1M',
          description: 'خطة المحترف - 500 منتج',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer',
          name: 'الأعمال - Business',
          price: '12900',
          priceCurrency: 'DZD',
          billingIncrement: 'P1M',
          description: 'خطة الأعمال - 2000 منتج',
          availability: 'https://schema.org/InStock',
        },
      ],
      featureList: [
        'إدارة الطلبات — Gestion des commandes',
        'التوصيل وتتبع GPS — Livraison & suivi GPS',
        'البيع المتنقل Cashvan — Vente mobile Cashvan',
        'المبيعات والفوترة — Ventes & facturation',
        'إدارة المشتريات — Achats',
        'المخزون والمستودعات — Stock & entrepôts',
        'إدارة العملاء — Gestion clients',
        'إدارة الصندوق — Caisse',
        'التقارير والتحليلات — Rapports & analytiques',
        'تطبيقات الموبايل — Applications mobiles',
      ],
      screenshot: 'https://www.tracksera.com/opengraph-image',
      author: { '@id': 'https://www.tracksera.com/#organization' },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '47',
        bestRating: '5',
        worstRating: '1',
      },
    },
    /* ── FAQ Schema — targets featured snippets (position 0) ── */
    {
      '@type': 'FAQPage',
      '@id': 'https://www.tracksera.com/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'ما هو تراكسيرا؟ — Qu\'est-ce que TrackSera ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'تراكسيرا هو برنامج إدارة التوزيع الأول في الجزائر. يوفر حلاً متكاملاً لإدارة الطلبات، التوصيل وتتبع السائقين GPS، البيع المتنقل Cashvan، إدارة المخزون والمستودعات، الفوترة والتقارير المالية. TrackSera est le logiciel N°1 de gestion de distribution en Algérie.',
          },
        },
        {
          '@type': 'Question',
          name: 'هل يعمل تراكسيرا بدون إنترنت؟ — TrackSera fonctionne-t-il hors ligne ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'نعم، تطبيقات تراكسيرا الموبايل (البائع، السائق، Cashvan) تعمل بالكامل بدون إنترنت. يتم مزامنة البيانات تلقائياً عند عودة الاتصال. مثالي للمناطق ذات التغطية الضعيفة. Oui, les applications mobiles TrackSera fonctionnent entièrement hors ligne avec synchronisation automatique.',
          },
        },
        {
          '@type': 'Question',
          name: 'ما هو سعر تراكسيرا؟ — Quel est le prix de TrackSera ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'يبدأ تراكسيرا مجاناً (25 منتج). الخطط المدفوعة: المبتدئ 2,900 د.ج/شهر (100 منتج)، المحترف 6,900 د.ج/شهر (500 منتج)، الأعمال 12,900 د.ج/شهر (2,000 منتج). تجربة مجانية 14 يوم. الدفع بالدينار عبر CCP وبريدي موب.',
          },
        },
        {
          '@type': 'Question',
          name: 'ما هو نظام البيع المتنقل Cashvan؟ — Qu\'est-ce que le Cashvan ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cashvan هو نظام البيع المتنقل حيث يقوم البائع بالتنقل بسيارة محملة بالمنتجات والبيع مباشرة للعملاء. تراكسيرا يوفر تطبيق Cashvan متكامل: تحميل المخزون، البيع، الفوترة الفورية، الطباعة بلوتوث، إدارة المرتجعات، وتقرير نهاية الجولة — يعمل بدون إنترنت.',
          },
        },
        {
          '@type': 'Question',
          name: 'أي شركات يمكنها استخدام تراكسيرا؟ — Quelles entreprises peuvent utiliser TrackSera ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'تراكسيرا مصمم لشركات التوزيع والجملة، شركات المواد الغذائية والمشروبات، شركات البيع المتنقل Cashvan، موزعي مواد البناء والتنظيف، موزعي الأدوية، شركات التجميل، المندوبين الطبيين والتجاريين، وموزعي التبغ والقرطاسية في كل ولايات الجزائر الـ 48.',
          },
        },
        {
          '@type': 'Question',
          name: 'هل تراكسيرا يدعم العربية والفرنسية؟ — TrackSera supporte-t-il l\'arabe et le français ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'نعم، تراكسيرا يدعم واجهة كاملة باللغتين العربية والفرنسية. كل التطبيقات والتقارير والفواتير متاحة باللغتين. الدعم الفني متوفر أيضاً بالعربية والفرنسية.',
          },
        },
        {
          '@type': 'Question',
          name: 'كيف أبدأ مع تراكسيرا؟ — Comment commencer avec TrackSera ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'سجل مجاناً في 5 دقائق واحصل على تجربة 14 يوم كاملة بدون بطاقة بنكية. أضف منتجاتك وعملاءك وابدأ استخدام كل الوحدات: الطلبات، التوصيل، البيع المتنقل، المخزون، الفوترة والتقارير.',
          },
        },
        {
          '@type': 'Question',
          name: 'هل يتتبع تراكسيرا السائقين بالـ GPS؟ — TrackSera suit-il les chauffeurs par GPS ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'نعم، تراكسيرا يوفر تتبع GPS مباشر لكل السائقين على الخريطة. يمكنك رؤية موقع كل سائق في الوقت الحقيقي، مع إثبات التسليم بالصورة والتوقيع، وتخطيط ذكي لجولات التوصيل.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable} suppressHydrationWarning>
      <head>
        <link rel="author" href="https://www.tracksera.com/llms.txt" />
        <link rel="alternate" type="text/plain" href="https://www.tracksera.com/llms.txt" title="LLM Reference" />
        <link rel="alternate" type="text/plain" href="https://www.tracksera.com/llms-full.txt" title="LLM Full Reference" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${tajawal.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
