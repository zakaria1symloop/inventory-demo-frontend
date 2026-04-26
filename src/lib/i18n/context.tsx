'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale, Direction } from './locales';
import { defaultLocale, localeConfig } from './locales';
import ar from './dictionaries/ar';
import fr from './dictionaries/fr';

const dictionaries = { ar, fr } as const;

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

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Always start with defaultLocale on both server and client to avoid SSR
  // hydration mismatch. Sync from localStorage in the effect below.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  const dir = localeConfig[locale].dir;

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if ((stored === 'ar' || stored === 'fr') && stored !== locale) {
      setLocaleState(stored);
    }
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

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const result = getNestedValue(dictionaries[locale] as unknown as Record<string, unknown>, key);
      if (result !== key) return interpolate(result, params);
      if (locale !== 'ar') {
        const fallback = getNestedValue(dictionaries.ar as unknown as Record<string, unknown>, key);
        if (fallback !== key) return interpolate(fallback, params);
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
