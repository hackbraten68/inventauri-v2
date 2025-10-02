import React, { useEffect, useState, type ReactNode } from 'react';
import { I18nProvider as I18nProviderBase, useI18n as useI18nBase } from '../../i18n/react-integration';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../../i18n/config';

interface I18nProviderWrapperProps {
  children: ReactNode;
  initialLanguage: string;
}

const isSupportedLanguage = (code?: string | null) =>
  !!code && SUPPORTED_LANGUAGES.some((lang) => lang.code === code);

const resolveInitialLanguage = (initialLanguage: string) => {
  if (typeof window === 'undefined') {
    return isSupportedLanguage(initialLanguage) ? initialLanguage : DEFAULT_LANGUAGE;
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLanguage = urlParams.get('lang');
    if (isSupportedLanguage(urlLanguage)) {
      window.localStorage.setItem('preferredLanguage', urlLanguage!);
      return urlLanguage!;
    }

    const storedLanguage = window.localStorage.getItem('preferredLanguage');
    if (isSupportedLanguage(storedLanguage)) {
      return storedLanguage!;
    }
  } catch (error) {
    console.warn('Unable to resolve preferred language from wrapper context', error);
  }

  if (typeof window !== 'undefined') {
    const browserLanguage = window.navigator.language.split('-')[0];
    if (isSupportedLanguage(browserLanguage)) {
      return browserLanguage;
    }
  }

  return isSupportedLanguage(initialLanguage) ? initialLanguage : DEFAULT_LANGUAGE;
};

// Inner component that handles language changes
function I18nProviderContent({ children }: Pick<I18nProviderWrapperProps, 'children'>) {
  const { language, changeLanguage } = useI18nBase();

  // Update language when URL changes or when a languageChanged event is received
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const lang = searchParams.get('lang');
      
      if (lang && lang !== language && isSupportedLanguage(lang)) {
        console.log('🌐 I18nProvider: Language changed in URL to', lang);
        changeLanguage(lang, 'url');
        return;
      }

      if (!lang) {
        try {
          const storedLanguage = window.localStorage.getItem('preferredLanguage');
          const fallbackLanguage = isSupportedLanguage(storedLanguage) ? storedLanguage! : DEFAULT_LANGUAGE;

          if (fallbackLanguage !== language) {
            console.log('🌐 I18nProvider: URL language cleared, restoring persisted language');
            changeLanguage(fallbackLanguage, 'url');
          }
        } catch (error) {
          console.warn('Failed to restore persisted language after URL change', error);
          if (language !== DEFAULT_LANGUAGE) {
            changeLanguage(DEFAULT_LANGUAGE, 'url');
          }
        }
      }
    };

    // Handle custom languageChanged events
    const handleLanguageChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ language: string; source?: string }>;
      const newLang = customEvent.detail?.language;
      const source = customEvent.detail?.source;

      // Ignore events we emitted ourselves to avoid recursive loops
      if (source === 'i18n-provider') {
        return;
      }

      if (newLang && newLang !== language && isSupportedLanguage(newLang)) {
        console.log('🌐 I18nProvider: Language changed via event to', newLang);
        changeLanguage(newLang);
      }
    };

    // Listen for URL changes and custom events
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('languageChanged', handleLanguageChanged);
    
    // Initial check
    handlePopState();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('languageChanged', handleLanguageChanged);
    };
  }, [language, changeLanguage]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    if (language === DEFAULT_LANGUAGE) {
      url.searchParams.delete('lang');
    } else {
      url.searchParams.set('lang', language);
    }
    window.history.replaceState({}, '', url.toString());
  }, [language]);

  return <>{children}</>;
}

export function I18nProviderWrapper({ children, initialLanguage }: I18nProviderWrapperProps) {
  // Use state to handle hydration issues
  const [isMounted, setIsMounted] = useState(false);
  const [resolvedInitialLanguage] = useState(() => resolveInitialLanguage(initialLanguage));

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until we're on the client side
  if (!isMounted) {
    return null;
  }

  return (
    <I18nProviderBase initialLanguage={resolvedInitialLanguage}>
      <I18nProviderContent>
        {children}
      </I18nProviderContent>
    </I18nProviderBase>
  );
}
