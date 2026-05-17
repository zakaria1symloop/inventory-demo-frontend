// Blog content schema — strict, all locales required.
//
// Why this file lives in src/content/blog/ and not src/lib/:
// posts live next to types because they're the same domain (content),
// not generic library code. One folder per post keeps git diffs sane.

export type BlogCategory = 'guides' | 'product' | 'industry';

/**
 * ISO 3166-1 alpha-2 country codes we target for SEO. 'global' = generic.
 * Maghreb + West Africa francophone + Egypt + Gulf, expandable.
 */
export type CountryCode =
  | 'global'
  | 'DZ' | 'MA' | 'TN'                            // Maghreb
  | 'SN' | 'CI' | 'CM' | 'ML' | 'BF'              // West Africa francophone
  | 'EG'                                          // Egypt
  | 'SA' | 'AE' | 'KW' | 'QA' | 'BH' | 'OM';      // Gulf

export interface BlogFAQ {
  question: { ar: string; fr: string; en: string };
  answer: { ar: string; fr: string; en: string };
}

export interface BlogHowToStep {
  name: { ar: string; fr: string; en: string };
  text: { ar: string; fr: string; en: string };
}

/**
 * Per-locale slug. Distinct URLs per language strengthen SEO because
 * each lands on a localized keyword. Optional — defaults to a shared slug.
 *
 *   slug.ar = 'برنامج-إدارة-التوزيع-2026'  (Arabic slugs preserve UTF-8)
 *   slug.fr = 'logiciel-gestion-distribution-2026'
 *   slug.en = 'distribution-management-software-2026'
 */
export interface LocalizedSlug {
  ar?: string;
  fr?: string;
  en?: string;
}

/**
 * Per-locale SEO metadata, distinct from the article body. A literal
 * translation of a French title is rarely the best English title for
 * Google. This lets us write proper meta titles/descriptions/keywords
 * per locale.
 */
export interface LocalizedSEO {
  metaTitle: string;       // ~50-60 chars, must include primary keyword
  metaDescription: string; // ~150-160 chars
  keywords: string[];      // 5-10 phrase-match targets
}

export interface BlogPost {
  /** Default slug used when a per-locale slug is missing. */
  slug: string;
  /** Optional per-locale slugs. Falls back to `slug`. */
  slugs?: LocalizedSlug;

  category: BlogCategory;
  date: string;       // ISO date
  readTime: number;   // minutes
  author: string;
  emoji: string;
  gradient: string;

  /**
   * Country targeting. Empty / undefined = global. SEO routing uses this
   * to surface region-relevant content first.
   */
  countries?: CountryCode[];

  title: { ar: string; fr: string; en: string };
  excerpt: { ar: string; fr: string; en: string };
  content: { ar: string; fr: string; en: string };
  tags: { ar: string[]; fr: string[]; en: string[] };

  /** Per-locale SEO overrides. If absent, `title`/`excerpt` are used. */
  seo?: { ar?: LocalizedSEO; fr?: LocalizedSEO; en?: LocalizedSEO };

  faqs?: BlogFAQ[];
  howTo?: { name: { ar: string; fr: string; en: string }; steps: BlogHowToStep[] };

  /** Marks pillar / cornerstone content for sitemap priority. */
  pillar?: boolean;
}

/**
 * Shape exported from each per-locale file (ar.ts / fr.ts / en.ts).
 * Keeps each language's content readable in isolation.
 */
export interface LocalePostContent {
  title: string;
  excerpt: string;
  content: string; // HTML using blog-content CSS classes
  tags: string[];
  seo?: LocalizedSEO;
}

export const categoryLabels: Record<BlogCategory, { ar: string; fr: string; en: string }> = {
  guides: { ar: 'أدلة ونصائح', fr: 'Guides et conseils', en: 'Guides & tips' },
  product: { ar: 'تحديثات المنتج', fr: 'Mises à jour produit', en: 'Product updates' },
  industry: { ar: 'أخبار القطاع', fr: 'Actualités secteur', en: 'Industry news' },
};
