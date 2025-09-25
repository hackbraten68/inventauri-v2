/**
 * ThemeService for managing theme state and persistence
 * Handles theme detection, storage, and state management
 */

import { getSystemTheme, applyTheme, type Theme } from './theme';
import { ThemePreferenceModel } from './theme-preference';

export class ThemeService {
  private currentPreference: ThemePreferenceModel;
  private listeners: Set<(preference: ThemePreferenceModel) => void> = new Set();

  constructor() {
    // Initialize with system theme (no persistence per clarification)
    const systemTheme = getSystemTheme();
    this.currentPreference = ThemePreferenceModel.fromSystem(systemTheme);
    applyTheme(systemTheme);
  }

  /**
   * Get current theme preference
   */
  getCurrentPreference(): ThemePreferenceModel {
    return this.currentPreference;
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentPreference.theme;
  }

  /**
   * Set theme with user source
   */
  setTheme(theme: Theme): void {
    const newPreference = ThemePreferenceModel.fromUser(theme);
    this.updatePreference(newPreference);
  }

  /**
   * Toggle current theme
   */
  toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Reset to system theme
   */
  resetToSystem(): void {
    const systemTheme = getSystemTheme();
    const newPreference = ThemePreferenceModel.fromSystem(systemTheme);
    this.updatePreference(newPreference);
  }

  /**
   * Update preference and notify listeners
   */
  private updatePreference(preference: ThemePreferenceModel): void {
    this.currentPreference = preference;
    applyTheme(preference.theme);
    this.notifyListeners();
  }

  /**
   * Subscribe to theme changes
   */
  subscribe(listener: (preference: ThemePreferenceModel) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of preference change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentPreference);
      } catch (error) {
        console.error('Error in theme change listener:', error);
      }
    });
  }

  /**
   * Get theme preference as API response format
   */
  getApiResponse(): { theme: Theme; source: string; timestamp: string } {
    return this.currentPreference.toJSON();
  }

  /**
   * Check if current preference is from system
   */
  isSystemTheme(): boolean {
    return this.currentPreference.isSystem();
  }

  /**
   * Check if current preference is from user
   */
  isUserTheme(): boolean {
    return this.currentPreference.isUser();
  }
}

// Singleton instance for global theme management
let themeServiceInstance: ThemeService | null = null;

export function getThemeService(): ThemeService {
  if (!themeServiceInstance) {
    themeServiceInstance = new ThemeService();
  }
  return themeServiceInstance;
}

// Export singleton instance for convenience
export const themeService = getThemeService();
