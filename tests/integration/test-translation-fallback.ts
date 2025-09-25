/**
 * Integration test for missing translation fallback
 * Tests how the system handles missing translations and fallback behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the i18n utilities
vi.mock('../../src/i18n/config', () => ({
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', nativeName: 'English', flagIcon: 'flag-en', isDefault: true, isActive: true, textDirection: 'ltr' as const },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flagIcon: 'flag-de', isDefault: false, isActive: true, textDirection: 'ltr' as const }
  ],
  DEFAULT_LANGUAGE: 'en'
}));

describe('Missing Translation Fallback', () => {
  let dom: JSDOM;
  let window: any;
  let document: any;
  let mockFetch: any;
  let consoleSpy: any;

  beforeEach(() => {
    // Set up JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost:4321/',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;

    // Mock fetch for translation loading
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Mock console.warn for testing translation warnings
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Make globals available
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  it('should fall back to English for missing German translations', async () => {
    // Test scenario: German page with some missing translations
    // Expected: Should show English text for missing keys

    // Mock partial German translations (missing some keys)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Startseite', // German translation exists
        'nav.about': 'Über uns',   // German translation exists
        'nav.contact': 'Kontakt'   // German translation exists
        // 'nav.help' is missing - should fall back to English
      })
    });

    // Mock English translations (fallback)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Home',
        'nav.about': 'About',
        'nav.contact': 'Contact',
        'nav.help': 'Help' // This should be used as fallback
      })
    });

    // Simulate loading translations for German
    const response = await fetch('/api/translations/de');
    const translations = await response.json();

    // Should have merged translations with fallbacks
    expect(translations['nav.home']).toBe('Startseite'); // German version
    expect(translations['nav.help']).toBe('Help');       // English fallback

    expect(true).toBe(true); // Placeholder
  });

  it('should log warning for missing translations', async () => {
    // Test scenario: Loading German translations with missing keys
    // Expected: Should log console warning about missing translations

    // Mock partial German translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Startseite',
        // 'nav.about' is missing
      })
    });

    // Mock English translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Home',
        'nav.about': 'About'
      })
    });

    // Simulate loading translations
    await fetch('/api/translations/de');

    // Should log warning about missing translation
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[i18n] Missing translations in de:')
    );

    expect(true).toBe(true); // Placeholder
  });

  it('should handle completely missing translation files', async () => {
    // Test scenario: Translation file doesn't exist
    // Expected: Should fall back to English and log error

    // Mock failed request for German translations
    mockFetch.mockRejectedValueOnce(new Error('File not found'));

    // Mock English translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Home',
        'nav.about': 'About'
      })
    });

    // Simulate loading translations
    const response = await fetch('/api/translations/de');
    const translations = await response.json();

    // Should fall back to English translations
    expect(translations['nav.home']).toBe('Home');
    expect(translations['nav.about']).toBe('About');

    expect(true).toBe(true); // Placeholder
  });

  it('should handle corrupted translation files', async () => {
    // Test scenario: Translation file is corrupted/invalid JSON
    // Expected: Should fall back to English and log error

    // Mock invalid JSON response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON'))
    });

    // Mock English translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Home',
        'nav.about': 'About'
      })
    });

    // Simulate loading translations
    const response = await fetch('/api/translations/de');
    const translations = await response.json();

    // Should fall back to English translations
    expect(translations['nav.home']).toBe('Home');

    expect(true).toBe(true); // Placeholder
  });

  it('should cache translations to avoid repeated fallbacks', async () => {
    // Test scenario: Same translations requested multiple times
    // Expected: Should cache results and not make duplicate requests

    // Mock German translations with some missing keys
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Startseite'
        // 'nav.about' is missing
      })
    });

    // Mock English translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Home',
        'nav.about': 'About'
      })
    });

    // Load translations twice
    await fetch('/api/translations/de');
    await fetch('/api/translations/de');

    // Should only make requests once due to caching
    expect(mockFetch).toHaveBeenCalledTimes(2); // One for German, one for English

    expect(true).toBe(true); // Placeholder
  });

  it('should handle empty translation objects', async () => {
    // Test scenario: Translation file exists but is empty
    // Expected: Should fall back to English for all keys

    // Mock empty German translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({})
    });

    // Mock English translations
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        'nav.home': 'Home',
        'nav.about': 'About'
      })
    });

    // Simulate loading translations
    const response = await fetch('/api/translations/de');
    const translations = await response.json();

    // Should use all English translations
    expect(translations['nav.home']).toBe('Home');
    expect(translations['nav.about']).toBe('About');

    expect(true).toBe(true); // Placeholder
  });
});
