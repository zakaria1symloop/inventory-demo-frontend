'use client';

import { useLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/locales';

interface Props {
  /** @deprecated Use context instead. Kept for backward compat with landing pages. */
  lang?: 'ar' | 'fr' | 'en';
  /** @deprecated Use context instead. Cycles to next locale. */
  onToggle?: () => void;
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
];

export default function LanguageSwitcher({ lang: propLang, onToggle }: Props = {}) {
  const { locale: ctxLocale, setLocale } = useLocale();
  const current = propLang ?? ctxLocale;

  // Legacy onToggle: cycle to the next locale in the rotation.
  const handleClick = (target: Locale) => {
    if (onToggle && target !== current) {
      onToggle();
      // Best-effort: if the parent's onToggle expects a single binary flip,
      // also set the context so the visible label is correct.
      setLocale(target);
    } else {
      setLocale(target);
    }
  };

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-white dark:bg-gray-800">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => handleClick(code)}
          aria-pressed={current === code}
          className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
            current === code
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
