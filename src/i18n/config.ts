/**
 * i18n configuration for the Inventauri application
 * Integrates astro-i18n with react-i18next for comprehensive SSR + React support
 */

import type { Language } from './types';

// Supported languages configuration
export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flagIcon: 'flag-en',
    isDefault: true,
    isActive: true,
    textDirection: 'ltr'
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flagIcon: 'flag-de',
    isDefault: false,
    isActive: true,
    textDirection: 'ltr'
  }
];

// Default language configuration
export const DEFAULT_LANGUAGE = 'en';

// i18n configuration
export const I18N_CONFIG = {
  defaultLanguage: DEFAULT_LANGUAGE,
  supportedLanguages: SUPPORTED_LANGUAGES.map(lang => lang.code),
  fallbackStrategy: 'default' as const,
  enableCaching: true,
  logMissingTranslations: true,
  enableDevTools: process.env.NODE_ENV === 'development'
};

// Astro i18n configuration
export const ASTRO_I18N_CONFIG = {
  locales: SUPPORTED_LANGUAGES.map(lang => lang.code),
  defaultLocale: DEFAULT_LANGUAGE,
  routing: {
    prefixDefaultLocale: false // Don't prefix default language URLs
  },
  i18n: {
    // Custom i18n configuration for astro-i18n
    fallbackLng: DEFAULT_LANGUAGE,
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  }
};

// React i18next configuration
export const REACT_I18NEXT_CONFIG = {
  fallbackLng: DEFAULT_LANGUAGE,
  debug: process.env.NODE_ENV === 'development',
  interpolation: {
    escapeValue: false // React already escapes values
  },
  react: {
    useSuspense: false // Disable suspense for SSR compatibility
  },
  detection: {
    // Language detection order
    order: ['querystring', 'navigator', 'htmlTag'],
    // Keys to lookup language from
    lookupQuerystring: 'lang',
    // Cache user language
    caches: ['localStorage']
  }
};

// Validation functions
export function validateLanguageCode(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getSupportedLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
}
