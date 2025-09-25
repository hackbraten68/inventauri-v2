/**
 * Theme Context Provider for React/Vue components in Astro
 * Provides theme state and actions to child components
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Theme, ThemePreference } from '../lib/theme';
import {
  getCurrentTheme,
  applyTheme,
  toggleTheme,
  onSystemThemeChange,
  createThemePreference
} from '../lib/theme';

interface ThemeContextType {
  theme: Theme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    getCurrentTheme()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Initialize theme on mount
  useEffect(() => {
    const currentTheme = getCurrentTheme();
    setThemePreference(currentTheme);
    applyTheme(currentTheme.theme);
    setIsLoading(false);

    // Listen for system theme changes
    const unsubscribe = onSystemThemeChange((systemTheme) => {
      // Only update if current source is system
      if (themePreference.source === 'system') {
        const newPreference = createThemePreference(systemTheme, 'system');
        setThemePreference(newPreference);
        applyTheme(systemTheme);
      }
    });

    return unsubscribe;
  }, [themePreference.source]);

  const handleToggleTheme = () => {
    const newTheme = toggleTheme(themePreference.theme);
    const newPreference = createThemePreference(newTheme, 'user');

    setThemePreference(newPreference);
    applyTheme(newTheme);
  };

  const handleSetTheme = (theme: Theme) => {
    const newPreference = createThemePreference(theme, 'user');
    setThemePreference(newPreference);
    applyTheme(theme);
  };

  const value: ThemeContextType = {
    theme: themePreference.theme,
    themePreference,
    toggleTheme: handleToggleTheme,
    setTheme: handleSetTheme,
    isLoading
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Astro component wrapper for the ThemeProvider
export function ThemeProviderAstro({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
