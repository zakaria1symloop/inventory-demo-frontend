import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { blogPosts, getBlogPost, categoryLabels } from '@/lib/blog-data';
import { SITE_URL } from '@/lib/site';
import BlogPostClient from './BlogPostClient';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

// Pull a short theme name out of the stored CSS gradient (e.g. "#f43f5e" → "rose")
function themeFromGradient(gradient: string): string {
  if (gradient.includes('f43f5e')) return 'rose';
  if (gradient.includes('f97316')) return 'orange';
  if (gradient.includes('0ea5e9')) return 'sky';
  if (gradient.includes('8b5cf6')) return 'violet';
  if (gradient.includes('10b981')) return 'emerald';
  if (gradient.includes('475569')) return 'slate';
  if (gradient.includes('3b82f6')) return 'blue';
  return 'default';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: 'Article introuvable',
      robots: { index: false, follow: false },
    };
  }

  const theme = themeFromGradient(post.gradient);
  const canonicalPath = `/blog/${post.slug}`;
  const ogUrl = `/api/og?title=${encodeURIComponent(post.title.fr)}&subtitle=${encodeURIComponent(
    post.excerpt.fr.slice(0, 160)
  )}&category=${encodeURIComponent(categoryLabels[post.category].fr)}&theme=${theme}`;

  return {
    title: `${post.title.fr} — ${post.title.ar}`,
    description: post.excerpt.fr,
    keywords: [...post.tags.fr, ...post.tags.ar],
    authors: [{ name: post.author }],
    alternates: {
      canonical: canonicalPath,
      languages: {
        'ar-DZ': canonicalPath,
        'fr-DZ': canonicalPath,
        'x-default': canonicalPath,
      },
    },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}${canonicalPath}`,
      title: post.title.fr,
      description: post.excerpt.fr,
      siteName: 'TrackSera',
      locale: 'fr_DZ',
      alternateLocale: ['ar_DZ'],
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: [post.author],
      tags: post.tags.fr,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: post.title.fr,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title.fr,
      description: post.excerpt.fr,
      images: [ogUrl],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const theme = themeFromGradient(post.gradient);
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const ogUrl = `${SITE_URL}/api/og?title=${encodeURIComponent(post.title.fr)}&subtitle=${encodeURIComponent(
    post.excerpt.fr.slice(0, 160)
  )}&category=${encodeURIComponent(categoryLabels[post.category].fr)}&theme=${theme}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonical}#article`,
        headline: post.title.fr,
        alternativeHeadline: post.title.ar,
        description: post.excerpt.fr,
        image: [ogUrl],
        datePublished: post.date,
        dateModified: post.date,
        author: {
          '@type': 'Organization',
          name: post.author,
          url: SITE_URL,
        },
        publisher: { '@id': `${SITE_URL}/#organization` },
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        inLanguage: ['fr-DZ', 'ar-DZ'],
        keywords: post.tags.fr.join(', '),
        articleSection: categoryLabels[post.category].fr,
        wordCount: post.content.fr.replace(/<[^>]+>/g, '').split(/\s+/).length,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title.fr, item: canonical },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogPostClient slug={slug} />
    </>
  );
}
