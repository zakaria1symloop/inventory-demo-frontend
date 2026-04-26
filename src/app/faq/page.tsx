import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import { faqData } from './faq-data';
import FaqClient from './FaqClient';

export const metadata: Metadata = {
  title: 'FAQ TrackSera — Questions fréquentes sur la gestion, caisse et distribution',
  description:
    'Réponses aux questions fréquentes sur TrackSera : prix, fonctionnalités, caisse POS, distribution, Cashvan, sécurité, support, facturation algérienne, essai gratuit et bien plus.',
  keywords: [
    'faq tracksera',
    'questions logiciel gestion algerie',
    'aide logiciel caisse',
    'aide logiciel distribution',
    'support cashvan',
    'الأسئلة الشائعة برنامج كاشير',
    'مساعدة برنامج توزيع الجزائر',
  ],
  alternates: {
    canonical: '/faq',
    languages: {
      'ar-DZ': '/faq',
      'fr-DZ': '/faq',
      'x-default': '/faq',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/faq`,
    title: 'FAQ TrackSera — Questions fréquentes',
    description:
      'Tout ce que vous voulez savoir sur TrackSera : prix, fonctionnalités, sécurité, support et plus.',
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ'],
    images: [
      {
        url: '/api/og?title=FAQ+TrackSera&subtitle=Questions+fr%C3%A9quentes+sur+la+gestion%2C+caisse+et+distribution&category=FAQ&theme=violet',
        width: 1200,
        height: 630,
        alt: 'FAQ TrackSera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ TrackSera',
    description: 'Questions fréquentes sur TrackSera.',
    images: ['/api/og?title=FAQ+TrackSera&subtitle=Questions+fr%C3%A9quentes&category=FAQ&theme=violet'],
  },
};

// Strip HTML tags for JSON-LD answers (schema.org expects plain text)
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default function FaqPage() {
  const canonical = `${SITE_URL}/faq`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        url: canonical,
        inLanguage: ['fr-DZ', 'ar-DZ'],
        mainEntity: faqData.map((item) => ({
          '@type': 'Question',
          name: item.q.fr,
          acceptedAnswer: {
            '@type': 'Answer',
            text: stripHtml(item.a.fr),
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'FAQ', item: canonical },
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
      <FaqClient />
    </>
  );
}
