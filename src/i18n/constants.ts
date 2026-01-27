export const SUPPORTED_LOCALES = ['en', 'de'] as const;
export const DEFAULT_LOCALE = 'en' as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch'
} as const;