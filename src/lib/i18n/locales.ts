export type Locale = 'ar' | 'fr' | 'en';

export const defaultLocale: Locale = 'ar';
export const locales: Locale[] = ['ar', 'fr', 'en'];

export const localeConfig = {
  ar: { dir: 'rtl' as const, name: 'العربية', label: 'AR' },
  fr: { dir: 'ltr' as const, name: 'Français', label: 'FR' },
  en: { dir: 'ltr' as const, name: 'English', label: 'EN' },
} as const;

export type Direction = 'rtl' | 'ltr';
