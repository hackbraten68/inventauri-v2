// Type definitions for i18n module
declare module '../i18n/config' {
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

  export function validateLanguageCode(code: string): boolean;
  export function getLanguageByCode(code: string): Language | undefined;
  export function getSupportedLanguageCodes(): string[];
}

declare module '../i18n/utils' {
  export function loadTranslations(lang: string): Promise<Record<string, string>>;
  export function detectLanguage(): string;
  export function updateLanguageInUrl(lang: string): void;
}

declare module '../i18n/react-integration' {
  import { ReactNode } from 'react';
  
  export const I18nProvider: React.FC<{ children: ReactNode }>;
  export function useTranslation(): {
    t: (key: string, params?: Record<string, any> & { defaultValue?: string }) => string;
    i18n: {
      changeLanguage: (lng: string) => Promise<void>;
      language: string;
    };
  };
}
