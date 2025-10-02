/**
 * Unit tests for language modal components
 * Tests LanguageModal and LanguageModalCompact components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageModal, LanguageModalCompact } from '../../src/components/ui/language-modal';
import { SUPPORTED_LANGUAGES } from '../../src/i18n/config';
import type { Language } from '../../src/i18n/types';

// Mock the SUPPORTED_LANGUAGES import
vi.mock('../../src/i18n/config', () => ({
  SUPPORTED_LANGUAGES: [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flagIcon: 'flag-en',
      isDefault: true,
      isActive: true,
      textDirection: 'ltr'
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flagIcon: 'flag-de',
      isDefault: false,
      isActive: true,
      textDirection: 'ltr'
    }
  ]
}));

describe('LanguageModal Component', () => {
  const mockOnClose = vi.fn();
  const mockOnLanguageSelect = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    currentLanguage: 'en',
    onLanguageSelect: mockOnLanguageSelect
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal with default title and description', () => {
    render(<LanguageModal {...defaultProps} />);

    expect(screen.getByText('Choose Language')).toBeInTheDocument();
    expect(screen.getByText('Select your preferred language from the options below.')).toBeInTheDocument();
  });

  it('should render modal with custom title and description', () => {
    const customTitle = 'Select Language';
    const customDescription = 'Pick your language preference';

    render(
      <LanguageModal
        {...defaultProps}
        title={customTitle}
        description={customDescription}
      />
    );

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <LanguageModal
        {...defaultProps}
        isOpen={false}
      />
    );

    expect(screen.queryByText('Choose Language')).not.toBeInTheDocument();
  });

  it('should display all supported languages', () => {
    render(<LanguageModal {...defaultProps} />);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
  });

  it('should highlight current language', () => {
    render(<LanguageModal {...defaultProps} />);

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toHaveAttribute('aria-current', 'true');
    expect(englishButton).toHaveClass('border-primary', 'bg-primary/5');
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should call onLanguageSelect when language is selected', () => {
    render(<LanguageModal {...defaultProps} />);

    const germanButton = screen.getByRole('button', { name: /deutsch/i });
    fireEvent.click(germanButton);

    expect(mockOnLanguageSelect).toHaveBeenCalledWith('de');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when close button is clicked', () => {
    render(<LanguageModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal on Escape key press', () => {
    render(<LanguageModal {...defaultProps} />);

    const modalContent = screen.getByRole('dialog');
    fireEvent.keyDown(modalContent, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display correct flag icons', () => {
    render(<LanguageModal {...defaultProps} />);

    expect(screen.getByText('🇺🇸')).toBeInTheDocument(); // English flag
    expect(screen.getByText('🇩🇪')).toBeInTheDocument(); // German flag
  });

  it('should display language information correctly', () => {
    render(<LanguageModal {...defaultProps} />);

    // Check English option
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument(); // Both native and English name

    // Check German option
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('German')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(<LanguageModal {...defaultProps} />);

    const germanButton = screen.getByRole('button', { name: /deutsch/i });

    fireEvent.keyDown(germanButton, { key: 'Enter' });
    expect(mockOnLanguageSelect).toHaveBeenCalledWith('de');

    fireEvent.keyDown(germanButton, { key: ' ' });
    expect(mockOnLanguageSelect).toHaveBeenCalledWith('de');
  });

  it('should have correct accessibility attributes', () => {
    render(<LanguageModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby', 'language-modal-description');

    const title = screen.getByText('Choose Language');
    expect(title).toHaveAttribute('id', 'language-modal-title');

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toHaveAttribute('role', 'option');
    expect(englishButton).toHaveAttribute('aria-selected', 'true');
    expect(englishButton).toHaveAttribute('aria-current', 'true');
  });

  it('should display text direction information', () => {
    render(<LanguageModal {...defaultProps} />);

    // English should not show text direction (default is ltr)
    const englishSection = screen.getByText('English').closest('.flex-1');
    expect(englishSection).not.toHaveTextContent('Left-to-right');

    // German should show text direction
    const germanSection = screen.getByText('Deutsch').closest('.flex-1');
    expect(germanSection).toHaveTextContent('Left-to-right');
  });
});

describe('LanguageModalCompact Component', () => {
  const mockOnClose = vi.fn();
  const mockOnLanguageSelect = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    currentLanguage: 'en',
    onLanguageSelect: mockOnLanguageSelect
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render compact modal with default title and description', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('Select language')).toBeInTheDocument();
  });

  it('should render compact modal with custom title and description', () => {
    const customTitle = 'Select Language';
    const customDescription = 'Pick your language preference';

    render(
      <LanguageModalCompact
        {...defaultProps}
        title={customTitle}
        description={customDescription}
      />
    );

    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customDescription)).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <LanguageModalCompact
        {...defaultProps}
        isOpen={false}
      />
    );

    expect(screen.queryByText('Language')).not.toBeInTheDocument();
  });

  it('should display all supported languages in compact format', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇩🇪')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
  });

  it('should highlight current language in compact format', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toHaveAttribute('aria-current', 'true');
    expect(englishButton).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('should call onLanguageSelect when language is selected', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const germanButton = screen.getByRole('button', { name: /deutsch/i });
    fireEvent.click(germanButton);

    expect(mockOnLanguageSelect).toHaveBeenCalledWith('de');
  });

  it('should close modal when close button is clicked', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal on Escape key press', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const modalContent = screen.getByRole('dialog');
    fireEvent.keyDown(modalContent, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display current language indicator', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should have correct accessibility attributes for compact version', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toHaveAttribute('aria-current', 'true');
  });

  it('should have compact styling', () => {
    render(<LanguageModalCompact {...defaultProps} />);

    const dialogContent = screen.getByRole('dialog').querySelector('[class*="max-w-"]');
    expect(dialogContent).toHaveClass('sm:max-w-[350px]', 'max-h-[80vh]', 'overflow-y-auto');
  });

  it('should handle German as current language', () => {
    render(
      <LanguageModalCompact
        {...defaultProps}
        currentLanguage="de"
      />
    );

    const germanButton = screen.getByRole('button', { name: /deutsch/i });
    expect(germanButton).toHaveAttribute('aria-current', 'true');
    expect(germanButton).toHaveClass('bg-primary', 'text-primary-foreground');
  });
});
