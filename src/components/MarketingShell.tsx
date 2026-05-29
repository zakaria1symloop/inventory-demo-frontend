'use client';

import { useLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/locales';
import SiteNav from './SiteNav';
import SiteFooter from './SiteFooter';

// Wraps marketing/SEO pages with the shared header + footer and applies the
// reading direction for the active locale. Server pages keep their metadata
// and render their content as children.
export default function MarketingShell({ children }: { children: React.ReactNode }) {
  const { locale, setLocale } = useLocale();
  const cycleLang = () => {
    const order: Locale[] = ['fr', 'ar', 'en'];
    setLocale(order[(order.indexOf(locale) + 1) % order.length]);
  };

  return (
    <div dir={locale === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-white text-gray-900">
      <SiteNav lang={locale} onLangToggle={cycleLang} />
      {children}
      <SiteFooter lang={locale} />
    </div>
  );
}
