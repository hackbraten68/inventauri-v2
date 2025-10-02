/**
 * Language switcher UI component
 * Provides a button to open the language selection modal
 */

import * as React from 'react';
import { Globe } from 'lucide-react';
import { Button } from './button';
import type { LanguageSwitcherProps } from '../../i18n/types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../i18n/config';
import { useOptionalI18n } from '../../i18n/react-integration';

export function LanguageSwitcher({
  currentLanguage,
  variant = 'authenticated',
  className
}: LanguageSwitcherProps) {
  const [isClient, setIsClient] = React.useState(false);
  const i18n = useOptionalI18n();
  
  const [isOpen, setIsOpen] = React.useState(false);
  const currentLangConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  
  // Set isClient to true when component mounts on the client side
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLanguageSelect = (languageCode: string) => {
    if (!isClient) return; // Skip if not on client side
    
    console.log('🔄 LanguageSwitcher: Language selected:', languageCode);
    console.log('🔄 LanguageSwitcher: Current language:', currentLanguage);
    console.log('🔄 LanguageSwitcher: Variant:', variant);

    if (variant === 'login') {
      console.log('🌍 LanguageSwitcher: Handling login page language change');
      // Ensure window is available (client-side only)
      if (typeof window !== 'undefined') {
        const redirectParam = window.location.search.includes('redirectTo=')
          ? '&' + window.location.search.split('&').find(p => p.startsWith('redirectTo='))
          : '';
        const newUrl = window.location.pathname + '?lang=' + languageCode + redirectParam;
        console.log('🌍 LanguageSwitcher: New URL will be:', newUrl);
        window.location.href = newUrl;
      }
    } else {
      if (i18n?.changeLanguage) {
        console.log('🔄 LanguageSwitcher: Changing language via I18nProvider');
        i18n.changeLanguage(languageCode);
      } else if (typeof window !== 'undefined') {
        console.log('🔄 LanguageSwitcher: No provider detected, updating location');
        const url = new URL(window.location.href);
        if (languageCode === DEFAULT_LANGUAGE) {
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('lang', languageCode);
        }
        window.location.href = url.toString();
      }
    }

    setIsOpen(false);
  };

  // For login variant, show a simple button that opens a modal
  if (variant === 'login') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`h-8 w-8 p-0 ${className || ''}`}
          aria-label={`Switch language - Current: ${currentLangConfig?.name || 'Unknown'}`}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">
            Current language: {currentLangConfig?.name || 'Unknown'}
          </span>
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Choose Language</h3>
              <div className="space-y-2">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      currentLanguage === language.code
                        ? 'bg-accent border-accent-foreground/20'
                        : 'hover:bg-accent'
                    }`}
                    aria-current={currentLanguage === language.code}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {language.code === 'en' ? '🇺🇸' :
                         language.code === 'de' ? '🇩🇪' : '🌍'}
                      </span>
                      <div>
                        <div className="font-medium">{language.nativeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {language.name}
                        </div>
                      </div>
                      {currentLanguage === language.code && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Current
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // For sidebar variant, show a compact button with language name
  if (variant === 'sidebar') {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={`h-8 w-full justify-start gap-2 px-2 ${className || ''}`}
          aria-label={`Switch language - Current: ${currentLangConfig?.name || 'Unknown'}`}
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs">
            {currentLangConfig?.nativeName || currentLanguage.toUpperCase()}
          </span>
          <span className="sr-only">
            Current language: {currentLangConfig?.name || 'Unknown'}
          </span>
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Choose Language</h3>
              <div className="space-y-2">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      currentLanguage === language.code
                        ? 'bg-accent border-accent-foreground/20'
                        : 'hover:bg-accent'
                    }`}
                    aria-current={currentLanguage === language.code}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {language.code === 'en' ? '🇺🇸' :
                         language.code === 'de' ? '🇩🇪' : '🌍'}
                      </span>
                      <div>
                        <div className="font-medium">{language.nativeName}</div>
                        <div className="text-sm text-muted-foreground">
                          {language.name}
                        </div>
                      </div>
                      {currentLanguage === language.code && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Current
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // For authenticated variant, show a simple button with language name
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`h-8 gap-2 ${className || ''}`}
        aria-label={`Switch language - Current: ${currentLangConfig?.name || 'Unknown'}`}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline-block">
          {currentLangConfig?.nativeName || currentLanguage.toUpperCase()}
        </span>
        <span className="sr-only">
          Current language: {currentLangConfig?.name || 'Unknown'}
        </span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Choose Language</h3>
            <div className="space-y-2">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    currentLanguage === language.code
                      ? 'bg-accent border-accent-foreground/20'
                      : 'hover:bg-accent'
                  }`}
                  aria-current={currentLanguage === language.code}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {language.code === 'en' ? '🇺🇸' :
                       language.code === 'de' ? '🇩🇪' : '🌍'}
                    </span>
                    <div>
                      <div className="font-medium">{language.nativeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {language.name}
                      </div>
                    </div>
                    {currentLanguage === language.code && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// Legacy component for modal-based language switching (can be removed later)
export function LanguageSwitcherModal({
  currentLanguage,
  className
}: Omit<LanguageSwitcherProps, 'variant'>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  
  // Only use the useI18n hook on the client side
  const { changeLanguage } = isClient ? useI18n() : { changeLanguage: (lang: string) => {} };

  // Set isClient to true when component mounts on the client side
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLanguageSelect = (languageCode: string) => {
    if (!isClient) return; // Skip if not on client side
    
    console.log('🔄 LanguageSwitcherModal: Language selected:', languageCode);
    console.log('🔄 LanguageSwitcherModal: Current language:', currentLanguage);
    
    // Change the language
    changeLanguage(languageCode);
    
    // Close the modal
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`h-8 w-8 p-0 ${className || ''}`}
        aria-label={`Switch language - Current: ${currentLanguage.toUpperCase()}`}
      >
        <Globe className="h-4 w-4" />
        <span className="sr-only">
          Current language: {currentLanguage.toUpperCase()}
        </span>
      </Button>

      {/* This would be replaced by the actual modal component */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Choose Language</h3>
            <div className="space-y-2">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    currentLanguage === language.code
                      ? 'bg-accent border-accent-foreground/20'
                      : 'hover:bg-accent'
                  }`}
                  aria-current={currentLanguage === language.code}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {language.code === 'en' ? '🇺🇸' :
                       language.code === 'de' ? '🇩🇪' : '🌍'}
                    </span>
                    <div>
                      <div className="font-medium">{language.nativeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {language.name}
                      </div>
                    </div>
                    {currentLanguage === language.code && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Current
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-4 p-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
