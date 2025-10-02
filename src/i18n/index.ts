/**
 * Main entry point for the i18n system
 * Exports all utilities, types, and configuration
 */

// Export all types
export * from './types';

// Export all utilities
export * from './utils';

// Export configuration
export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, I18N_CONFIG } from './config';

// Export React integration
export * from './react-integration';

// Re-export commonly used i18n functions for convenience
export { detectLanguage, updateLanguageInUrl, loadTranslations } from './utils';
export type { Language, LanguageDetectionOptions, TranslationLoadOptions } from './types';
