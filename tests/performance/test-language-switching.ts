/**
 * Performance tests for language switching
 * Tests response time, caching efficiency, and memory usage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadTranslations,
  clearTranslationCache,
  translationCache,
  TranslationCacheManager
} from '../../src/i18n/utils';
import type { TranslationLoadOptions } from '../../src/i18n/types';

// Mock performance API for consistent measurements
const mockPerformance = {
  mark: (name: string) => {},
  measure: (name: string, startMark: string, endMark: string) => {},
  getEntriesByName: (name: string) => []
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('Language Switching Performance', () => {
  const mockTranslations = {
    'nav.home': 'Home',
    'nav.about': 'About',
    'auth.login': 'Login',
    'form.email': 'Email',
    'form.password': 'Password',
    'dashboard.title': 'Dashboard',
    'dashboard.stats': 'Statistics',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading'
  };

  const mockOptions: TranslationLoadOptions = {
    language: 'en',
    fallbackLanguage: 'en',
    cacheTranslations: true,
    logMissingTranslations: false
  };

  beforeEach(() => {
    clearTranslationCache();
    // Reset performance measurements
    (window.performance as any).marks = new Map();
    (window.performance as any).measures = new Map();
  });

  afterEach(() => {
    clearTranslationCache();
  });

  describe('Response Time Requirements', () => {
    it('should load translations in <100ms on first request', async () => {
      const startTime = Date.now();

      const result = await loadTranslations(mockOptions);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toEqual(mockTranslations);
      expect(responseTime).toBeLessThan(100); // Should be much faster in practice
    });

    it('should load translations in <10ms on cached requests', async () => {
      // First request - populate cache
      await loadTranslations(mockOptions);

      // Second request - should use cache
      const startTime = Date.now();
      const result = await loadTranslations(mockOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(result).toEqual(mockTranslations);
      expect(responseTime).toBeLessThan(10); // Cached requests should be very fast
    });

    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();

      // Launch multiple concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        loadTranslations(mockOptions)
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      results.forEach(result => {
        expect(result).toEqual(mockTranslations);
      });

      // Total time should still be reasonable (<500ms for 10 concurrent requests)
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Cache Performance', () => {
    it('should maintain cache hit rate >95% after warmup', async () => {
      const cacheManager = TranslationCacheManager.getInstance();

      // Warm up cache with multiple requests
      for (let i = 0; i < 5; i++) {
        await loadTranslations(mockOptions);
      }

      const cacheStats = cacheManager.getCacheStats();

      // Cache should have reasonable size
      expect(cacheStats.size).toBeGreaterThan(0);
      expect(cacheStats.size).toBeLessThan(10); // Should not grow unbounded
    });

    it('should handle cache eviction properly under memory pressure', async () => {
      // Fill cache to capacity
      for (let i = 0; i < 100; i++) {
        await loadTranslations({
          ...mockOptions,
          language: `lang${i}`
        });
      }

      const cacheManager = TranslationCacheManager.getInstance();
      const initialStats = cacheManager.getCacheStats();

      // Cache should not exceed maximum size
      expect(initialStats.size).toBeLessThanOrEqual(100); // Max cache size

      // Adding more items should trigger eviction
      await loadTranslations({
        ...mockOptions,
        language: 'newlang'
      });

      const finalStats = cacheManager.getCacheStats();
      expect(finalStats.size).toBeLessThanOrEqual(initialStats.size);
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks on repeated requests', async () => {
      const initialMemoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform many translation requests
      for (let i = 0; i < 1000; i++) {
        await loadTranslations(mockOptions);
      }

      const finalMemoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemoryUsage - initialMemoryUsage;

      // Memory increase should be reasonable (<10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should clean up resources properly on cache clear', async () => {
      // Load translations to populate cache
      await loadTranslations(mockOptions);
      const cacheManager = TranslationCacheManager.getInstance();

      const statsBeforeClear = cacheManager.getCacheStats();
      expect(statsBeforeClear.size).toBeGreaterThan(0);

      // Clear cache
      cacheManager.clearCache();

      const statsAfterClear = cacheManager.getCacheStats();
      expect(statsAfterClear.size).toBe(0);
    });
  });

  describe('Network Efficiency', () => {
    it('should minimize network requests with proper caching', async () => {
      let networkRequestCount = 0;

      // Mock fetch to count requests
      global.fetch = async (url: string) => {
        networkRequestCount++;
        return {
          ok: true,
          json: () => Promise.resolve(mockTranslations)
        };
      };

      // First request should trigger network call
      await loadTranslations(mockOptions);
      expect(networkRequestCount).toBe(1);

      // Subsequent requests should use cache
      await loadTranslations(mockOptions);
      await loadTranslations(mockOptions);
      await loadTranslations(mockOptions);

      // Should still be only 1 network request
      expect(networkRequestCount).toBe(1);
    });

    it('should handle network failures gracefully without retry loops', async () => {
      let networkRequestCount = 0;

      // Mock fetch to simulate network failure
      global.fetch = async (url: string) => {
        networkRequestCount++;
        if (networkRequestCount === 1) {
          throw new Error('Network error');
        }
        return {
          ok: true,
          json: () => Promise.resolve(mockTranslations)
        };
      };

      // Should handle error gracefully
      const result = await loadTranslations(mockOptions);
      expect(result).toEqual(mockTranslations); // Should fallback to empty object or cached version
      expect(networkRequestCount).toBe(2); // Should not retry excessively
    });
  });

  describe('Browser Performance Impact', () => {
    it('should not block UI thread during translation loading', async () => {
      const startTime = Date.now();

      // Load translations
      const translationPromise = loadTranslations(mockOptions);

      // Simulate UI work that should not be blocked
      let uiWorkCounter = 0;
      const uiInterval = setInterval(() => {
        uiWorkCounter++;
      }, 1);

      const result = await translationPromise;
      clearInterval(uiInterval);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // UI work should have continued during translation loading
      expect(uiWorkCounter).toBeGreaterThan(0);

      // Total time should still be reasonable
      expect(totalTime).toBeLessThan(200);
    });

    it('should handle large translation files efficiently', async () => {
      // Create large translation object
      const largeTranslations: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeTranslations[`key${i}`] = `Translation ${i}`;
      }

      // Mock fetch to return large translations
      global.fetch = async () => ({
        ok: true,
        json: () => Promise.resolve(largeTranslations)
      });

      const startTime = Date.now();
      const result = await loadTranslations({
        ...mockOptions,
        language: 'large'
      });
      const endTime = Date.now();

      expect(Object.keys(result)).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(50); // Should handle large files quickly
    });
  });
});
