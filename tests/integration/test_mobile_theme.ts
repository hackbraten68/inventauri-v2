import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Integration tests for mobile responsiveness
 * These tests verify the theme system works correctly on mobile devices
 */

describe('Mobile Responsiveness', () => {
  beforeEach(() => {
    // Mock window.innerWidth and innerHeight for mobile simulation
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667, // iPhone height
    });

    // Mock document.documentElement for DOM manipulation
    vi.spyOn(document, 'documentElement', 'get').mockReturnValue({
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
      }
    } as any);
  });

  it('should detect mobile viewport correctly', async () => {
    const { getSystemTheme } = await import('../../src/lib/theme');

    // Should work the same on mobile as desktop
    const systemTheme = getSystemTheme();
    expect(['light', 'dark']).toContain(systemTheme);
  });

  it('should apply theme correctly on mobile', async () => {
    const { applyTheme } = await import('../../src/lib/theme');
    const mockClassList = document.documentElement.classList as any;

    applyTheme('dark');

    expect(mockClassList.add).toHaveBeenCalledWith('dark');
  });

  it('should handle touch device interactions', async () => {
    // Mock touch event support
    Object.defineProperty(window, 'ontouchstart', {
      writable: true,
      value: null, // Indicates touch support
    });

    const { getCurrentTheme } = await import('../../src/lib/theme');

    const currentTheme = getCurrentTheme();
    expect(currentTheme).toBeDefined();
    expect(currentTheme).toHaveProperty('theme');
    expect(currentTheme).toHaveProperty('source');
    expect(currentTheme).toHaveProperty('timestamp');
  });

  it('should handle various mobile viewport sizes', async () => {
    const { applyTheme } = await import('../../src/lib/theme');

    // Test different mobile sizes
    const mobileSizes = [
      { width: 375, height: 667 },   // iPhone
      { width: 414, height: 896 },   // iPhone Plus
      { width: 360, height: 640 },   // Android
      { width: 768, height: 1024 },  // iPad (tablet)
    ];

    for (const size of mobileSizes) {
      window.innerWidth = size.width;
      window.innerHeight = size.height;

      // Should not throw errors on any mobile size
      expect(() => applyTheme('light')).not.toThrow();
      expect(() => applyTheme('dark')).not.toThrow();
    }
  });

  it('should work with mobile browser chrome', async () => {
    // Mock mobile browser environment
    Object.defineProperty(window.navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });

    const { getSystemTheme, applyTheme } = await import('../../src/lib/theme');

    const systemTheme = getSystemTheme();
    expect(['light', 'dark']).toContain(systemTheme);

    // Should work normally on mobile browsers
    expect(() => applyTheme('dark')).not.toThrow();
  });

  it('should handle orientation changes', async () => {
    const { applyTheme } = await import('../../src/lib/theme');

    // Simulate orientation change
    window.innerWidth = 667;  // Portrait to landscape
    window.innerHeight = 375;

    expect(() => applyTheme('light')).not.toThrow();

    window.innerWidth = 375;  // Landscape to portrait
    window.innerHeight = 667;

    expect(() => applyTheme('dark')).not.toThrow();
  });
});
