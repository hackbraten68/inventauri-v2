/**
 * Type declarations for i18n configuration
 */

// Export the types
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flagIcon: string;
  isDefault: boolean;
  isActive: boolean;
  textDirection: 'ltr' | 'rtl';
}

export const DEFAULT_LANGUAGE: string;
export const SUPPORTED_LANGUAGES: Language[];

export const I18N_CONFIG: {
  defaultLanguage: string;
  supportedLanguages: string[];
  fallbackStrategy: 'default' | 'none' | 'all';
  enableCaching: boolean;
};
