import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Terms of Service — TrackSera',
  description:
    'TrackSera terms of service: subscription rules, acceptable use, billing, cancellation, liability, and governing law.',
  alternates: {
    canonical: '/terms',
    languages: {
      'ar-DZ': '/terms',
      'fr-DZ': '/terms',
      'en': '/terms',
      'x-default': '/terms',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/terms`,
    title: 'Terms of Service — TrackSera',
    description: 'Read the terms governing your use of TrackSera.',
    siteName: 'TrackSera',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service — TrackSera',
    description: 'Read the terms governing your use of TrackSera.',
  },
};

export default function TermsPage() {
  const canonical = `${SITE_URL}/terms`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: 'Terms of Service',
    url: canonical,
    inLanguage: ['en', 'fr-DZ', 'ar-DZ'],
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: canonical },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TermsClient />
    </>
  );
}
