/**
 * React i18next integration for the Inventauri application
 * Provides translation functionality for React components
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadTranslations } from '../i18n/utils';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../i18n/config';

interface I18nContextType {
  t: (key: string, params?: Record<string, any> & { defaultValue?: string }) => string;
  language: string;
  changeLanguage: (language: string) => Promise<void>;
  isLoading: boolean;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [language, setLanguage] = useState(initialLanguage || DEFAULT_LANGUAGE);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load translations when language changes
  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoading(true);
      try {
        const loadedTranslations = await loadTranslations({
          language,
          fallbackLanguage: DEFAULT_LANGUAGE,
          cacheTranslations: true,
          logMissingTranslations: true
        });
        setTranslations(loadedTranslations);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to default language
        const fallbackTranslations = await loadTranslations({
          language: DEFAULT_LANGUAGE,
          fallbackLanguage: DEFAULT_LANGUAGE,
          cacheTranslations: true,
          logMissingTranslations: false
        });
        setTranslations(fallbackTranslations);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [language]);

  const t = (key: string, params?: Record<string, any>): string => {
    // Check if the key exists in translations
    const hasTranslation = key in translations;
    
    // If no translation found and no default value provided, return the key
    if (!hasTranslation && (!params || !('defaultValue' in params))) {
      return key;
    }
    
    // Use the translation or the provided default value
    let translation = hasTranslation ? translations[key] : (params?.defaultValue || key);

    // Interpolate parameters (excluding defaultValue)
    if (params) {
      const { defaultValue, ...interpolationParams } = params;
      Object.entries(interpolationParams).forEach(([paramKey, value]) => {
        if (value !== undefined) {
          translation = translation.replace(
            new RegExp(`\\{${paramKey}\\}`, 'g'),
            String(value)
          );
        }
      });
    }

    return translation;
  };

  const changeLanguage = async (newLanguage: string) => {
    if (newLanguage === language) return;

    setIsLoading(true);
    try {
      // Update URL parameter
      const url = new URL(window.location.href);
      if (newLanguage === DEFAULT_LANGUAGE) {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', newLanguage);
      }
      
      // Update URL without causing a full page reload
      window.history.replaceState({}, '', url.toString());
      
      // Dispatch a custom event to notify other components about the language change
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: newLanguage, source: 'i18n-provider' } 
      }));

      setLanguage(newLanguage);

      // Reload translations
      const loadedTranslations = await loadTranslations({
        language: newLanguage,
        fallbackLanguage: DEFAULT_LANGUAGE,
        cacheTranslations: true,
        logMissingTranslations: true
      });
      setTranslations(loadedTranslations);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: I18nContextType = {
    t,
    language,
    changeLanguage,
    isLoading,
    supportedLanguages: SUPPORTED_LANGUAGES
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Optional hook that returns undefined when the provider is missing.
export function useOptionalI18n() {
  return useContext(I18nContext);
}

// Hook for translating text with automatic re-rendering on language change
export function useTranslation() {
  const { t, language, changeLanguage, isLoading } = useI18n();

  return {
    t,
    language,
    changeLanguage,
    isLoading,
    // Convenience method for common translations
    translate: t,
    // Method to check if a translation key exists
    hasTranslation: (key: string) => {
      // Check if translation exists (not just the key itself)
      return t(key) !== key;
    }
  };
}

// Higher-order component for translation
export function withTranslation<P extends object>(
  Component: React.ComponentType<P>
) {
  return function TranslatedComponent(props: P) {
    const { t } = useTranslation();

    return <Component {...props} t={t} />;
  };
}

// Utility component for translated text
interface TransProps {
  i18nKey: string;
  params?: Record<string, string | number>;
  fallback?: string;
  children?: (translation: string) => React.ReactNode;
}

export function Trans({ i18nKey, params, fallback, children }: TransProps) {
  const { t } = useTranslation();
  const translation = t(i18nKey, params) || fallback || i18nKey;

  if (children) {
    return <>{children(translation)}</>;
  }

  return <>{translation}</>;
}

// Component for displaying language information
export function LanguageInfo() {
  const { language, supportedLanguages } = useI18n();
  const currentLang = supportedLanguages.find(lang => lang.code === language);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Language:</span>
      <span className="font-medium">{currentLang?.nativeName || language}</span>
      <span className="text-xs">({currentLang?.name || 'Unknown'})</span>
    </div>
  );
}
