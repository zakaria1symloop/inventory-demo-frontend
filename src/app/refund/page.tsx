import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site';
import RefundClient from './RefundClient';

export const metadata: Metadata = {
  title: 'Refund Policy — TrackSera',
  description:
    'TrackSera refund policy: 14-day money-back guarantee, eligibility, process, exclusions, and contact details.',
  alternates: {
    canonical: '/refund',
    languages: {
      'ar-DZ': '/refund',
      'fr-DZ': '/refund',
      'en': '/refund',
      'x-default': '/refund',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/refund`,
    title: 'Refund Policy — TrackSera',
    description: 'How refunds work at TrackSera.',
    siteName: 'TrackSera',
  },
  twitter: {
    card: 'summary',
    title: 'Refund Policy — TrackSera',
    description: 'How refunds work at TrackSera.',
  },
};

export default function RefundPage() {
  const canonical = `${SITE_URL}/refund`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    name: 'Refund Policy',
    url: canonical,
    inLanguage: ['en', 'fr-DZ', 'ar-DZ'],
    isPartOf: { '@id': `${SITE_URL}/#website` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Refund Policy', item: canonical },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RefundClient />
    </>
  );
}
