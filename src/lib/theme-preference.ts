/**
 * ThemePreference model implementation
 * Represents a user's theme choice for the login page interface
 */

import type { Theme, ThemeSource } from './theme';

export interface ThemePreference {
  theme: Theme;
  source: ThemeSource;
  timestamp: string;
}

/**
 * ThemePreference model class with validation and utility methods
 */
export class ThemePreferenceModel {
  private _theme: Theme;
  private _source: ThemeSource;
  private _timestamp: string;

  constructor(theme: Theme, source: ThemeSource = 'user') {
    this._theme = theme;
    this._source = source;
    this._timestamp = new Date().toISOString();
  }

  get theme(): Theme {
    return this._theme;
  }

  get source(): ThemeSource {
    return this._source;
  }

  get timestamp(): string {
    return this._timestamp;
  }

  /**
   * Create a new ThemePreference with system source
   */
  static fromSystem(theme: Theme): ThemePreferenceModel {
    return new ThemePreferenceModel(theme, 'system');
  }

  /**
   * Create a new ThemePreference with user source
   */
  static fromUser(theme: Theme): ThemePreferenceModel {
    return new ThemePreferenceModel(theme, 'user');
  }

  /**
   * Convert to plain object for API responses
   */
  toJSON(): ThemePreference {
    return {
      theme: this._theme,
      source: this._source,
      timestamp: this._timestamp
    };
  }

  /**
   * Check if this is a system preference
   */
  isSystem(): boolean {
    return this._source === 'system';
  }

  /**
   * Check if this is a user preference
   */
  isUser(): boolean {
    return this._source === 'user';
  }

  /**
   * Convert to user preference (for when user explicitly sets theme)
   */
  toUserPreference(): ThemePreferenceModel {
    return new ThemePreferenceModel(this._theme, 'user');
  }

  /**
   * Convert to system preference (for when clearing user preference)
   */
  toSystemPreference(): ThemePreferenceModel {
    return new ThemePreferenceModel(this._theme, 'system');
  }

  /**
   * Create a copy with updated theme
   */
  withTheme(theme: Theme): ThemePreferenceModel {
    return new ThemePreferenceModel(theme, this._source);
  }

  /**
   * Create a copy with updated source
   */
  withSource(source: ThemeSource): ThemePreferenceModel {
    return new ThemePreferenceModel(this._theme, source);
  }
}

/**
 * Validate theme preference data
 */
export function validateThemePreference(data: any): data is ThemePreference {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!data.theme || !['light', 'dark'].includes(data.theme)) {
    return false;
  }

  if (!data.source || !['system', 'user'].includes(data.source)) {
    return false;
  }

  if (!data.timestamp || typeof data.timestamp !== 'string') {
    return false;
  }

  // Basic ISO 8601 validation
  const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  if (!timestampRegex.test(data.timestamp)) {
    return false;
  }

  return true;
}

/**
 * Create ThemePreference from API data with validation
 */
export function createThemePreferenceFromData(data: any): ThemePreferenceModel {
  if (!validateThemePreference(data)) {
    throw new Error('Invalid theme preference data');
  }

  return new ThemePreferenceModel(data.theme, data.source);
}
