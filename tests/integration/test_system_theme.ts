import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for system theme detection
 * These tests verify the theme system works correctly with browser APIs
 */

describe('System Theme Detection', () => {
  beforeEach(() => {
    // Mock window.matchMedia for consistent testing
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should detect light theme when system preference is light', async () => {
    // Mock system preference for light theme
    const mockMatchMedia = window.matchMedia as any;
    mockMatchMedia.mockReturnValue({
      matches: false, // false = light theme
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    // Import and test the theme utilities
    const { getSystemTheme } = await import('../../src/lib/theme');

    const systemTheme = getSystemTheme();
    expect(systemTheme).toBe('light');
  });

  it('should detect dark theme when system preference is dark', async () => {
    // Mock system preference for dark theme
    const mockMatchMedia = window.matchMedia as any;
    mockMatchMedia.mockReturnValue({
      matches: true, // true = dark theme
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { getSystemTheme } = await import('../../src/lib/theme');

    const systemTheme = getSystemTheme();
    expect(systemTheme).toBe('dark');
  });

  it('should handle browsers without matchMedia support', async () => {
    // Temporarily remove matchMedia
    const originalMatchMedia = window.matchMedia;
    delete (window as any).matchMedia;

    const { getSystemTheme } = await import('../../src/lib/theme');

    const systemTheme = getSystemTheme();
    expect(systemTheme).toBe('light'); // Should default to light

    // Restore matchMedia
    window.matchMedia = originalMatchMedia;
  });

  it('should listen for system theme changes', async () => {
    const { onSystemThemeChange } = await import('../../src/lib/theme');

    const mockCallback = vi.fn();
    const unsubscribe = onSystemThemeChange(mockCallback);

    expect(typeof unsubscribe).toBe('function');
    expect(mockCallback).not.toHaveBeenCalled();

    // Cleanup
    unsubscribe();
  });
});
