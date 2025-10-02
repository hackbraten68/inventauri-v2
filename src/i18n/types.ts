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
  variant?: 'login' | 'authenticated' | 'sidebar'; // Different UI for different contexts
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

// Validation functions for Language entity
export class LanguageValidation {
  static readonly CODE_REGEX = /^[a-z]{2}$/; // ISO 639-1 format
  static readonly NAME_MIN_LENGTH = 2;
  static readonly NAME_MAX_LENGTH = 50;

  static validateCode(code: string): boolean {
    return this.CODE_REGEX.test(code);
  }

  static validateName(name: string): boolean {
    return name.length >= this.NAME_MIN_LENGTH && name.length <= this.NAME_MAX_LENGTH;
  }

  static validateNativeName(nativeName: string): boolean {
    return nativeName.length >= this.NAME_MIN_LENGTH && nativeName.length <= this.NAME_MAX_LENGTH;
  }

  static validateFlagIcon(flagIcon: string): boolean {
    return flagIcon.length > 0 && /^[a-zA-Z0-9-_]+$/.test(flagIcon);
  }

  static validateTextDirection(textDirection: string): boolean {
    return textDirection === 'ltr' || textDirection === 'rtl';
  }

  static validateLanguage(language: Partial<Language>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!language.code || !this.validateCode(language.code)) {
      errors.push('Invalid language code format (must be 2 lowercase letters)');
    }

    if (!language.name || !this.validateName(language.name)) {
      errors.push(`Name must be between ${this.NAME_MIN_LENGTH} and ${this.NAME_MAX_LENGTH} characters`);
    }

    if (!language.nativeName || !this.validateNativeName(language.nativeName)) {
      errors.push(`Native name must be between ${this.NAME_MIN_LENGTH} and ${this.NAME_MAX_LENGTH} characters`);
    }

    if (!language.flagIcon || !this.validateFlagIcon(language.flagIcon)) {
      errors.push('Invalid flag icon format');
    }

    if (!language.textDirection || !this.validateTextDirection(language.textDirection)) {
      errors.push('Text direction must be either "ltr" or "rtl"');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUniqueCode(code: string, existingLanguages: Language[]): boolean {
    return !existingLanguages.some(lang => lang.code === code);
  }

  static validateSingleDefault(existingLanguages: Language[]): boolean {
    const defaultCount = existingLanguages.filter(lang => lang.isDefault).length;
    return defaultCount <= 1;
  }
}

// Validation functions for TranslationKey entity
export class TranslationKeyValidation {
  static readonly KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9.]*[a-zA-Z0-9]$/; // Dot notation pattern
  static readonly DESCRIPTION_MAX_LENGTH = 500;
  static readonly CATEGORY_PATTERN = /^[a-zA-Z][a-zA-Z0-9.]*$/;

  static validateKey(key: string): boolean {
    return this.KEY_PATTERN.test(key) && !key.includes('..');
  }

  static validateDescription(description: string): boolean {
    return description.length <= this.DESCRIPTION_MAX_LENGTH;
  }

  static validateCategory(category: string): boolean {
    return this.CATEGORY_PATTERN.test(category);
  }

  static validateParameters(parameters: string[]): boolean {
    return parameters.every(param =>
      /^[a-zA-Z][a-zA-Z0-9]*$/.test(param) // Valid parameter names
    );
  }

  static validateTranslationKey(translationKey: Partial<TranslationKey>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!translationKey.key || !this.validateKey(translationKey.key)) {
      errors.push('Invalid translation key format (must follow dot notation pattern)');
    }

    if (translationKey.description && !this.validateDescription(translationKey.description)) {
      errors.push(`Description must be ${this.DESCRIPTION_MAX_LENGTH} characters or less`);
    }

    if (!translationKey.category || !this.validateCategory(translationKey.category)) {
      errors.push('Invalid category format');
    }

    if (translationKey.parameters && !this.validateParameters(translationKey.parameters)) {
      errors.push('Invalid parameter names (must be valid identifiers)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateUniqueKey(key: string, existingKeys: TranslationKey[]): boolean {
    return !existingKeys.some(tk => tk.key === key);
  }
}

// Validation functions for TranslationValue entity
export class TranslationValueValidation {
  static readonly VALUE_MAX_LENGTH = 2000;

  static validateValue(value: string): boolean {
    return value.length <= this.VALUE_MAX_LENGTH;
  }

  static validateLanguageCode(languageCode: string, supportedLanguages: Language[]): boolean {
    return supportedLanguages.some(lang => lang.code === languageCode);
  }

  static validateTranslationKey(translationKey: string, existingKeys: TranslationKey[]): boolean {
    return existingKeys.some(tk => tk.key === translationKey);
  }

  static validateTranslationValue(translationValue: Partial<TranslationValue>, context: {
    supportedLanguages: Language[];
    existingKeys: TranslationKey[];
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!translationValue.languageCode || !this.validateLanguageCode(translationValue.languageCode, context.supportedLanguages)) {
      errors.push('Invalid language code');
    }

    if (!translationValue.translationKey || !this.validateTranslationKey(translationValue.translationKey, context.existingKeys)) {
      errors.push('Invalid translation key');
    }

    if (!translationValue.value || !this.validateValue(translationValue.value)) {
      errors.push(`Value must be ${this.VALUE_MAX_LENGTH} characters or less`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
