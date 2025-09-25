/**
 * Core internationalization utility functions
 * Handles language detection, URL management, and translation loading
 */

import type {
  Language,
  LanguageDetectionOptions,
  TranslationLoadOptions,
  TranslationCache,
  LanguageChangeEvent,
  I18nConfig
} from './types';

// In-memory translation cache for performance
class SimpleTranslationCache implements TranslationCache {
  private cache = new Map<string, string>();

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global translation cache instance
export const translationCache = new SimpleTranslationCache();

/**
 * Detects the user's preferred language from URL parameters and browser settings
 */
export function detectLanguage(options: LanguageDetectionOptions): string {
  const { supportedLanguages, defaultLanguage, fallbackToBrowserLanguage } = options;

  // 1. Check URL parameter first (?lang=de)
  const urlParams = new URLSearchParams(window.location.search);
  const urlLanguage = urlParams.get('lang');

  if (urlLanguage && supportedLanguages.includes(urlLanguage)) {
    return urlLanguage;
  }

  // 2. Fall back to browser language if enabled
  if (fallbackToBrowserLanguage) {
    const browserLanguage = navigator.language.split('-')[0]; // Get primary language code
    if (supportedLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }
  }

  // 3. Return default language
  return defaultLanguage;
}

/**
 * Updates the URL with the new language parameter
 */
export function updateLanguageInUrl(languageCode: string): void {
  const url = new URL(window.location.href);

  if (languageCode === 'en') {
    // Remove lang parameter for default language to keep URLs clean
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', languageCode);
  }

  // Update URL without triggering page reload
  window.history.replaceState({}, '', url.toString());
}

/**
 * Loads translations for a specific language with fallback support
 */
export async function loadTranslations(options: TranslationLoadOptions): Promise<Record<string, string>> {
  const { language, fallbackLanguage = 'en', cacheTranslations = true, logMissingTranslations = true } = options;

  // Check cache first
  const cacheKey = `translations_${language}`;
  if (cacheTranslations && translationCache.has(cacheKey)) {
    return JSON.parse(translationCache.get(cacheKey)!);
  }

  try {
    // Load primary language translations
    const primaryTranslations = await loadTranslationFile(language);

    // Load fallback translations (usually English)
    const fallbackTranslations = fallbackLanguage !== language
      ? await loadTranslationFile(fallbackLanguage)
      : {};

    // Merge translations with fallback support
    const mergedTranslations = { ...fallbackTranslations, ...primaryTranslations };

    // Cache the merged translations
    if (cacheTranslations) {
      translationCache.set(cacheKey, JSON.stringify(mergedTranslations));
    }

    // Log missing translations for development
    if (logMissingTranslations) {
      logMissingTranslationsInConsole(primaryTranslations, fallbackTranslations, language);
    }

    return mergedTranslations;
  } catch (error) {
    console.error(`Failed to load translations for language: ${language}`, error);
    return {};
  }
}

/**
 * Loads a translation file from the locales directory
 */
async function loadTranslationFile(languageCode: string): Promise<Record<string, string>> {
  try {
    const response = await fetch(`/src/i18n/locales/${languageCode}.json`);
    if (!response.ok) {
      throw new Error(`Translation file not found: ${languageCode}.json`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Could not load translation file for: ${languageCode}`, error);
    return {};
  }
}

/**
 * Logs missing translations to console for development debugging
 */
function logMissingTranslationsInConsole(
  primaryTranslations: Record<string, string>,
  fallbackTranslations: Record<string, string>,
  language: string
): void {
  const missingKeys = Object.keys(fallbackTranslations).filter(
    key => !(key in primaryTranslations)
  );

  if (missingKeys.length > 0) {
    console.warn(`[i18n] Missing translations in ${language}:`, missingKeys);
  }
}

/**
 * Validates a language code against supported languages
 */
export function isValidLanguageCode(languageCode: string, supportedLanguages: string[]): boolean {
  return supportedLanguages.includes(languageCode);
}

/**
 * Gets the language configuration for a given language code
 */
export function getLanguageConfig(languageCode: string, languages: Language[]): Language | undefined {
  return languages.find(lang => lang.code === languageCode);
}

/**
 * Emits a custom event when language changes
 */
export function emitLanguageChangeEvent(event: LanguageChangeEvent): void {
  const customEvent = new CustomEvent('languagechange', {
    detail: event,
    bubbles: true,
    cancelable: true
  });

  window.dispatchEvent(customEvent);
}

/**
 * Listens for language change events
 */
export function onLanguageChange(callback: (event: LanguageChangeEvent) => void): () => void {
  const handler = (event: CustomEvent<LanguageChangeEvent>) => {
    callback(event.detail);
  };

  window.addEventListener('languagechange', handler as EventListener);

  // Return cleanup function
  return () => {
    window.removeEventListener('languagechange', handler as EventListener);
  };
}

/**
 * Interpolates parameters into translation strings
 * Example: "Hello {name}!" with { name: "World" } → "Hello World!"
 */
export function interpolateTranslation(
  translation: string,
  parameters: Record<string, string | number> = {}
): string {
  return Object.entries(parameters).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }, translation);
}

/**
 * Clears all cached translations (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats(): { size: number; keys: string[] } {
  // Create a simple cache implementation to get keys for debugging
  const tempCache = translationCache as any;
  const keys: string[] = [];

  // Simple iteration to get keys (assuming Map-like interface)
  try {
    for (const key in tempCache.cache || tempCache) {
      if (tempCache.has && tempCache.has(key)) {
        keys.push(key);
      }
    }
  } catch (error) {
    // Fallback if cache structure is different
    console.warn('Could not extract cache keys for debugging:', error);
  }

  return {
    size: translationCache.size(),
    keys
  };
}

/**
 * Validates translation key format (dot notation)
 */
export function isValidTranslationKey(key: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9.]*[a-zA-Z0-9]$/.test(key) && !key.includes('..');
}

/**
 * Normalizes language code to standard format
 */
export function normalizeLanguageCode(code: string): string {
  return code.toLowerCase().split('-')[0]; // Remove region codes
}

/**
 * Checks if the current environment supports the required browser APIs
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missingFeatures: string[];
} {
  const missingFeatures: string[] = [];

  if (!window.URLSearchParams) {
    missingFeatures.push('URLSearchParams');
  }

  if (!window.history.replaceState) {
    missingFeatures.push('History API');
  }

  if (!window.CustomEvent) {
    missingFeatures.push('CustomEvent');
  }

  if (!navigator.language) {
    missingFeatures.push('navigator.language');
  }

  return {
    supported: missingFeatures.length === 0,
    missingFeatures
  };
}
