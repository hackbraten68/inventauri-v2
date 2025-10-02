/**
 * Language selection modal component
 * Provides a modal dialog for selecting the application language
 */

import * as React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';
import { SUPPORTED_LANGUAGES } from '../../i18n/config';
import type { Language } from '../../i18n/types';

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onLanguageSelect: (languageCode: string) => void;
  title?: string;
  description?: string;
}

export function LanguageModal({
  isOpen,
  onClose,
  currentLanguage,
  onLanguageSelect,
  title = "Choose Language",
  description = "Select your preferred language from the options below."
}: LanguageModalProps) {
  const handleLanguageSelect = (languageCode: string) => {
    onLanguageSelect(languageCode);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        onKeyDown={handleKeyDown}
        aria-describedby="language-modal-description"
      >
        <DialogHeader>
          <DialogTitle id="language-modal-title">
            {title}
          </DialogTitle>
          <DialogDescription id="language-modal-description">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {SUPPORTED_LANGUAGES.map((language) => (
            <LanguageOption
              key={language.code}
              language={language}
              isSelected={currentLanguage === language.code}
              onSelect={handleLanguageSelect}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LanguageOptionProps {
  language: Language;
  isSelected: boolean;
  onSelect: (languageCode: string) => void;
}

function LanguageOption({ language, isSelected, onSelect }: LanguageOptionProps) {
  const handleClick = () => {
    onSelect(language.code);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(language.code);
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      aria-current={isSelected}
      role="option"
      aria-selected={isSelected}
    >
      {/* Flag icon */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-lg">
        {language.code === 'en' ? '🇺🇸' :
         language.code === 'de' ? '🇩🇪' : '🌍'}
      </div>

      {/* Language info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {language.nativeName}
          </span>
          {isSelected && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              Current
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {language.name}
        </div>
        {language.code !== 'en' && (
          <div className="text-xs text-muted-foreground mt-1">
            {language.textDirection === 'rtl' ? 'Right-to-left' : 'Left-to-right'}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
      )}
    </button>
  );
}

// Compact version for mobile or smaller spaces
export function LanguageModalCompact({
  isOpen,
  onClose,
  currentLanguage,
  onLanguageSelect,
  title = "Language",
  description = "Select language"
}: LanguageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[350px] max-h-[80vh] overflow-y-auto"
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className="text-sm">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          {SUPPORTED_LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => onLanguageSelect(language.code)}
              className={`flex items-center gap-3 rounded-md p-3 text-sm transition-colors ${
                currentLanguage === language.code
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
              aria-current={currentLanguage === language.code}
            >
              <span className="text-base">
                {language.code === 'en' ? '🇺🇸' :
                 language.code === 'de' ? '🇩🇪' : '🌍'}
              </span>
              <span className="font-medium">{language.nativeName}</span>
              {currentLanguage === language.code && (
                <span className="ml-auto text-xs opacity-75">Current</span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
