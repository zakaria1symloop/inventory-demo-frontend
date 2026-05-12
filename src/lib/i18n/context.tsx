'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Direction } from './locales';
import { defaultLocale, localeConfig } from './locales';
import ar from './dictionaries/ar';
import fr from './dictionaries/fr';
import en from './dictionaries/en';

const dictionaries = { ar, fr, en } as const;

type Dictionary = typeof ar;

// Recursive key path helper
type NestedKeyOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? NestedKeyOf<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<Dictionary>;

interface LocaleContextValue {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`
  );
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  // SSR seeds the locale from a server-detected value (middleware sets a
  // cookie from Accept-Language / ?lang=). Client effects below refine from
  // localStorage and the actual navigator language.
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? defaultLocale);

  const dir = localeConfig[locale].dir;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // 1. Explicit ?lang= query param wins. Used by Paddle review links
    //    and any other place that needs to deep-link to a specific locale.
    const params = new URLSearchParams(window.location.search);
    const q = params.get('lang');
    if (q === 'ar' || q === 'fr' || q === 'en') {
      if (q !== locale) setLocaleState(q);
      localStorage.setItem('locale', q);
      return;
    }
    // 2. User's prior choice from localStorage.
    const stored = localStorage.getItem('locale');
    if (stored === 'ar' || stored === 'fr' || stored === 'en') {
      if (stored !== locale) setLocaleState(stored);
      return;
    }
    // 3. First visit: detect from browser. Algerian/Arabic browsers stay
    //    on the default AR. French browsers get FR. Anyone else (English,
    //    Spanish, German, etc.) gets EN — that's the international default.
    const nav = (window.navigator.language || '').toLowerCase();
    let detected: Locale = defaultLocale;
    if (nav.startsWith('ar')) detected = 'ar';
    else if (nav.startsWith('fr')) detected = 'fr';
    else detected = 'en';
    if (detected !== locale) setLocaleState(detected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  }, []);

  // Fallback chain when a key is missing in the current locale:
  //   en → fr → ar
  //   fr → ar
  //   ar → key (final fallback)
  // Why this order: en.ts is gradually being filled. While it's still partial,
  // English visitors get French strings (much more readable than Arabic for
  // most English speakers) for any missing key.
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const result = getNestedValue(dictionaries[locale] as unknown as Record<string, unknown>, key);
      if (result !== key) return interpolate(result, params);
      if (locale === 'en') {
        const fr2 = getNestedValue(dictionaries.fr as unknown as Record<string, unknown>, key);
        if (fr2 !== key) return interpolate(fr2, params);
      }
      if (locale !== 'ar') {
        const arFallback = getNestedValue(dictionaries.ar as unknown as Record<string, unknown>, key);
        if (arFallback !== key) return interpolate(arFallback, params);
      }
      return key;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, dir, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
