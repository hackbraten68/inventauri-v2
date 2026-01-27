import type { AstroGlobal } from 'astro';
import type { Locale } from './constants';
import { createTranslator } from './utils';

/**
 * Get the current locale from Astro context
 */
export function getCurrentLocale(Astro: AstroGlobal): Locale {
  const url = Astro.url.pathname;
  const localeMatch = url.match(/^\/([a-z]{2})\//);
  const locale = (localeMatch?.[1] as Locale) || 'en';
  
  // Validate that it's a supported locale
  if (['en', 'de'].includes(locale)) {
    return locale;
  }
  
  return 'en';
}

/**
 * Get translation function for the current request
 */
export function getTranslationFunction(Astro: AstroGlobal) {
  const locale = getCurrentLocale(Astro);
  return createTranslator(locale);
}

/**
 * Get locale-specific HTML attributes
 */
export function getLocaleAttributes(locale: Locale) {
  return {
    lang: locale,
    dir: 'ltr' // Currently all supported languages are LTR
  };
}