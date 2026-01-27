import type { Locale } from './constants';
import { translations } from './translations';

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => {
    return current?.[key];
  }, obj) || path;
}

/**
 * Get translation for a specific key and locale
 */
export function getTranslation(key: string, locale: Locale): string {
  const translation = translations[locale];
  if (!translation) {
    console.warn(`Translation not found for locale: ${locale}`);
    return key;
  }
  
  return getNestedValue(translation, key) || key;
}

/**
 * Create a translation function for a specific locale
 */
export function createTranslator(locale: Locale) {
  return (key: string, params?: Record<string, string | number>): string => {
    let translation = getTranslation(key, locale);
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  };
}

/**
 * Format a number according to the locale
 */
export function formatNumber(number: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(number);
}

/**
 * Format a currency amount according to the locale
 */
export function formatCurrency(amount: number, locale: Locale): string {
  const currency = locale === 'de' ? 'EUR' : 'EUR'; // Can be extended for different currencies
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format a date according to the locale
 */
export function formatDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale).format(date);
}

/**
 * Format a date with time according to the locale
 */
export function formatDateTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Get the direction (ltr/rtl) for a locale
 */
export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'en' || locale === 'de' ? 'ltr' : 'rtl';
}