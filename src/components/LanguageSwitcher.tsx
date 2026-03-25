'use client';

import { useLocale } from '@/lib/i18n/context';

interface Props {
  /** @deprecated Use context instead. Kept for backward compat with landing pages. */
  lang?: 'ar' | 'fr';
  /** @deprecated Use context instead. */
  onToggle?: () => void;
}

export default function LanguageSwitcher({ lang: propLang, onToggle }: Props = {}) {
  const { locale: ctxLocale, setLocale } = useLocale();

  // Use props if provided (landing pages), otherwise context (dashboard)
  const lang = propLang ?? ctxLocale;
  const handleToggle = onToggle ?? (() => setLocale(lang === 'ar' ? 'fr' : 'ar'));

  if (lang === 'fr') {
    return (
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        title="العربية"
      >
        <span className="text-sm">🇩🇿</span>
        <span>العربية</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
      dir="ltr"
      title="Français"
    >
      <span className="text-sm">🇫🇷</span>
      <span>Français</span>
    </button>
  );
}
