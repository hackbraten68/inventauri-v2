/**
 * Theme utility functions for the Inventauri login page dark mode feature
 */

export type Theme = 'light' | 'dark';
export type ThemeSource = 'system' | 'user';

export interface ThemePreference {
  theme: Theme;
  source: ThemeSource;
  timestamp: string;
}

/**
 * Get the user's system theme preference using prefers-color-scheme
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'light'; // Default for SSR
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Get the current theme preference from browser storage or system
 */
export function getCurrentTheme(): ThemePreference {
  if (typeof window === 'undefined') {
    return {
      theme: 'light',
      source: 'system',
      timestamp: new Date().toISOString()
    };
  }

  // No persistence per clarification - always use system preference
  const systemTheme = getSystemTheme();

  return {
    theme: systemTheme,
    source: 'system',
    timestamp: new Date().toISOString()
  };
}

/**
 * Apply theme to the document by adding/removing the 'dark' class
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(currentTheme: Theme): Theme {
  return currentTheme === 'light' ? 'dark' : 'light';
}

/**
 * Check if the browser supports the prefers-color-scheme media query
 */
export function supportsSystemTheme(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
}

/**
 * Listen for system theme changes and call the callback when they occur
 */
export function onSystemThemeChange(callback: (theme: Theme) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };

  mediaQuery.addEventListener('change', handleChange);

  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

/**
 * Validate a theme value
 */
export function isValidTheme(theme: string): theme is Theme {
  return theme === 'light' || theme === 'dark';
}

/**
 * Validate a theme source value
 */
export function isValidThemeSource(source: string): source is ThemeSource {
  return source === 'system' || source === 'user';
}

/**
 * Create a theme preference object with validation
 */
export function createThemePreference(
  theme: Theme,
  source: ThemeSource = 'user'
): ThemePreference {
  if (!isValidTheme(theme)) {
    throw new Error(`Invalid theme: ${theme}. Must be 'light' or 'dark'`);
  }

  if (!isValidThemeSource(source)) {
    throw new Error(`Invalid theme source: ${source}. Must be 'system' or 'user'`);
  }

  return {
    theme,
    source,
    timestamp: new Date().toISOString()
  };
}
