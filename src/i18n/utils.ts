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
import {
  LanguageValidation,
  TranslationKeyValidation,
  TranslationValueValidation
} from './types';

/**
 * Enhanced translation cache with performance optimizations
 */
class EnhancedTranslationCache implements TranslationCache {
  private cache = new Map<string, string>();
  private accessTimes = new Map<string, number>();
  private maxSize = 100; // Maximum number of cached translations
  private ttl = 3600000; // Time to live: 1 hour in milliseconds

  get(key: string): string | undefined {
    const cached = this.cache.get(key);
    if (cached) {
      this.accessTimes.set(key, Date.now());
      return cached;
    }
    return undefined;
  }

  set(key: string, value: string): void {
    // If cache is full, remove least recently used item
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, value);
    this.accessTimes.set(key, Date.now());
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;

    // Check if cache entry has expired
    const accessTime = this.accessTimes.get(key);
    if (accessTime && Date.now() - accessTime > this.ttl) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
    this.accessTimes.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, time] of this.accessTimes.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
    }
  }

  // Get cache statistics for performance monitoring
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    averageAge: number;
  } {
    const now = Date.now();
    let totalAge = 0;
    let validEntries = 0;

    for (const [key, time] of this.accessTimes.entries()) {
      if (this.cache.has(key)) {
        totalAge += now - time;
        validEntries++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: validEntries / Math.max(this.accessTimes.size, 1),
      averageAge: validEntries > 0 ? totalAge / validEntries : 0
    };
  }
}

// Global translation cache instance with performance optimizations
export const translationCache = new EnhancedTranslationCache();

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
const translationModules = import.meta.glob('./locales/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, Record<string, string>>;

async function loadTranslationFile(languageCode: string): Promise<Record<string, string>> {
  const moduleKey = `./locales/${languageCode}.json`;

  if (moduleKey in translationModules) {
    return translationModules[moduleKey];
  }

  try {
    const dynamicModule = await import(`./locales/${languageCode}.json`);
    const translations = (dynamicModule as { default?: Record<string, string> }).default ?? dynamicModule;
    translationModules[moduleKey] = translations;
    return translations;
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

    // Group missing keys by category for better debugging
    const missingByCategory: Record<string, string[]> = {};
    missingKeys.forEach(key => {
      const category = key.split('.')[0] || 'general';
      if (!missingByCategory[category]) {
        missingByCategory[category] = [];
      }
      missingByCategory[category].push(key);
    });

    // Log detailed breakdown
    console.group(`[i18n] Missing translations breakdown for ${language}:`);
    Object.entries(missingByCategory).forEach(([category, keys]) => {
      console.log(`${category}:`, keys);
    });
    console.groupEnd();

    // Log suggestions for adding missing translations
    console.info(`[i18n] To fix missing translations in ${language}:`);
    console.info(`1. Add the missing keys to src/i18n/locales/${language}.json`);
    console.info(`2. Or update the fallback translations in src/i18n/locales/en.json`);
    console.info(`3. Check the translation files for syntax errors`);
  }
}

/**
 * Enhanced translation loading with detailed logging
 */
export async function loadTranslationsWithDetailedLogging(options: TranslationLoadOptions): Promise<{
  translations: Record<string, string>;
  missingKeys: string[];
  fallbackKeys: string[];
  errors: string[];
}> {
  const { language, fallbackLanguage = 'en', cacheTranslations = true, logMissingTranslations = true } = options;

  const missingKeys: string[] = [];
  const fallbackKeys: string[] = [];
  const errors: string[] = [];

  // Check cache first
  const cacheKey = `translations_${language}`;
  if (cacheTranslations && translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        translations: parsed,
        missingKeys: [],
        fallbackKeys: [],
        errors: []
      };
    }
  }

  try {
    // Load primary language translations
    const primaryTranslations = await loadTranslationFile(language);

    // Load fallback translations (usually English)
    const fallbackTranslations = fallbackLanguage !== language
      ? await loadTranslationFile(fallbackLanguage)
      : {};

    // Merge translations with fallback support and track missing keys
    const mergedTranslations: Record<string, string> = {};

    // Process all keys from fallback (primary source of truth)
    Object.keys(fallbackTranslations).forEach(key => {
      if (key in primaryTranslations) {
        mergedTranslations[key] = primaryTranslations[key];
      } else {
        // Use fallback translation
        mergedTranslations[key] = fallbackTranslations[key];
        missingKeys.push(key);
        fallbackKeys.push(key);
      }
    });

    // Add any keys that exist only in primary language
    Object.keys(primaryTranslations).forEach(key => {
      if (!(key in fallbackTranslations)) {
        mergedTranslations[key] = primaryTranslations[key];
        console.warn(`[i18n] Key '${key}' exists in ${language} but not in fallback language ${fallbackLanguage}`);
      }
    });

    // Cache the merged translations
    if (cacheTranslations) {
      translationCache.set(cacheKey, JSON.stringify(mergedTranslations));
    }

    // Enhanced logging for missing translations
    if (logMissingTranslations && missingKeys.length > 0) {
      logMissingTranslationsInConsole(primaryTranslations, fallbackTranslations, language);
    }

    return {
      translations: mergedTranslations,
      missingKeys,
      fallbackKeys,
      errors
    };
  } catch (error) {
    const errorMessage = `Failed to load translations for language: ${language}`;
    console.error(errorMessage, error);
    errors.push(errorMessage);

    // Try to return fallback translations even if primary fails
    try {
      const fallbackTranslations = await loadTranslationFile(fallbackLanguage);
      return {
        translations: fallbackTranslations,
        missingKeys: Object.keys(fallbackTranslations),
        fallbackKeys: Object.keys(fallbackTranslations),
        errors: [errorMessage]
      };
    } catch (fallbackError) {
      console.error(`Failed to load fallback translations for: ${fallbackLanguage}`, fallbackError);
      return {
        translations: {},
        missingKeys: [],
        fallbackKeys: [],
        errors: [errorMessage, `Fallback loading also failed: ${fallbackError}`]
      };
    }
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

/**
 * Enhanced language detection with validation
 */
export function detectLanguageWithValidation(options: LanguageDetectionOptions): {
  detectedLanguage: string;
  validationResult: { isValid: boolean; errors: string[] };
} {
  const detectedLanguage = detectLanguage(options);

  // Validate the detected language
  const validationResult = LanguageValidation.validateLanguage({
    code: detectedLanguage,
    name: '', // We don't have name here, but validation will check code format
    nativeName: '',
    flagIcon: '',
    isDefault: false,
    isActive: true,
    textDirection: 'ltr'
  });

  return {
    detectedLanguage,
    validationResult
  };
}

/**
 * Enhanced URL parameter management with validation
 */
export function updateLanguageInUrlWithValidation(
  languageCode: string,
  supportedLanguages: string[]
): { success: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate language code
  if (!isValidLanguageCode(languageCode, supportedLanguages)) {
    errors.push(`Language code '${languageCode}' is not supported`);
    return { success: false, errors };
  }

  try {
    updateLanguageInUrl(languageCode);
    return { success: true, errors: [] };
  } catch (error) {
    errors.push(`Failed to update URL: ${error}`);
    return { success: false, errors };
  }
}

/**
 * Enhanced translation loading with validation and caching
 */
export async function loadTranslationsWithValidation(options: TranslationLoadOptions): Promise<{
  translations: Record<string, string>;
  validationResult: { isValid: boolean; errors: string[] };
  cacheStats: { size: number; keys: string[] };
}> {
  const { language, fallbackLanguage = 'en', cacheTranslations = true, logMissingTranslations = true } = options;

  // Validate language code
  const supportedLanguages = ['en', 'de']; // This should come from config
  const validationResult = LanguageValidation.validateLanguage({
    code: language,
    name: '',
    nativeName: '',
    flagIcon: '',
    isDefault: false,
    isActive: true,
    textDirection: 'ltr'
  });

  if (!validationResult.isValid) {
    return {
      translations: {},
      validationResult,
      cacheStats: getCacheStats()
    };
  }

  try {
    const translations = await loadTranslations(options);
    const cacheStats = getCacheStats();

    return {
      translations,
      validationResult: { isValid: true, errors: [] },
      cacheStats
    };
  } catch (error) {
    return {
      translations: {},
      validationResult: {
        isValid: false,
        errors: [`Failed to load translations: ${error}`]
      },
      cacheStats: getCacheStats()
    };
  }
}

/**
 * Translation cache management utilities
 */
export class TranslationCacheManager {
  private static instance: TranslationCacheManager;
  private cache: TranslationCache;

  private constructor() {
    this.cache = translationCache;
  }

  static getInstance(): TranslationCacheManager {
    if (!TranslationCacheManager.instance) {
      TranslationCacheManager.instance = new TranslationCacheManager();
    }
    return TranslationCacheManager.instance;
  }

  getCache(): TranslationCache {
    return this.cache;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size(),
      keys: [] // Simplified for now
    };
  }

  preloadTranslations(language: string, translations: Record<string, string>): void {
    const cacheKey = `translations_${language}`;
    this.cache.set(cacheKey, JSON.stringify(translations));
  }

  invalidateLanguage(language: string): void {
    const cacheKey = `translations_${language}`;
    // Remove from cache if it exists
    // This is a simplified implementation
  }
}
