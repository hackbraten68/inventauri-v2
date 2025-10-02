import { I18nProvider as I18nProviderBase, useI18n as useI18nBase } from '../../i18n/react-integration';
import { useEffect, useState } from 'react';

interface I18nProviderWrapperProps {
  children: React.ReactNode;
  initialLanguage: string;
}

// Inner component that handles language changes
function I18nProviderContent({ children, initialLanguage }: I18nProviderWrapperProps) {
  const { language, changeLanguage } = useI18nBase();

  // Update language when URL changes or when a languageChanged event is received
  useEffect(() => {
    const handlePopState = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const lang = searchParams.get('lang');
      
      if (lang && lang !== language) {
        console.log('🌐 I18nProvider: Language changed in URL to', lang);
        changeLanguage(lang);
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

      if (newLang && newLang !== language) {
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

  return <>{children}</>;
}

export function I18nProviderWrapper({ children, initialLanguage }: I18nProviderWrapperProps) {
  // Use state to handle hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until we're on the client side
  if (!isMounted) {
    return null;
  }

  return (
    <I18nProviderBase initialLanguage={initialLanguage}>
      <I18nProviderContent initialLanguage={initialLanguage}>
        {children}
      </I18nProviderContent>
    </I18nProviderBase>
  );
}
