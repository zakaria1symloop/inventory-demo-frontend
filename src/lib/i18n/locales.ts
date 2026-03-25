export type Locale = 'ar' | 'fr';

export const defaultLocale: Locale = 'ar';
export const locales: Locale[] = ['ar', 'fr'];

export const localeConfig = {
  ar: { dir: 'rtl' as const, name: 'العربية', label: 'AR' },
  fr: { dir: 'ltr' as const, name: 'Français', label: 'FR' },
} as const;

export type Direction = 'rtl' | 'ltr';
