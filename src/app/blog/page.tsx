import type { Metadata } from 'next';
import { blogPosts } from '@/lib/blog-data';
import { SITE_URL } from '@/lib/site';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = {
  title: 'Blog TrackSera — Gestion de produits, caisse et distribution en Algérie',
  description:
    'Guides, conseils et actualités pour les distributeurs, commerces et entreprises algériennes : gestion de produits, caisse (POS), stock, livraison, CashVan, facturation et plus.',
  keywords: [
    'blog distribution algerie',
    'blog gestion stock',
    'blog logiciel caisse',
    'blog cashvan',
    'conseils distributeurs algerie',
    'مدونة التوزيع الجزائر',
    'نصائح التجار والموزعين',
  ],
  alternates: {
    canonical: '/blog',
    languages: {
      'ar-DZ': '/blog',
      'fr-DZ': '/blog',
      'x-default': '/blog',
    },
  },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: 'Blog TrackSera — Conseils pour distributeurs et commerces algériens',
    description:
      'Guides pratiques pour gérer produits, caisse, stock, livraisons et distribution en Algérie.',
    siteName: 'TrackSera',
    locale: 'fr_DZ',
    alternateLocale: ['ar_DZ'],
    images: [
      {
        url: '/api/og?title=Blog+TrackSera&subtitle=Guides+pour+distributeurs+et+commerces+alg%C3%A9riens&category=Blog',
        width: 1200,
        height: 630,
        alt: 'Blog TrackSera',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog TrackSera',
    description: 'Guides et conseils pour distributeurs et commerces algériens.',
    images: ['/api/og?title=Blog+TrackSera&subtitle=Guides+pour+distributeurs+et+commerces+alg%C3%A9riens&category=Blog'],
  },
};

export default function BlogPage() {
  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${SITE_URL}/blog#blog`,
    url: `${SITE_URL}/blog`,
    name: 'Blog TrackSera',
    description:
      'Guides et conseils pour les distributeurs, commerces et entreprises algériennes.',
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: ['fr-DZ', 'ar-DZ'],
    blogPost: blogPosts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title.fr,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
      dateModified: p.date,
      author: { '@type': 'Organization', name: p.author },
      image: `${SITE_URL}/api/og?title=${encodeURIComponent(p.title.fr)}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <BlogListClient />
    </>
  );
}
