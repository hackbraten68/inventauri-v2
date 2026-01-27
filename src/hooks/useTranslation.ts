import { use } from 'react';
import { createTranslator } from '../i18n/utils';
import type { Locale } from '../i18n/constants';

/**
 * Get current locale from URL path
 */
function getCurrentLocaleFromPath(): Locale {
  if (typeof window === 'undefined') return 'en';
  
  const path = window.location.pathname;
  const localeMatch = path.match(/^\/([a-z]{2})\//);
  const locale = (localeMatch?.[1] as Locale) || 'en';
  
  return ['en', 'de'].includes(locale) ? locale : 'en';
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const locale = getCurrentLocaleFromPath();
  const t = createTranslator(locale);
  
  return { t, locale };
}