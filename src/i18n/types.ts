/**
 * TypeScript interfaces and types for the internationalization system
 * Based on the data model specifications
 */

// Language configuration interface
export interface Language {
  code: string; // ISO 639-1 language code (e.g., "en", "de")
  name: string; // Display name (e.g., "English", "Deutsch")
  nativeName: string; // Native language name (e.g., "English", "Deutsch")
  flagIcon: string; // Icon identifier for the language flag
  isDefault: boolean; // Whether this is the fallback language
  isActive: boolean; // Whether this language is currently available
  textDirection: 'ltr' | 'rtl'; // Text direction for layout
}

// Translation key interface
export interface TranslationKey {
  key: string; // Unique identifier (e.g., "nav.home", "auth.login")
  description?: string; // Optional description for translators
  category: string; // Organizational category (e.g., "navigation", "auth")
  parameters?: string[]; // Optional parameters for interpolation
  createdAt: Date;
  updatedAt: Date;
}

// Translation value interface
export interface TranslationValue {
  languageCode: string; // Foreign key to Language.code
  translationKey: string; // Foreign key to TranslationKey.key
  value: string; // The translated text
  isTranslated: boolean; // Whether this has been translated or is using fallback
  createdAt: Date;
  updatedAt: Date;
}

// Language detection options
export interface LanguageDetectionOptions {
  supportedLanguages: string[]; // Array of supported language codes
  defaultLanguage: string; // Default/fallback language code
  fallbackToBrowserLanguage: boolean; // Whether to fall back to browser language
}

// Language switcher props
export interface LanguageSwitcherProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  variant?: 'login' | 'authenticated'; // Different UI for different contexts
  className?: string;
}

// Translation loading options
export interface TranslationLoadOptions {
  language: string;
  fallbackLanguage?: string;
  cacheTranslations?: boolean;
  logMissingTranslations?: boolean;
}

// API response types
export interface LanguageResponse {
  code: string;
  name: string;
  nativeName: string;
  flagIcon: string;
  isDefault: boolean;
  textDirection: 'ltr' | 'rtl';
}

export interface LanguageSwitchRequest {
  languageCode: string;
  persist?: boolean;
}

export interface TranslationsResponse {
  [key: string]: string; // Translation key-value pairs
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
}

// Utility types
export type LanguageCode = string; // ISO 639-1 language code
export type TranslationKeyString = string; // Dot notation translation key
export type TranslationParameters = Record<string, string | number>; // Parameters for interpolation

// Validation function types
export type LanguageValidator = (value: string) => boolean;
export type TranslationValidator = (value: string) => boolean;

// Cache interface for translation caching
export interface TranslationCache {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  has(key: string): boolean;
  clear(): void;
  size(): number;
}

// Event types for language changes
export interface LanguageChangeEvent {
  previousLanguage: string;
  newLanguage: string;
  timestamp: Date;
  source: 'user' | 'system' | 'url';
}

// Configuration for the i18n system
export interface I18nConfig {
  defaultLanguage: string;
  supportedLanguages: Language[];
  fallbackStrategy: 'default' | 'browser' | 'none';
  enableCaching: boolean;
  logMissingTranslations: boolean;
  enableDevTools: boolean;
}
