/**
 * Main entry point for the i18n system
 * Exports all utilities, types, and configuration
 */

// Export all types
export * from './types';

// Export all utilities
export * from './utils';

// Export configuration
export * from './config';

// Re-export commonly used i18n functions for convenience
export { detectLanguage, updateLanguageInUrl, loadTranslations } from './utils';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, I18N_CONFIG } from './config';
export type { Language, LanguageDetectionOptions, TranslationLoadOptions } from './types';
