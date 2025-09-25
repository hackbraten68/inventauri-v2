import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for theme utility functions
 * Tests the core theme logic in isolation
 */

describe('Theme Utilities', () => {
  beforeEach(() => {
    // Mock document.documentElement for DOM manipulation
    vi.spyOn(document, 'documentElement', 'get').mockReturnValue({
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn(),
      }
    } as any);

    // Mock window.matchMedia for system theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('getSystemTheme', () => {
    it('should return light theme when system preference is light', async () => {
      const mockMatchMedia = window.matchMedia as any;
      mockMatchMedia.mockReturnValue({
        matches: false, // false = light theme
        media: '(prefers-color-scheme: dark)',
      });

      const { getSystemTheme } = await import('../../src/lib/theme');
      expect(getSystemTheme()).toBe('light');
    });

    it('should return dark theme when system preference is dark', async () => {
      const mockMatchMedia = window.matchMedia as any;
      mockMatchMedia.mockReturnValue({
        matches: true, // true = dark theme
        media: '(prefers-color-scheme: dark)',
      });

      const { getSystemTheme } = await import('../../src/lib/theme');
      expect(getSystemTheme()).toBe('dark');
    });

    it('should return light theme in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { getSystemTheme } = await import('../../src/lib/theme');
      expect(getSystemTheme()).toBe('light');

      global.window = originalWindow;
    });
  });

  describe('applyTheme', () => {
    it('should add dark class when applying dark theme', async () => {
      const { applyTheme } = await import('../../src/lib/theme');
      const mockClassList = document.documentElement.classList as any;

      applyTheme('dark');

      expect(mockClassList.add).toHaveBeenCalledWith('dark');
      expect(mockClassList.remove).not.toHaveBeenCalled();
    });

    it('should remove dark class when applying light theme', async () => {
      const { applyTheme } = await import('../../src/lib/theme');
      const mockClassList = document.documentElement.classList as any;

      applyTheme('light');

      expect(mockClassList.remove).toHaveBeenCalledWith('dark');
      expect(mockClassList.add).not.toHaveBeenCalled();
    });

    it('should handle SSR environment gracefully', async () => {
      const originalDocument = global.document;
      delete (global as any).document;

      const { applyTheme } = await import('../../src/lib/theme');

      expect(() => applyTheme('dark')).not.toThrow();

      global.document = originalDocument;
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from light to dark', async () => {
      const { toggleTheme } = await import('../../src/lib/theme');
      expect(toggleTheme('light')).toBe('dark');
    });

    it('should toggle from dark to light', async () => {
      const { toggleTheme } = await import('../../src/lib/theme');
      expect(toggleTheme('dark')).toBe('light');
    });
  });

  describe('supportsSystemTheme', () => {
    it('should return true when matchMedia is supported', async () => {
      const { supportsSystemTheme } = await import('../../src/lib/theme');
      expect(supportsSystemTheme()).toBe(true);
    });

    it('should return false when matchMedia is not supported', async () => {
      const originalMatchMedia = window.matchMedia;
      delete (window as any).matchMedia;

      const { supportsSystemTheme } = await import('../../src/lib/theme');
      expect(supportsSystemTheme()).toBe(false);

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('onSystemThemeChange', () => {
    it('should return unsubscribe function', async () => {
      const { onSystemThemeChange } = await import('../../src/lib/theme');

      const mockCallback = vi.fn();
      const unsubscribe = onSystemThemeChange(mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(mockCallback).not.toHaveBeenCalled();

      unsubscribe();
    });

    it('should handle SSR environment gracefully', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { onSystemThemeChange } = await import('../../src/lib/theme');

      const mockCallback = vi.fn();
      const unsubscribe = onSystemThemeChange(mockCallback);

      expect(typeof unsubscribe).toBe('function');
      expect(mockCallback).not.toHaveBeenCalled();

      global.window = originalWindow;
      unsubscribe();
    });
  });

  describe('validation functions', () => {
    it('should validate theme values correctly', async () => {
      const { isValidTheme } = await import('../../src/lib/theme');

      expect(isValidTheme('light')).toBe(true);
      expect(isValidTheme('dark')).toBe(true);
      expect(isValidTheme('LIGHT')).toBe(false);
      expect(isValidTheme('DARK')).toBe(false);
      expect(isValidTheme('invalid')).toBe(false);
      expect(isValidTheme('')).toBe(false);
    });

    it('should validate theme source values correctly', async () => {
      const { isValidThemeSource } = await import('../../src/lib/theme');

      expect(isValidThemeSource('system')).toBe(true);
      expect(isValidThemeSource('user')).toBe(true);
      expect(isValidThemeSource('SYSTEM')).toBe(false);
      expect(isValidThemeSource('USER')).toBe(false);
      expect(isValidThemeSource('invalid')).toBe(false);
      expect(isValidThemeSource('')).toBe(false);
    });
  });
});
