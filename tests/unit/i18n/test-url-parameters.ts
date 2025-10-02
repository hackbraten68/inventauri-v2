/**
 * Unit tests for URL parameter management utilities
 * Tests updateLanguageInUrl, URL parsing, and parameter validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  updateLanguageInUrl,
  interpolateTranslation,
  isValidTranslationKey,
  normalizeLanguageCode,
  emitLanguageChangeEvent,
  onLanguageChange,
  checkBrowserSupport
} from '../../src/i18n/utils';
import type { LanguageChangeEvent } from '../../src/i18n/types';

describe('URL Parameter Management', () => {
  beforeEach(() => {
    // Mock window.history.replaceState
    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    // Reset URL for each test
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:4321/' },
      writable: true
    });
  });

  describe('updateLanguageInUrl', () => {
    it('should add language parameter for non-default languages', () => {
      const testUrl = 'http://localhost:4321/dashboard';
      Object.defineProperty(window, 'location', {
        value: { href: testUrl },
        writable: true
      });

      updateLanguageInUrl('de');

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:4321/dashboard?lang=de');
    });

    it('should remove language parameter for default language', () => {
      const testUrl = 'http://localhost:4321/dashboard?lang=de&other=value';
      Object.defineProperty(window, 'location', {
        value: { href: testUrl },
        writable: true
      });

      updateLanguageInUrl('en');

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:4321/dashboard?other=value');
    });

    it('should handle URLs without existing parameters', () => {
      const testUrl = 'http://localhost:4321/';
      Object.defineProperty(window, 'location', {
        value: { href: testUrl },
        writable: true
      });

      updateLanguageInUrl('de');

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:4321/?lang=de');
    });

    it('should handle URLs with existing parameters', () => {
      const testUrl = 'http://localhost:4321/page?existing=value';
      Object.defineProperty(window, 'location', {
        value: { href: testUrl },
        writable: true
      });

      updateLanguageInUrl('de');

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:4321/page?existing=value&lang=de');
    });

    it('should handle hash fragments', () => {
      const testUrl = 'http://localhost:4321/page#section';
      Object.defineProperty(window, 'location', {
        value: { href: testUrl },
        writable: true
      });

      updateLanguageInUrl('de');

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:4321/page?lang=de#section');
    });

    it('should handle complex URLs', () => {
      const testUrl = 'http://localhost:4321/path/to/page?param1=value1&param2=value2#hash';
      Object.defineProperty(window, 'location', {
        value: { href: testUrl },
        writable: true
      });

      updateLanguageInUrl('fr');

      expect(window.history.replaceState).toHaveBeenCalledWith({}, '', 'http://localhost:4321/path/to/page?param1=value1&param2=value2&lang=fr#hash');
    });
  });

  describe('interpolateTranslation', () => {
    it('should interpolate single parameters', () => {
      const translation = 'Hello {name}!';
      const params = { name: 'World' };

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('Hello World!');
    });

    it('should interpolate multiple parameters', () => {
      const translation = 'Hello {firstName} {lastName}! You have {count} messages.';
      const params = { firstName: 'John', lastName: 'Doe', count: 5 };

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('Hello John Doe! You have 5 messages.');
    });

    it('should handle numeric parameters', () => {
      const translation = 'You have {count} items in your cart.';
      const params = { count: 42 };

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('You have 42 items in your cart.');
    });

    it('should handle missing parameters', () => {
      const translation = 'Hello {name}!';
      const params = {};

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('Hello {name}!'); // Unchanged if parameter missing
    });

    it('should handle empty parameters object', () => {
      const translation = 'Hello World!';
      const params = {};

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('Hello World!');
    });

    it('should handle multiple occurrences of same parameter', () => {
      const translation = '{name} said "{name} is awesome!"';
      const params = { name: 'Alice' };

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('Alice said "Alice is awesome!"');
    });

    it('should handle special characters in parameters', () => {
      const translation = 'Path: {path}';
      const params = { path: '/user/123/profile' };

      const result = interpolateTranslation(translation, params);
      expect(result).toBe('Path: /user/123/profile');
    });
  });

  describe('isValidTranslationKey', () => {
    it('should validate correct translation keys', () => {
      expect(isValidTranslationKey('nav.home')).toBe(true);
      expect(isValidTranslationKey('auth.login')).toBe(true);
      expect(isValidTranslationKey('form.email.label')).toBe(true);
      expect(isValidTranslationKey('dashboard.stats.total')).toBe(true);
    });

    it('should reject invalid translation keys', () => {
      expect(isValidTranslationKey('')).toBe(false);
      expect(isValidTranslationKey('nav..home')).toBe(false); // Double dots
      expect(isValidTranslationKey('.nav.home')).toBe(false); // Starts with dot
      expect(isValidTranslationKey('nav.home.')).toBe(false); // Ends with dot
      expect(isValidTranslationKey('Nav.Home')).toBe(false); // Uppercase letters
      expect(isValidTranslationKey('nav-home')).toBe(false); // Hyphens
      expect(isValidTranslationKey('nav home')).toBe(false); // Spaces
    });

    it('should validate single word keys', () => {
      expect(isValidTranslationKey('home')).toBe(true);
      expect(isValidTranslationKey('login')).toBe(true);
      expect(isValidTranslationKey('save')).toBe(true);
    });

    it('should validate keys with numbers', () => {
      expect(isValidTranslationKey('item1')).toBe(true);
      expect(isValidTranslationKey('nav.item.1')).toBe(true);
      expect(isValidTranslationKey('step2.name')).toBe(true);
    });
  });

  describe('normalizeLanguageCode', () => {
    it('should normalize various language code formats', () => {
      expect(normalizeLanguageCode('en-US')).toBe('en');
      expect(normalizeLanguageCode('de-DE')).toBe('de');
      expect(normalizeLanguageCode('fr-CA')).toBe('fr');
      expect(normalizeLanguageCode('zh-CN')).toBe('zh');
      expect(normalizeLanguageCode('pt-BR')).toBe('pt');
    });

    it('should handle already normalized codes', () => {
      expect(normalizeLanguageCode('en')).toBe('en');
      expect(normalizeLanguageCode('de')).toBe('de');
      expect(normalizeLanguageCode('fr')).toBe('fr');
    });

    it('should handle case variations', () => {
      expect(normalizeLanguageCode('EN')).toBe('en');
      expect(normalizeLanguageCode('DE')).toBe('de');
      expect(normalizeLanguageCode('FR')).toBe('fr');
    });

    it('should handle edge cases', () => {
      expect(normalizeLanguageCode('')).toBe('');
      expect(normalizeLanguageCode('x')).toBe('x');
      expect(normalizeLanguageCode('us')).toBe('us');
    });
  });

  describe('emitLanguageChangeEvent', () => {
    it('should emit custom language change event', () => {
      const mockEvent: LanguageChangeEvent = {
        previousLanguage: 'en',
        newLanguage: 'de',
        timestamp: new Date(),
        source: 'user'
      };

      const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');
      const mockCustomEvent = vi.fn();

      // Mock CustomEvent constructor
      global.CustomEvent = mockCustomEvent;

      emitLanguageChangeEvent(mockEvent);

      expect(mockCustomEvent).toHaveBeenCalledWith('languagechange', {
        detail: mockEvent,
        bubbles: true,
        cancelable: true
      });
      expect(mockDispatchEvent).toHaveBeenCalled();
    });
  });

  describe('onLanguageChange', () => {
    it('should register event listener and return cleanup function', () => {
      const mockCallback = vi.fn();
      const mockAddEventListener = vi.spyOn(window, 'addEventListener');
      const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      const cleanup = onLanguageChange(mockCallback);

      // Check that listener was registered
      expect(mockAddEventListener).toHaveBeenCalledWith('languagechange', expect.any(Function), undefined);

      // Test cleanup function
      cleanup();
      expect(mockRemoveEventListener).toHaveBeenCalled();
    });

    it('should call callback when language change event is dispatched', () => {
      const mockCallback = vi.fn();
      const mockEvent: LanguageChangeEvent = {
        previousLanguage: 'en',
        newLanguage: 'de',
        timestamp: new Date(),
        source: 'user'
      };

      onLanguageChange(mockCallback);

      // Dispatch the event
      const event = new CustomEvent('languagechange', {
        detail: mockEvent,
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('checkBrowserSupport', () => {
    it('should return supported status for modern browsers', () => {
      const support = checkBrowserSupport();
      expect(support.supported).toBe(true);
      expect(support.missingFeatures).toEqual([]);
    });

    it('should detect missing URLSearchParams', () => {
      const originalURLSearchParams = window.URLSearchParams;
      delete (window as any).URLSearchParams;

      const support = checkBrowserSupport();
      expect(support.supported).toBe(false);
      expect(support.missingFeatures).toContain('URLSearchParams');

      // Restore
      window.URLSearchParams = originalURLSearchParams;
    });

    it('should detect missing History API', () => {
      const originalReplaceState = window.history.replaceState;
      delete (window.history as any).replaceState;

      const support = checkBrowserSupport();
      expect(support.supported).toBe(false);
      expect(support.missingFeatures).toContain('History API');

      // Restore
      window.history.replaceState = originalReplaceState;
    });

    it('should detect missing CustomEvent', () => {
      const originalCustomEvent = window.CustomEvent;
      delete (window as any).CustomEvent;

      const support = checkBrowserSupport();
      expect(support.supported).toBe(false);
      expect(support.missingFeatures).toContain('CustomEvent');

      // Restore
      window.CustomEvent = originalCustomEvent;
    });

    it('should detect missing navigator.language', () => {
      const originalLanguage = navigator.language;
      delete (navigator as any).language;

      const support = checkBrowserSupport();
      expect(support.supported).toBe(false);
      expect(support.missingFeatures).toContain('navigator.language');

      // Restore
      navigator.language = originalLanguage;
    });
  });
});
