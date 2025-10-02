/**
 * LanguageSwitcher Component
 * 
 * A reusable language switcher component that supports different variants (login, sidebar, default)
 * with a modern, accessible UI and smooth animations.
 * 
 * Features:
 * - Responsive design for all screen sizes
 * - Keyboard navigation support
 * - Loading states during language changes
 * - Smooth animations and transitions
 * - Accessible with proper ARIA attributes
 */

import * as React from 'react';
import { Globe, Check, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '../../lib/utils';
import type { LanguageSwitcherProps } from '../../i18n/types';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../i18n/config';
import { useOptionalI18n } from '../../i18n/react-integration';

// Language option interface for type safety
interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

// Map language codes to flag emojis
const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇺🇸',
  de: '🇩🇪',
  // Add more language flags as needed
};

// Get flag emoji for a language code
const getFlagEmoji = (code: string) => LANGUAGE_FLAGS[code] || '🌍';

export function LanguageSwitcher({
  currentLanguage,
  variant = 'authenticated',
  className
}: LanguageSwitcherProps) {
  const [isClient, setIsClient] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isChanging, setIsChanging] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const modalRef = React.useRef<HTMLDivElement>(null);
  
  const i18n = useOptionalI18n();
  const currentLangConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  
  // Set isClient to true when component mounts on the client side
  React.useEffect(() => {
    setIsClient(true);
    
    // Close modal when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current && 
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    // Close on escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle language selection
  const handleLanguageSelect = async (languageCode: string) => {
    if (!isClient || languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }
    
    setIsChanging(true);
    console.log('🔄 LanguageSwitcher: Language selected:', languageCode);
    console.log('🔄 LanguageSwitcher: Current language:', currentLanguage);

    try {
      if (variant === 'login') {
        // For login page, do a full page reload with the new language
        if (typeof window !== 'undefined') {
          const redirectParam = window.location.search.includes('redirectTo=')
            ? '&' + window.location.search.split('&').find(p => p.startsWith('redirectTo='))
            : '';
          const newUrl = window.location.pathname + '?lang=' + languageCode + redirectParam;
          window.location.href = newUrl;
        }
      } else if (i18n?.changeLanguage) {
        // Use i18n provider if available
        await i18n.changeLanguage(languageCode);
      } else if (typeof window !== 'undefined') {
        // Fallback to URL-based language switching
        const url = new URL(window.location.href);
        if (languageCode === DEFAULT_LANGUAGE) {
          url.searchParams.delete('lang');
        } else {
          url.searchParams.set('lang', languageCode);
        }
        window.location.href = url.toString();
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  // Common button props based on variant
  const getButtonProps = () => {
    const baseProps = {
      ref: buttonRef,
      onClick: () => setIsOpen(!isOpen),
      'aria-label': `Change language (current: ${currentLangConfig?.name || currentLanguage})`,
      'aria-expanded': isOpen,
      'aria-haspopup': 'dialog' as const,
      disabled: isChanging,
      className: cn(
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variant === 'login' && 'h-8 w-8 p-0',
        variant === 'sidebar' && 'h-8 w-full justify-start gap-2 px-2',
        variant === 'authenticated' && 'h-8 gap-2',
        className
      ),
      variant: 'ghost' as const,
      size: 'sm' as const,
    };

    return baseProps;
  };

  // Render the language options list
  const renderLanguageOptions = () => (
    <div className="space-y-1.5">
      {SUPPORTED_LANGUAGES.map((language) => {
        const isCurrent = language.code === currentLanguage;
        return (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language.code)}
            disabled={isChanging || isCurrent}
            className={cn(
              'w-full text-left p-2.5 rounded-md transition-colors flex items-center gap-3',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              isCurrent 
                ? 'bg-accent/50 text-accent-foreground cursor-default' 
                : 'hover:bg-accent/30 active:bg-accent/40',
              isChanging && 'opacity-70 cursor-wait'
            )}
            aria-current={isCurrent ? 'true' : 'false'}
          >
            <span className="text-lg flex-shrink-0">
              {getFlagEmoji(language.code)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{language.nativeName}</div>
              <div className="text-xs text-muted-foreground truncate">
                {language.name}
              </div>
            </div>
            {isCurrent && (
              <span className="text-primary ml-2">
                <Check className="h-4 w-4" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Render the modal/popover content
  const renderModal = () => (
    <div 
      ref={modalRef}
      className={cn(
        'bg-background rounded-lg shadow-lg overflow-hidden border border-border',
        'animate-in fade-in-50 zoom-in-95',
        variant === 'login' ? 'w-full max-w-xs' : 'w-full max-w-xs',
        'transform transition-all duration-200',
        isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
    >
      <div className="p-4 border-b border-border">
        <h3 
          id="language-modal-title"
          className="text-lg font-semibold text-foreground"
        >
          Select Language
        </h3>
      </div>
      <div className="p-3 max-h-[60vh] overflow-y-auto">
        {isChanging ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Changing language...</span>
          </div>
        ) : (
          renderLanguageOptions()
        )}
      </div>
    </div>
  );

  // For login variant
  if (variant === 'login') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          {...getButtonProps()}
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">
            Current language: {currentLangConfig?.name || 'Unknown'}
          </span>
        </Button>

        {/* Modal for login variant */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {renderModal()}
          </div>
        )}
      </div>
    );
  }

  // For sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          {...getButtonProps()}
        >
          <Globe className="h-4 w-4 flex-shrink-0" />
          <span className="text-xs truncate">
            {currentLangConfig?.nativeName || currentLanguage.toUpperCase()}
          </span>
          <ChevronDown className={cn(
            'h-3.5 w-3.5 ml-auto opacity-50 transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )} />
          <span className="sr-only">
            Current language: {currentLangConfig?.name || 'Unknown'}
          </span>
        </Button>

        {/* Popover for sidebar variant */}
        <div 
          className={cn(
            'absolute bottom-full left-0 mb-2 w-full z-50',
            !isOpen && 'hidden'
          )}
        >
          {renderModal()}
        </div>
      </div>
    );
  }

  // Default/authenticated variant
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        {...getButtonProps()}
      >
        <Globe className="h-4 w-4 flex-shrink-0" />
        <span className="hidden sm:inline-block truncate">
          {currentLangConfig?.nativeName || currentLanguage.toUpperCase()}
        </span>
        <ChevronDown className={cn(
          'h-3.5 w-3.5 ml-0.5 opacity-50 transition-transform duration-200',
          isOpen && 'transform rotate-180',
          'hidden sm:block'
        )} />
        <span className="sr-only">
          Current language: {currentLangConfig?.name || 'Unknown'}
        </span>
      </Button>

      {/* Popover for default variant */}
      <div 
        className={cn(
          'absolute right-0 mt-2 w-56 z-50',
          !isOpen && 'hidden'
        )}
      >
        {renderModal()}
      </div>
    </div>
  );
}

// Deprecated: Use LanguageSwitcher component instead
// This component is kept for backward compatibility
export function LanguageSwitcherModal({
  currentLanguage,
  className
}: Omit<LanguageSwitcherProps, 'variant'>) {
  console.warn('LanguageSwitcherModal is deprecated. Use LanguageSwitcher component instead.');
  
  return (
    <LanguageSwitcher 
      currentLanguage={currentLanguage} 
      className={className}
      variant="authenticated"
    />
  );
}
