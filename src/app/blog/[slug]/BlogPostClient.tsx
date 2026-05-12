'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/context';
import { getBlogPost, blogPosts, categoryLabels, type BlogPost } from '@/lib/blog-data';

const UI = {
  ar: {
    backToBlog: 'العودة إلى المدونة',
    minRead: 'دقيقة قراءة',
    publishedOn: 'نُشر في',
    by: 'بواسطة',
    relatedTitle: 'مقالات ذات صلة',
    ctaTitle: 'جاهز لتجربة TrackSera؟',
    ctaSubtitle: 'تجربة مجانية 14 يومًا، بدون بطاقة بنكية.',
    ctaButton: 'إنشاء حساب مجاني',
    notFound: 'المقال غير موجود',
    notFoundDesc: 'ربما تم نقله أو حذفه.',
    share: 'مشاركة',
    faqTitle: 'أسئلة شائعة',
    faqSubtitle: 'إجابات سريعة عن الأسئلة الأكثر تكرارًا',
  },
  fr: {
    backToBlog: 'Retour au blog',
    minRead: 'min de lecture',
    publishedOn: 'Publié le',
    by: 'Par',
    relatedTitle: 'Articles liés',
    ctaTitle: 'Prêt à essayer TrackSera ?',
    ctaSubtitle: 'Essai gratuit 14 jours, sans carte bancaire.',
    ctaButton: 'Créer un compte gratuit',
    notFound: 'Article introuvable',
    notFoundDesc: 'Il a peut-être été déplacé ou supprimé.',
    share: 'Partager',
    faqTitle: 'Questions fréquentes',
    faqSubtitle: 'Réponses rapides aux questions les plus posées',
  },
  en: {
    backToBlog: 'Back to blog',
    minRead: 'min read',
    publishedOn: 'Published',
    by: 'By',
    relatedTitle: 'Related articles',
    ctaTitle: 'Ready to try TrackSera?',
    ctaSubtitle: 'Free 14-day trial, no credit card.',
    ctaButton: 'Create a free account',
    notFound: 'Article not found',
    notFoundDesc: 'It may have been moved or removed.',
    share: 'Share',
    faqTitle: 'Frequently asked questions',
    faqSubtitle: 'Quick answers to the most common questions',
  },
};

export default function BlogPostClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const ui = UI[locale];
  const [post, setPost] = useState<BlogPost | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPost(getBlogPost(slug));
    setMounted(true);
    window.scrollTo(0, 0);
  }, [slug]);

  if (mounted && !post) {
    return (
      <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{ui.notFound}</h1>
          <p className="text-gray-500 mb-6">{ui.notFoundDesc}</p>
          <button
            onClick={() => router.push('/blog')}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors"
          >
            {ui.backToBlog}
          </button>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const related = blogPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 2);

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="flex items-center justify-between h-[60px]">
            <Link href="/" className="flex items-center gap-2">
              <img src="/t.png" alt="TrackSera" className="w-7 h-7" />
              <span className="text-[15px] font-bold text-gray-900 tracking-[-0.01em]">TrackSera</span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              <Link href="/#how-it-works" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'كيف يعمل' : 'Comment ça marche'}
              </Link>
              <Link href="/#modules" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الوحدات' : 'Modules'}
              </Link>
              <Link href="/#pricing" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الأسعار' : 'Tarifs'}
              </Link>
              <Link href="/blog" className="text-[13px] text-gray-900 font-semibold">
                {locale === 'ar' ? 'المدونة' : 'Blog'}
              </Link>
              <Link href="/#contact" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'تواصل معنا' : 'Contact'}
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 rounded-full p-0.5">
                <button onClick={() => setLocale('en')} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${locale === 'en' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>EN</button>
                <button onClick={() => setLocale('fr')} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${locale === 'fr' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>FR</button>
                <button onClick={() => setLocale('ar')} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${locale === 'ar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>عربي</button>
              </div>
              <Link href="/login" className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors">
                {locale === 'ar' ? 'الدخول' : 'Connexion'}
              </Link>
              <Link href="/register" className="px-4 py-2 text-[13px] font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors">
                {locale === 'ar' ? 'ابدأ مجاناً' : 'Commencer'}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Article header ── */}
      <header
        className="relative pt-16 pb-14 text-white overflow-hidden"
        style={{ background: post.gradient }}
      >
        {/* Texture: diagonal hatch + fine grid */}
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 14px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/25" />
        <div className="relative max-w-[760px] mx-auto px-5 sm:px-8 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 mb-10 px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full text-[12px] font-semibold transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {ui.backToBlog}
          </Link>

          <div className="flex items-center justify-center gap-3 mb-5 text-[12px] font-semibold uppercase tracking-wider opacity-90">
            <span>{categoryLabels[post.category][locale] ?? categoryLabels[post.category].fr}</span>
            <span className="opacity-50">•</span>
            <span>{post.readTime} {ui.minRead}</span>
          </div>

          <h1 className="text-[30px] sm:text-[42px] font-bold leading-[1.15] tracking-[-0.02em] mb-5">
            {post.title[locale] ?? post.title.fr}
          </h1>

          <p className="text-[16px] opacity-85 leading-relaxed max-w-[600px] mx-auto">
            {post.excerpt[locale] ?? post.excerpt.fr}
          </p>

          <div className="mt-7 inline-flex items-center gap-3 text-[12px] opacity-80">
            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
              T
            </div>
            <span>{ui.by} <strong>{post.author}</strong></span>
            <span className="opacity-50">•</span>
            <span>{formatDate(post.date)}</span>
          </div>
        </div>
      </header>

      {/* ── Article body ── */}
      <article className="max-w-[760px] mx-auto px-5 sm:px-8 py-16">
        {/* Pillar callout (skip on the pillar itself) */}
        {!post.pillar && (
          <Link
            href="/blog/guide-complet-distribution-algerie-2026"
            className="group flex items-center justify-between gap-4 mb-10 px-5 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-100 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="text-[20px]">📚</div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 mb-0.5">
                  {locale === 'ar' ? 'دليل شامل' : 'Guide complet'}
                </div>
                <div className="text-[14px] font-semibold text-gray-900">
                  {locale === 'ar'
                    ? 'الدليل الشامل للتوزيع في الجزائر 2026'
                    : 'Guide complet de la distribution en Algérie 2026'}
                </div>
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-600 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        <div
          className="blog-content prose-content"
          dangerouslySetInnerHTML={{ __html: post.content[locale] ?? post.content.fr }}
        />

        {/* Tags */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {(post.tags[locale] ?? post.tags.fr).map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[12px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* ── FAQ section (rich snippet target) ── */}
      {post.faqs && post.faqs.length > 0 && (
        <section className="border-t border-gray-100 py-16">
          <div className="max-w-[760px] mx-auto px-5 sm:px-8">
            <div className="text-center mb-10">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600 mb-3">
                FAQ
              </div>
              <h2 className="text-[28px] sm:text-[34px] font-bold text-gray-900 tracking-[-0.02em] mb-2">
                {ui.faqTitle}
              </h2>
              <p className="text-[14px] text-gray-500">{ui.faqSubtitle}</p>
            </div>
            <div className="space-y-3">
              {post.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-gray-50 hover:bg-gray-100/70 rounded-2xl border border-gray-100 transition-colors"
                >
                  <summary className="flex items-start justify-between gap-4 p-5 cursor-pointer list-none">
                    <h3 className="text-[15px] font-semibold text-gray-900 leading-snug flex-1">
                      {faq.question[locale] ?? faq.question.fr}
                    </h3>
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 group-open:rotate-45 transition-transform">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <div
                    className="px-5 pb-5 text-[14px] text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: faq.answer[locale] ?? faq.answer.fr }}
                  />
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-[760px] mx-auto px-5 sm:px-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.02em] mb-3">
                {ui.ctaTitle}
              </h2>
              <p className="text-gray-300 text-[15px] mb-8">{ui.ctaSubtitle}</p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-full hover:bg-gray-100 transition-colors text-[14px]"
              >
                {ui.ctaButton}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
            <h2 className="text-[24px] font-bold text-gray-900 tracking-[-0.02em] mb-8 text-center">
              {ui.relatedTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
              {related.map((rp) => (
                <Link
                  key={rp.slug}
                  href={`/blog/${rp.slug}`}
                  className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all"
                >
                  <div
                    className="relative h-24 overflow-hidden"
                    style={{ background: rp.gradient }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(45deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 10px)',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-2">
                      {categoryLabels[rp.category][locale] ?? categoryLabels[rp.category].fr}
                    </div>
                    <h3 className="text-[15px] font-bold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {rp.title[locale]}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/t.png" alt="TrackSera" className="w-6 h-6" />
            <span className="text-[13px] font-semibold text-gray-900">TrackSera</span>
            <span className="text-[12px] text-gray-400">© {new Date().getFullYear()}</span>
          </div>
          <Link href="/blog" className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors">
            ← {ui.backToBlog}
          </Link>
        </div>
      </footer>

      {/* Article typography */}
      <style jsx global>{`
        .blog-content {
          font-size: 17px;
          line-height: 1.75;
          color: #374151;
        }
        .blog-content .lead {
          font-size: 19px;
          line-height: 1.7;
          color: #1f2937;
          font-weight: 400;
          margin-bottom: 2rem;
        }
        .blog-content h2 {
          font-size: 28px;
          font-weight: 800;
          color: #111827;
          margin-top: 3rem;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }
        .blog-content h3 {
          font-size: 21px;
          font-weight: 700;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          letter-spacing: -0.01em;
        }
        .blog-content p {
          margin-bottom: 1.25rem;
        }
        .blog-content a {
          color: #2563eb;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-content a:hover {
          color: #1d4ed8;
        }
        .blog-content strong {
          color: #111827;
          font-weight: 700;
        }
        .blog-content ul:not(.check-list):not(.numbered-list) {
          list-style: disc;
          padding-inline-start: 1.5rem;
          margin-bottom: 1.25rem;
        }
        .blog-content ul:not(.check-list):not(.numbered-list) li {
          margin-bottom: 0.5rem;
        }
        .blog-content em {
          color: #4b5563;
          font-style: italic;
        }
        .blog-content [dir="rtl"] .info-box,
        .blog-content [dir="rtl"] .success-box,
        .blog-content [dir="rtl"] .warning-box,
        .blog-content [dir="rtl"] .purple-box {
          border-right: 4px solid;
          border-left: none;
        }
      `}</style>
    </div>
  );
}
