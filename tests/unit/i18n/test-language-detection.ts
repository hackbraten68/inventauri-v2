/**
 * Unit tests for language detection utilities
 * Tests the detectLanguage, isValidLanguageCode, and related functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectLanguage,
  isValidLanguageCode,
  getLanguageConfig,
  normalizeLanguageCode,
  checkBrowserSupport,
  detectLanguageWithValidation,
  updateLanguageInUrlWithValidation
} from '../../src/i18n/utils';
import type { Language, LanguageDetectionOptions } from '../../src/i18n/types';

// Mock window.location for URL parameter testing
const mockLocation = (search: string) => {
  Object.defineProperty(window, 'location', {
    value: { search },
    writable: true
  });
};

// Mock navigator.language for browser language detection
const mockNavigatorLanguage = (language: string) => {
  Object.defineProperty(navigator, 'language', {
    value: language,
    writable: true
  });
};

describe('Language Detection Utilities', () => {
  const mockSupportedLanguages = ['en', 'de', 'fr'];
  const mockDefaultLanguage = 'en';

  const mockOptions: LanguageDetectionOptions = {
    supportedLanguages: mockSupportedLanguages,
    defaultLanguage: mockDefaultLanguage,
    fallbackToBrowserLanguage: true
  };

  const mockLanguages: Language[] = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flagIcon: '🇺🇸',
      isDefault: true,
      isActive: true,
      textDirection: 'ltr'
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flagIcon: '🇩🇪',
      isDefault: false,
      isActive: true,
      textDirection: 'ltr'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Reset window.location
    mockLocation('');

    // Reset navigator.language
    mockNavigatorLanguage('en-US');
  });

  describe('detectLanguage', () => {
    it('should detect language from URL parameter', () => {
      mockLocation('?lang=de');

      const result = detectLanguage(mockOptions);
      expect(result).toBe('de');
    });

    it('should fall back to browser language when enabled', () => {
      mockLocation('');
      mockNavigatorLanguage('de-DE');

      const result = detectLanguage(mockOptions);
      expect(result).toBe('de');
    });

    it('should return default language when URL param not supported', () => {
      mockLocation('?lang=invalid');

      const result = detectLanguage(mockOptions);
      expect(result).toBe('en');
    });

    it('should return default language when browser language not supported', () => {
      mockLocation('');
      mockNavigatorLanguage('es-ES');

      const result = detectLanguage(mockOptions);
      expect(result).toBe('en');
    });

    it('should return default language when fallback disabled', () => {
      mockLocation('');
      mockNavigatorLanguage('de-DE');

      const optionsWithoutFallback = {
        ...mockOptions,
        fallbackToBrowserLanguage: false
      };

      const result = detectLanguage(optionsWithoutFallback);
      expect(result).toBe('en');
    });

    it('should handle complex URL parameters', () => {
      mockLocation('?lang=de&other=value');

      const result = detectLanguage(mockOptions);
      expect(result).toBe('de');
    });
  });

  describe('isValidLanguageCode', () => {
    it('should validate supported language codes', () => {
      expect(isValidLanguageCode('en', mockSupportedLanguages)).toBe(true);
      expect(isValidLanguageCode('de', mockSupportedLanguages)).toBe(true);
      expect(isValidLanguageCode('fr', mockSupportedLanguages)).toBe(true);
    });

    it('should reject unsupported language codes', () => {
      expect(isValidLanguageCode('es', mockSupportedLanguages)).toBe(false);
      expect(isValidLanguageCode('invalid', mockSupportedLanguages)).toBe(false);
      expect(isValidLanguageCode('', mockSupportedLanguages)).toBe(false);
    });

    it('should handle empty supported languages array', () => {
      expect(isValidLanguageCode('en', [])).toBe(false);
    });
  });

  describe('getLanguageConfig', () => {
    it('should return language config for valid code', () => {
      const result = getLanguageConfig('de', mockLanguages);
      expect(result).toEqual(mockLanguages[1]);
    });

    it('should return undefined for invalid code', () => {
      const result = getLanguageConfig('invalid', mockLanguages);
      expect(result).toBeUndefined();
    });

    it('should handle empty languages array', () => {
      const result = getLanguageConfig('en', []);
      expect(result).toBeUndefined();
    });
  });

  describe('normalizeLanguageCode', () => {
    it('should normalize language codes to lowercase', () => {
      expect(normalizeLanguageCode('DE')).toBe('de');
      expect(normalizeLanguageCode('en-US')).toBe('en');
      expect(normalizeLanguageCode('FR-CA')).toBe('fr');
    });

    it('should handle already normalized codes', () => {
      expect(normalizeLanguageCode('de')).toBe('de');
      expect(normalizeLanguageCode('en')).toBe('en');
    });

    it('should handle empty strings', () => {
      expect(normalizeLanguageCode('')).toBe('');
    });
  });

  describe('checkBrowserSupport', () => {
    it('should detect supported browser features', () => {
      const support = checkBrowserSupport();
      expect(support.supported).toBe(true);
      expect(support.missingFeatures).toEqual([]);
    });

    it('should detect missing URLSearchParams', () => {
      // Mock missing URLSearchParams
      const originalURLSearchParams = window.URLSearchParams;
      delete (window as any).URLSearchParams;

      const support = checkBrowserSupport();
      expect(support.supported).toBe(false);
      expect(support.missingFeatures).toContain('URLSearchParams');

      // Restore
      window.URLSearchParams = originalURLSearchParams;
    });

    it('should detect missing History API', () => {
      // Mock missing history.replaceState
      const originalReplaceState = window.history.replaceState;
      delete (window.history as any).replaceState;

      const support = checkBrowserSupport();
      expect(support.supported).toBe(false);
      expect(support.missingFeatures).toContain('History API');

      // Restore
      window.history.replaceState = originalReplaceState;
    });
  });

  describe('detectLanguageWithValidation', () => {
    it('should return valid detection with validation', () => {
      mockLocation('?lang=de');

      const result = detectLanguageWithValidation(mockOptions);
      expect(result.detectedLanguage).toBe('de');
      expect(result.validationResult.isValid).toBe(true);
      expect(result.validationResult.errors).toEqual([]);
    });

    it('should return invalid validation for unsupported language', () => {
      mockLocation('?lang=invalid');

      const result = detectLanguageWithValidation(mockOptions);
      expect(result.detectedLanguage).toBe('en'); // Falls back to default
      expect(result.validationResult.isValid).toBe(true); // Default is valid
    });
  });

  describe('updateLanguageInUrlWithValidation', () => {
    beforeEach(() => {
      // Mock window.history.replaceState
      vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    });

    it('should successfully update URL with valid language', () => {
      const result = updateLanguageInUrlWithValidation('de', mockSupportedLanguages);
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail with invalid language code', () => {
      const result = updateLanguageInUrlWithValidation('invalid', mockSupportedLanguages);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("Language code 'invalid' is not supported");
    });

    it('should handle history API errors', () => {
      // Mock history.replaceState to throw
      vi.spyOn(window.history, 'replaceState').mockImplementation(() => {
        throw new Error('History API error');
      });

      const result = updateLanguageInUrlWithValidation('de', mockSupportedLanguages);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Failed to update URL: History API error');
    });
  });
});
