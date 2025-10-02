/**
 * Unit tests for language switcher components
 * Tests LanguageSwitcher and LanguageSwitcherModal components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher, LanguageSwitcherModal } from '../../src/components/ui/language-switcher';
import { SUPPORTED_LANGUAGES } from '../../src/i18n/config';
import type { LanguageSwitcherProps } from '../../src/i18n/types';

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

describe('LanguageSwitcher Component', () => {
  const mockOnLanguageChange = vi.fn();

  const defaultProps: LanguageSwitcherProps = {
    currentLanguage: 'en',
    onLanguageChange: mockOnLanguageChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Variant', () => {
    it('should render login variant correctly', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button', { name: /switch language/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('h-8', 'w-8', 'p-0');
    });

    it('should call onLanguageChange with toggled language on login variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
    });

    it('should toggle from German to English', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          currentLanguage="de"
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('en');
    });

    it('should have correct accessibility attributes for login variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch language - Current: English');
    });
  });

  describe('Sidebar Variant', () => {
    it('should render sidebar variant correctly', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="sidebar"
        />
      );

      const button = screen.getByRole('button', { name: /switch language/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('h-8', 'w-full', 'justify-start', 'gap-2', 'px-2');
    });

    it('should display language name in sidebar variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="sidebar"
        />
      );

      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should display native name for German', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          currentLanguage="de"
          variant="sidebar"
        />
      );

      expect(screen.getByText('Deutsch')).toBeInTheDocument();
    });

    it('should call onLanguageChange with toggled language on sidebar variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="sidebar"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
    });

    it('should have correct accessibility attributes for sidebar variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="sidebar"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch language - Current: English');
    });
  });

  describe('Authenticated Variant (Default)', () => {
    it('should render authenticated variant correctly', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button', { name: /switch language/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('h-8', 'gap-2');
    });

    it('should display language name in authenticated variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should hide language name on small screens', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const hiddenText = screen.getByText('English');
      expect(hiddenText).toHaveClass('hidden', 'sm:inline-block');
    });

    it('should call onLanguageChange with toggled language on authenticated variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
    });

    it('should have correct accessibility attributes for authenticated variant', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch language - Current: English');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing language config gracefully', () => {
      render(
        <LanguageSwitcher
          currentLanguage="invalid"
          onLanguageChange={mockOnLanguageChange}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch language - Current: Unknown');
    });

    it('should handle missing onLanguageChange gracefully', () => {
      // @ts-expect-error - Testing invalid props
      render(<LanguageSwitcher currentLanguage="en" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className to all variants', () => {
      const customClass = 'custom-class';

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
          className={customClass}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass(customClass);
    });
  });
});

describe('LanguageSwitcherModal Component', () => {
  const mockOnLanguageChange = vi.fn();

  const defaultProps: LanguageSwitcherProps = {
    currentLanguage: 'en',
    onLanguageChange: mockOnLanguageChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render modal trigger button', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const button = screen.getByRole('button', { name: /switch language/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('h-8', 'w-8', 'p-0');
  });

  it('should open modal when trigger is clicked', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Choose Language')).toBeInTheDocument();
  });

  it('should display all supported languages in modal', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
  });

  it('should highlight current language in modal', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toHaveAttribute('aria-current', 'true');
    expect(englishButton).toHaveClass('bg-accent');
  });

  it('should call onLanguageChange when language is selected', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    const germanButton = screen.getByRole('button', { name: /deutsch/i });
    fireEvent.click(germanButton);

    expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
  });

  it('should close modal after language selection', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Choose Language')).toBeInTheDocument();

    const germanButton = screen.getByRole('button', { name: /deutsch/i });
    fireEvent.click(germanButton);

    expect(screen.queryByText('Choose Language')).not.toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    expect(screen.getByText('Choose Language')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(screen.queryByText('Choose Language')).not.toBeInTheDocument();
  });

  it('should display correct flag icons', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    fireEvent.click(triggerButton);

    // Check for flag emojis in the modal
    expect(screen.getByText('🇺🇸')).toBeInTheDocument(); // English flag
    expect(screen.getByText('🇩🇪')).toBeInTheDocument(); // German flag
  });

  it('should have correct accessibility attributes', () => {
    render(<LanguageSwitcherModal {...defaultProps} />);

    const triggerButton = screen.getByRole('button');
    expect(triggerButton).toHaveAttribute('aria-label', 'Switch language - Current: EN');

    const triggerButton2 = screen.getByRole('button');
    fireEvent.click(triggerButton2);

    const englishButton = screen.getByRole('button', { name: /english/i });
    expect(englishButton).toHaveAttribute('aria-current', 'true');
  });
});
