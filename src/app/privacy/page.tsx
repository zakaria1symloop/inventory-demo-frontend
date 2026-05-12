import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Privacy Policy — TrackSera',
  description:
    'How TrackSera collects, uses, and protects personal data. Your rights, data retention, security, and contact details.',
  alternates: {
    canonical: '/privacy',
    languages: {
      'ar-DZ': '/privacy',
      'fr-DZ': '/privacy',
      'en': '/privacy',
      'x-default': '/privacy',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/privacy`,
    title: 'Privacy Policy — TrackSera',
    description: 'How TrackSera collects, uses, and protects personal data.',
    siteName: 'TrackSera',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy — TrackSera',
    description: 'How TrackSera collects, uses, and protects personal data.',
  },
};

export default function PrivacyPage() {
  const canonical = `${SITE_URL}/privacy`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: 'Privacy Policy',
    url: canonical,
    inLanguage: ['en', 'fr-DZ', 'ar-DZ'],
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: canonical },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PrivacyClient />
    </>
  );
}
