/**
 * System theme detection utilities
 * Handles automatic detection of user's OS/browser theme preferences
 */

import { getSystemTheme, onSystemThemeChange, type Theme } from './theme';
import { getThemeService } from './theme-service';

export class SystemThemeDetector {
  private unsubscribe?: () => void;

  constructor() {
    this.initializeSystemThemeDetection();
  }

  /**
   * Initialize system theme detection and listening
   */
  private initializeSystemThemeDetection(): void {
    const themeService = getThemeService();

    // Set initial theme based on system preference
    const systemTheme = getSystemTheme();
    if (themeService.isSystemTheme()) {
      themeService.setTheme(systemTheme);
    }

    // Listen for system theme changes
    this.unsubscribe = onSystemThemeChange((systemTheme: Theme) => {
      // Only update if current theme is from system
      if (themeService.isSystemTheme()) {
        themeService.setTheme(systemTheme);
      }
    });
  }

  /**
   * Clean up system theme detection
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  /**
   * Force refresh system theme detection
   */
  refresh(): void {
    this.destroy();
    this.initializeSystemThemeDetection();
  }
}

// Singleton instance for global system theme detection
let systemThemeDetector: SystemThemeDetector | null = null;

export function getSystemThemeDetector(): SystemThemeDetector {
  if (!systemThemeDetector) {
    systemThemeDetector = new SystemThemeDetector();
  }
  return systemThemeDetector;
}

/**
 * Utility function to detect if the current environment supports system theme detection
 */
export function supportsSystemThemeDetection(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return 'matchMedia' in window && window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
}

/**
 * Get the current system theme preference
 */
export function getCurrentSystemTheme(): Theme {
  return getSystemTheme();
}

/**
 * Check if the browser supports the prefers-color-scheme media query
 */
export function isSystemThemeSupported(): boolean {
  return supportsSystemThemeDetection();
}
