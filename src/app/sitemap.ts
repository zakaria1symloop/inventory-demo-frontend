import type { MetadataRoute } from 'next';
import { blogPosts } from '@/lib/blog-data';
import { WILAYAS } from '@/lib/wilayas';
import { SECTORS } from '@/lib/sectors';
import { SITE_URL } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/tarifs`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/distribution`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/secteurs`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.8,
    alternates: {
      languages: {
        'ar-DZ': `${SITE_URL}/blog/${post.slug}`,
        'fr-DZ': `${SITE_URL}/blog/${post.slug}`,
      },
    },
  }));

  const wilayaRoutes: MetadataRoute.Sitemap = WILAYAS.map((w) => ({
    url: `${SITE_URL}/distribution/${w.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
    alternates: {
      languages: {
        'ar-DZ': `${SITE_URL}/distribution/${w.slug}`,
        'fr-DZ': `${SITE_URL}/distribution/${w.slug}`,
      },
    },
  }));

  const sectorRoutes: MetadataRoute.Sitemap = SECTORS.map((s) => ({
    url: `${SITE_URL}/secteurs/${s.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
    alternates: {
      languages: {
        'ar-DZ': `${SITE_URL}/secteurs/${s.slug}`,
        'fr-DZ': `${SITE_URL}/secteurs/${s.slug}`,
      },
    },
  }));

  return [...staticRoutes, ...blogRoutes, ...wilayaRoutes, ...sectorRoutes];
}
