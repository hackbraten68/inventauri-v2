/**
 * React hook for using translations without requiring a context provider
 * This hook provides translation functionality for React components
 */

import { useState, useEffect } from 'react';
import { t, changeLanguage, getCurrentLang, hasTranslation, getAllTranslations } from '../lib/translations';

export interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  changeLanguage: (language: string) => Promise<void>;
  hasTranslation: (key: string) => boolean;
  getAllTranslations: () => Record<string, string>;
  isLoading: boolean;
}

export function useTranslation(): UseTranslationReturn {
  const [language, setLanguage] = useState(getCurrentLang());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Update language state when URL changes
    const updateLanguage = () => {
      const newLanguage = getCurrentLang();
      if (newLanguage !== language) {
        setLanguage(newLanguage);
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', updateLanguage);

    // Listen for custom language change events
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguage(event.detail.language);
    };
    window.addEventListener('languagechange', handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener('popstate', updateLanguage);
      window.removeEventListener('languagechange', handleLanguageChange as EventListener);
    };
  }, [language]);

  const handleChangeLanguage = async (newLanguage: string) => {
    setIsLoading(true);
    try {
      await changeLanguage(newLanguage);
      setLanguage(newLanguage);

      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('languagechange', {
        detail: { language: newLanguage }
      }));
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    t,
    language,
    changeLanguage: handleChangeLanguage,
    hasTranslation,
    getAllTranslations,
    isLoading
  };
}
