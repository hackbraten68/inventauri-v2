/**
 * Simple translation utility for React components
 * This provides translation functionality without requiring a React context
 */

import { loadTranslations } from '../i18n/utils';
import { DEFAULT_LANGUAGE } from '../i18n/config';

// Cache for translations to avoid reloading
let translationsCache: Record<string, string> = {};
let currentLanguage = DEFAULT_LANGUAGE;
let isInitialized = false;

// Initialize translations on first use
const initializeTranslations = async (language?: string) => {
  if (isInitialized) return;

  const lang = language || getCurrentLanguage();
  try {
    translationsCache = await loadTranslations({
      language: lang,
      fallbackLanguage: DEFAULT_LANGUAGE,
      cacheTranslations: true,
      logMissingTranslations: true
    });
    currentLanguage = lang;
    isInitialized = true;
  } catch (error) {
    console.error('Failed to initialize translations:', error);
    // Fallback to default language
    translationsCache = await loadTranslations({
      language: DEFAULT_LANGUAGE,
      fallbackLanguage: DEFAULT_LANGUAGE,
      cacheTranslations: false,
      logMissingTranslations: false
    });
    currentLanguage = DEFAULT_LANGUAGE;
    isInitialized = true;
  }
};

// Get current language from URL
const getCurrentLanguage = (): string => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;

  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('lang') || DEFAULT_LANGUAGE;
};

// Translation function
export const t = (key: string, params?: Record<string, string | number>): string => {
  if (!isInitialized) {
    // Initialize synchronously if not already done
    initializeTranslations();
  }

  let translation = translationsCache[key] || key; // Fallback to key if not found

  // Interpolate parameters
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      translation = translation.replace(
        new RegExp(`\\{${paramKey}\\}`, 'g'),
        String(value)
      );
    });
  }

  return translation;
};

// Change language function
export const changeLanguage = async (newLanguage: string): Promise<void> => {
  if (newLanguage === currentLanguage) return;

  try {
    // Update URL parameter
    const url = new URL(window.location.href);
    if (newLanguage === DEFAULT_LANGUAGE) {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', newLanguage);
    }
    window.history.replaceState({}, '', url.toString());

    // Reload translations
    translationsCache = await loadTranslations({
      language: newLanguage,
      fallbackLanguage: DEFAULT_LANGUAGE,
      cacheTranslations: true,
      logMissingTranslations: true
    });
    currentLanguage = newLanguage;
    isInitialized = true;
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

// Get current language
export const getCurrentLang = (): string => currentLanguage;

// Check if a translation key exists
export const hasTranslation = (key: string): boolean => {
  return t(key) !== key;
};

// Get all available translations for debugging
export const getAllTranslations = (): Record<string, string> => {
  return { ...translationsCache };
};
