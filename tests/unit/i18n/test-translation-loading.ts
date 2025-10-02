/**
 * Unit tests for translation loading utilities
 * Tests loadTranslations, caching, fallback logic, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadTranslations,
  loadTranslationFile,
  loadTranslationsWithDetailedLogging,
  loadTranslationsWithValidation,
  clearTranslationCache,
  getCacheStats,
  TranslationCacheManager
} from '../../src/i18n/utils';
import type { TranslationLoadOptions } from '../../src/i18n/types';

// Mock fetch for translation file loading
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods for testing
const mockConsoleWarn = vi.fn();
const mockConsoleError = vi.fn();
const mockConsoleGroup = vi.fn();
const mockConsoleGroupEnd = vi.fn();
const mockConsoleInfo = vi.fn();

vi.spyOn(console, 'warn').mockImplementation(mockConsoleWarn);
vi.spyOn(console, 'error').mockImplementation(mockConsoleError);
vi.spyOn(console, 'group').mockImplementation(mockConsoleGroup);
vi.spyOn(console, 'groupEnd').mockImplementation(mockConsoleGroupEnd);
vi.spyOn(console, 'info').mockImplementation(mockConsoleInfo);

describe('Translation Loading', () => {
  const mockEnglishTranslations = {
    'nav.home': 'Home',
    'nav.about': 'About',
    'auth.login': 'Login',
    'form.email': 'Email',
    'form.password': 'Password'
  };

  const mockGermanTranslations = {
    'nav.home': 'Startseite',
    'nav.about': 'Über uns',
    'auth.login': 'Anmelden',
    'form.email': 'E-Mail',
    'form.password': 'Passwort',
    'nav.contact': 'Kontakt' // Extra key not in English
  };

  const mockOptions: TranslationLoadOptions = {
    language: 'de',
    fallbackLanguage: 'en',
    cacheTranslations: true,
    logMissingTranslations: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearTranslationCache();

    // Mock successful fetch responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('en.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEnglishTranslations)
        });
      } else if (url.includes('de.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGermanTranslations)
        });
      } else {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }
    });
  });

  describe('loadTranslations', () => {
    it('should load and merge translations with fallback', async () => {
      const result = await loadTranslations(mockOptions);

      expect(result).toEqual({
        'nav.home': 'Startseite',    // German version
        'nav.about': 'Über uns',     // German version
        'auth.login': 'Anmelden',    // German version
        'form.email': 'E-Mail',      // German version
        'form.password': 'Passwort', // German version
        'nav.contact': 'Kontakt'     // Only in German, kept as-is
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenCalledWith('/src/i18n/locales/de.json');
      expect(mockFetch).toHaveBeenCalledWith('/src/i18n/locales/en.json');
    });

    it('should use cached translations on subsequent calls', async () => {
      // First call - should fetch files
      await loadTranslations(mockOptions);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second call - should use cache
      await loadTranslations(mockOptions);
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional calls
    });

    it('should handle missing translation files gracefully', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: false,
        status: 404
      }));

      const result = await loadTranslations(mockOptions);
      expect(result).toEqual({});
    });

    it('should disable caching when requested', async () => {
      const optionsWithoutCache = { ...mockOptions, cacheTranslations: false };

      await loadTranslations(optionsWithoutCache);
      await loadTranslations(optionsWithoutCache);

      expect(mockFetch).toHaveBeenCalledTimes(4); // Called twice since no caching
    });

    it('should disable logging when requested', async () => {
      const optionsWithoutLogging = { ...mockOptions, logMissingTranslations: false };

      await loadTranslations(optionsWithoutLogging);

      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('should handle same language for primary and fallback', async () => {
      const optionsSameLanguage = { ...mockOptions, language: 'en', fallbackLanguage: 'en' };

      const result = await loadTranslations(optionsSameLanguage);

      expect(result).toEqual(mockEnglishTranslations);
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one file loaded
    });
  });

  describe('loadTranslationFile', () => {
    it('should load translation file successfully', async () => {
      const result = await loadTranslationFile('en');
      expect(result).toEqual(mockEnglishTranslations);
    });

    it('should handle file not found', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: false,
        status: 404
      }));

      const result = await loadTranslationFile('nonexistent');
      expect(result).toEqual({});
      expect(mockConsoleWarn).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const result = await loadTranslationFile('en');
      expect(result).toEqual({});
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe('loadTranslationsWithDetailedLogging', () => {
    it('should return detailed loading information', async () => {
      const result = await loadTranslationsWithDetailedLogging(mockOptions);

      expect(result.translations).toEqual({
        'nav.home': 'Startseite',
        'nav.about': 'Über uns',
        'auth.login': 'Anmelden',
        'form.email': 'E-Mail',
        'form.password': 'Passwort',
        'nav.contact': 'Kontakt'
      });

      expect(result.missingKeys).toEqual([]);
      expect(result.fallbackKeys).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing translations', async () => {
      // Mock German file with missing translations
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('en.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              ...mockEnglishTranslations,
              'nav.contact': 'Contact' // Add this to English
            })
          });
        } else if (url.includes('de.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              'nav.home': 'Startseite',
              // Missing: nav.about, auth.login, form.email, form.password
            })
          });
        }
      });

      const result = await loadTranslationsWithDetailedLogging(mockOptions);

      expect(result.missingKeys).toContain('nav.about');
      expect(result.missingKeys).toContain('auth.login');
      expect(result.fallbackKeys).toHaveLength(4);
    });

    it('should handle loading errors', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const result = await loadTranslationsWithDetailedLogging(mockOptions);

      expect(result.translations).toEqual({});
      expect(result.errors).toContain('Failed to load translations for language: de');
    });

    it('should handle fallback loading errors', async () => {
      mockFetch.mockImplementation(() => Promise.resolve({
        ok: false,
        status: 500
      }));

      const result = await loadTranslationsWithDetailedLogging(mockOptions);

      expect(result.translations).toEqual({});
      expect(result.errors).toHaveLength(2); // Primary and fallback errors
    });
  });

  describe('loadTranslationsWithValidation', () => {
    it('should validate language code before loading', async () => {
      const result = await loadTranslationsWithValidation({
        ...mockOptions,
        language: 'invalid'
      });

      expect(result.validationResult.isValid).toBe(false);
      expect(result.validationResult.errors).toContain('Invalid language code format');
      expect(result.translations).toEqual({});
    });

    it('should load translations for valid language', async () => {
      const result = await loadTranslationsWithValidation(mockOptions);

      expect(result.validationResult.isValid).toBe(true);
      expect(result.validationResult.errors).toEqual([]);
      expect(result.translations).toEqual({
        'nav.home': 'Startseite',
        'nav.about': 'Über uns',
        'auth.login': 'Anmelden',
        'form.email': 'E-Mail',
        'form.password': 'Passwort',
        'nav.contact': 'Kontakt'
      });
    });

    it('should handle loading errors with validation', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const result = await loadTranslationsWithValidation(mockOptions);

      expect(result.validationResult.isValid).toBe(false);
      expect(result.validationResult.errors).toContain('Failed to load translations: Network error');
      expect(result.translations).toEqual({});
    });
  });

  describe('clearTranslationCache', () => {
    it('should clear the translation cache', async () => {
      // Load some translations to populate cache
      await loadTranslations(mockOptions);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Clear cache
      clearTranslationCache();

      // Load again - should fetch files again
      await loadTranslations(mockOptions);
      expect(mockFetch).toHaveBeenCalledTimes(4); // Called twice more
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('TranslationCacheManager', () => {
    it('should be a singleton', () => {
      const instance1 = TranslationCacheManager.getInstance();
      const instance2 = TranslationCacheManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should provide cache management methods', () => {
      const manager = TranslationCacheManager.getInstance();

      expect(manager.getCache()).toBeDefined();
      expect(manager.clearCache()).toBeUndefined();
      expect(manager.getCacheStats()).toHaveProperty('size');
    });

    it('should allow preloading translations', () => {
      const manager = TranslationCacheManager.getInstance();
      const testTranslations = { 'test.key': 'Test Value' };

      expect(() => {
        manager.preloadTranslations('test', testTranslations);
      }).not.toThrow();
    });

    it('should handle cache invalidation', () => {
      const manager = TranslationCacheManager.getInstance();

      expect(() => {
        manager.invalidateLanguage('test');
      }).not.toThrow();
    });
  });
});
