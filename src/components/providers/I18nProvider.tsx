/**
 * Client-side I18nProvider wrapper for Astro pages
 * This component initializes the I18n context for React components used in Astro pages
 */

import React, { useEffect, useState } from 'react';
import { I18nProvider } from '../../i18n/react-integration';
import { loadTranslations } from '../../i18n/utils';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../i18n/config';

interface ClientI18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: string;
}

function ClientI18nProviderContent({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTranslations = async () => {
      try {
        // Get language from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const language = urlParams.get('lang') || DEFAULT_LANGUAGE;

        const loadedTranslations = await loadTranslations({
          language,
          fallbackLanguage: DEFAULT_LANGUAGE,
          cacheTranslations: true,
          logMissingTranslations: true
        });
      } catch (error) {
        console.error('Failed to initialize translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTranslations();
  }, []);

  if (isLoading) {
    return <div>Loading translations...</div>;
  }

  return (
    <I18nProvider initialLanguage={window.location.search.split('lang=')[1]?.split('&')[0] || DEFAULT_LANGUAGE}>
      {children}
    </I18nProvider>
  );
}

export function ClientI18nProvider({ children, initialLanguage }: ClientI18nProviderProps) {
  return (
    <div id="i18n-provider-root">
      <ClientI18nProviderContent>
        {children}
      </ClientI18nProviderContent>
    </div>
  );
}
