import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Performance tests for theme switching
 * Verifies that theme operations complete within performance targets
 */

describe('Theme Performance', () => {
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

    // Reset modules to ensure clean state
    vi.resetModules();
  });

  describe('Theme Switching Performance', () => {
    it('should complete theme switching within 100ms', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      const iterations = 100;

      const startTime = performance.now();

      // Perform multiple theme switches
      for (let i = 0; i < iterations; i++) {
        service.setTheme('light');
        service.setTheme('dark');
        service.toggleTheme();
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / iterations;

      console.log(`Theme switching performance: ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average per switch`);

      // Should complete within 100ms per clarification
      expect(averageDuration).toBeLessThan(100);
      expect(totalDuration).toBeLessThan(1000); // 100 iterations should be under 1 second
    });

    it('should handle rapid consecutive theme changes', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      const rapidChanges = 50;

      const startTime = performance.now();

      // Rapid theme changes
      for (let i = 0; i < rapidChanges; i++) {
        service.setTheme('light');
        service.setTheme('dark');
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / rapidChanges;

      console.log(`Rapid theme changes performance: ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average per change`);

      // Should still be fast even with rapid changes
      expect(averageDuration).toBeLessThan(50);
    });

    it('should handle theme service subscription performance', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      const service = getThemeService();
      const subscribers = 10;
      const operations = 20;

      const startTime = performance.now();

      // Add multiple subscribers
      const unsubscribers = [];
      for (let i = 0; i < subscribers; i++) {
        const unsubscribe = service.subscribe(() => {
          // Mock subscriber function
        });
        unsubscribers.push(unsubscribe);
      }

      // Perform operations with multiple subscribers
      for (let i = 0; i < operations; i++) {
        service.setTheme('light');
        service.setTheme('dark');
      }

      // Clean up subscribers
      unsubscribers.forEach(unsubscribe => unsubscribe());

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / operations;

      console.log(`Theme service with ${subscribers} subscribers: ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average per operation`);

      // Should still be fast with multiple subscribers
      expect(averageDuration).toBeLessThan(25);
    });
  });

  describe('Theme Detection Performance', () => {
    it('should detect system theme quickly', async () => {
      const { getSystemTheme } = await import('../../src/lib/theme');
      const iterations = 1000;

      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        getSystemTheme();
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / iterations;

      console.log(`System theme detection performance: ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(4)}ms average per detection`);

      // System theme detection should be very fast
      expect(averageDuration).toBeLessThan(1);
    });

    it('should handle media query listeners efficiently', async () => {
      const { onSystemThemeChange } = await import('../../src/lib/theme');
      const listeners = 5;
      const operations = 10;

      const startTime = performance.now();

      // Create multiple listeners
      const unsubscribers = [];
      for (let i = 0; i < listeners; i++) {
        const unsubscribe = onSystemThemeChange(() => {
          // Mock callback
        });
        unsubscribers.push(unsubscribe);
      }

      // Simulate media query changes
      const mockMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      for (let i = 0; i < operations; i++) {
        // Simulate system theme change
        Object.defineProperty(mockMediaQuery, 'matches', {
          value: i % 2 === 0,
          configurable: true
        });
        mockMediaQuery.dispatchEvent(new Event('change'));
      }

      // Clean up
      unsubscribers.forEach(unsubscribe => unsubscribe());

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const averageDuration = totalDuration / operations;

      console.log(`Media query listener performance: ${totalDuration.toFixed(2)}ms total, ${averageDuration.toFixed(2)}ms average per change`);

      // Media query handling should be efficient
      expect(averageDuration).toBeLessThan(10);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks with frequent operations', async () => {
      const { getThemeService } = await import('../../src/lib/theme-service');

      // Get initial memory usage if available
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      const service = getThemeService();
      const iterations = 1000;

      // Perform many operations
      for (let i = 0; i < iterations; i++) {
        service.setTheme('light');
        service.setTheme('dark');
        service.toggleTheme();
        service.resetToSystem();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory usage: ${initialMemory} → ${finalMemory} (increase: ${memoryIncrease} bytes)`);

      // Memory increase should be minimal
      if (initialMemory > 0 && finalMemory > 0) {
        expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
      }
    });
  });
});
