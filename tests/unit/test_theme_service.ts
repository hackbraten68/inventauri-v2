import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Unit tests for ThemeService
 * Tests the theme service logic in isolation
 */

describe('ThemeService', () => {
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

    // Reset the singleton instance between tests
    vi.resetModules();
  });

  describe('initialization', () => {
    it('should initialize with system theme', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      expect(service).toBeDefined();
      expect(service.getCurrentTheme()).toBe('light'); // Default system theme
    });

    it('should be a singleton', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service1 = getThemeService();
      const service2 = getThemeService();

      expect(service1).toBe(service2);
    });
  });

  describe('theme management', () => {
    it('should set theme correctly', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      service.setTheme('dark');

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should toggle theme correctly', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();

      // Start with light theme
      service.setTheme('light');
      expect(service.getCurrentTheme()).toBe('light');

      // Toggle to dark
      service.toggleTheme();
      expect(service.getCurrentTheme()).toBe('dark');

      // Toggle back to light
      service.toggleTheme();
      expect(service.getCurrentTheme()).toBe('light');
    });

    it('should reset to system theme correctly', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();

      // Set user theme
      service.setTheme('dark');
      expect(service.getCurrentTheme()).toBe('dark');
      expect(service.isUserTheme()).toBe(true);

      // Reset to system
      service.resetToSystem();
      expect(service.getCurrentTheme()).toBe('light'); // System default
      expect(service.isSystemTheme()).toBe(true);
    });
  });

  describe('theme preference management', () => {
    it('should track theme source correctly', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();

      // Initially system theme
      expect(service.isSystemTheme()).toBe(true);
      expect(service.isUserTheme()).toBe(false);

      // Set user theme
      service.setTheme('dark');
      expect(service.isSystemTheme()).toBe(false);
      expect(service.isUserTheme()).toBe(true);

      // Reset to system
      service.resetToSystem();
      expect(service.isSystemTheme()).toBe(true);
      expect(service.isUserTheme()).toBe(false);
    });

    it('should provide correct API response format', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      service.setTheme('dark');

      const apiResponse = service.getApiResponse();
      expect(apiResponse).toHaveProperty('theme', 'dark');
      expect(apiResponse).toHaveProperty('source', 'user');
      expect(apiResponse).toHaveProperty('timestamp');
      expect(typeof apiResponse.timestamp).toBe('string');
    });
  });

  describe('subscription system', () => {
    it('should allow subscribing to theme changes', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      const mockListener = vi.fn();

      const unsubscribe = service.subscribe(mockListener);
      expect(typeof unsubscribe).toBe('function');

      service.setTheme('dark');
      expect(mockListener).toHaveBeenCalled();

      unsubscribe();
    });

    it('should handle multiple subscribers', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      const mockListener1 = vi.fn();
      const mockListener2 = vi.fn();

      service.subscribe(mockListener1);
      service.subscribe(mockListener2);

      service.setTheme('dark');

      expect(mockListener1).toHaveBeenCalled();
      expect(mockListener2).toHaveBeenCalled();
    });

    it('should handle subscriber errors gracefully', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      const mockListener = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      // Should not throw even if subscriber throws
      expect(() => {
        service.subscribe(mockListener);
        service.setTheme('dark');
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid theme changes', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();

      // Rapid theme changes should work without issues
      for (let i = 0; i < 10; i++) {
        service.setTheme('light');
        service.setTheme('dark');
      }

      expect(service.getCurrentTheme()).toBe('dark');
    });

    it('should handle invalid operations gracefully', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();

      // Should not throw on any operations
      expect(() => service.setTheme('light')).not.toThrow();
      expect(() => service.setTheme('dark')).not.toThrow();
      expect(() => service.toggleTheme()).not.toThrow();
      expect(() => service.resetToSystem()).not.toThrow();
    });
  });
});
