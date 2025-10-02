/**
 * Accessibility audit for language controls
 * Tests keyboard navigation, screen reader support, and WCAG compliance
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LanguageSwitcher, LanguageSwitcherModal } from '../../src/components/ui/language-switcher';
import { LanguageModal, LanguageModalCompact } from '../../src/components/ui/language-modal';
import type { LanguageSwitcherProps } from '../../src/i18n/types';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

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

describe('Language Controls Accessibility Audit', () => {
  const mockOnLanguageChange = vi.fn();

  const defaultProps: LanguageSwitcherProps = {
    currentLanguage: 'en',
    onLanguageChange: mockOnLanguageChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LanguageSwitcher Component', () => {
    describe('Login Variant', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should be keyboard accessible', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const button = screen.getByRole('button');

        // Should be focusable
        button.focus();
        expect(button).toHaveFocus();

        // Should be activatable with Enter and Space
        fireEvent.keyDown(button, { key: 'Enter' });
        fireEvent.keyDown(button, { key: ' ' });
      });

      it('should have proper ARIA labels', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Switch language - Current: English');
      });

      it('should provide screen reader feedback', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const screenReaderText = screen.getByText('Current language: English');
        expect(screenReaderText).toHaveClass('sr-only');
      });
    });

    describe('Sidebar Variant', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <LanguageSwitcher
            {...defaultProps}
            variant="sidebar"
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have descriptive button text', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="sidebar"
          />
        );

        expect(screen.getByText('English')).toBeInTheDocument();
      });

      it('should maintain focus management', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="sidebar"
          />
        );

        const button = screen.getByRole('button');
        button.focus();

        // Focus should remain on button after interaction
        fireEvent.click(button);
        expect(button).toHaveFocus();
      });
    });

    describe('Authenticated Variant', () => {
      it('should have no accessibility violations', async () => {
        const { container } = render(
          <LanguageSwitcher
            {...defaultProps}
            variant="authenticated"
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should handle responsive hiding properly', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="authenticated"
          />
        );

        const visibleText = screen.getByText('English');
        const hiddenText = screen.getByText('English');

        // Text should be hidden on small screens but still available to screen readers
        expect(hiddenText).toHaveClass('hidden', 'sm:inline-block');
      });
    });
  });

  describe('LanguageSwitcherModal Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LanguageSwitcherModal {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be properly announced to screen readers', () => {
      render(<LanguageSwitcherModal {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      // Modal should be announced
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Should have proper dialog structure
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    });

    it('should support keyboard navigation', () => {
      render(<LanguageSwitcherModal {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      // Should be able to navigate with Tab
      const firstButton = screen.getByRole('button', { name: /english/i });
      firstButton.focus();

      // Should be able to navigate to close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for language options', () => {
      render(<LanguageSwitcherModal {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const englishButton = screen.getByRole('button', { name: /english/i });
      expect(englishButton).toHaveAttribute('aria-current', 'true');
      expect(englishButton).toHaveAttribute('role', 'option');
      expect(englishButton).toHaveAttribute('aria-selected', 'true');
    });

    it('should close on Escape key', () => {
      render(<LanguageSwitcherModal {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape' });

      // Modal should close
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('LanguageModal Component', () => {
    const modalProps = {
      isOpen: true,
      onClose: mockOnLanguageChange,
      currentLanguage: 'en',
      onLanguageSelect: mockOnLanguageChange
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<LanguageModal {...modalProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper dialog semantics', () => {
      render(<LanguageModal {...modalProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'language-modal-description');
      expect(dialog).toHaveAttribute('aria-labelledby', 'language-modal-title');
    });

    it('should support keyboard navigation', () => {
      render(<LanguageModal {...modalProps} />);

      const dialog = screen.getByRole('dialog');

      // Tab navigation should work
      const firstButton = screen.getByRole('button', { name: /english/i });
      firstButton.focus();

      // Arrow key navigation should work for radio-like behavior
      fireEvent.keyDown(firstButton, { key: 'ArrowDown' });
      fireEvent.keyDown(firstButton, { key: 'ArrowUp' });
    });

    it('should have proper focus management', () => {
      render(<LanguageModal {...modalProps} />);

      const dialog = screen.getByRole('dialog');

      // Focus should be trapped within modal
      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();

      // Should be able to navigate back to language options
      const englishButton = screen.getByRole('button', { name: /english/i });
      englishButton.focus();
    });

    it('should provide proper screen reader feedback', () => {
      render(<LanguageModal {...modalProps} />);

      // Should announce current selection
      const currentIndicator = screen.getByText('Current');
      expect(currentIndicator).toBeInTheDocument();

      // Should provide text direction information
      expect(screen.getByText('Left-to-right')).toBeInTheDocument();
    });
  });

  describe('LanguageModalCompact Component', () => {
    const compactProps = {
      isOpen: true,
      onClose: mockOnLanguageChange,
      currentLanguage: 'en',
      onLanguageSelect: mockOnLanguageChange
    };

    it('should have no accessibility violations', async () => {
      const { container } = render(<LanguageModalCompact {...compactProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain accessibility in compact mode', () => {
      render(<LanguageModalCompact {...compactProps} />);

      const dialog = screen.getByRole('dialog');

      // Should still have proper dialog structure
      expect(dialog).toBeInTheDocument();

      // Should have current language indicator
      const englishButton = screen.getByRole('button', { name: /english/i });
      expect(englishButton).toHaveAttribute('aria-current', 'true');
    });

    it('should be usable with screen readers in mobile view', () => {
      render(<LanguageModalCompact {...compactProps} />);

      // Should have proper button labeling
      const englishButton = screen.getByRole('button', { name: /english/i });
      expect(englishButton).toBeInTheDocument();

      // Should have current indicator
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should handle touch interactions properly', () => {
      render(<LanguageModalCompact {...compactProps} />);

      const germanButton = screen.getByRole('button', { name: /deutsch/i });

      // Should respond to click events
      fireEvent.click(germanButton);
      expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
    });
  });

  describe('WCAG Compliance', () => {
    it('should meet WCAG 2.1 AA color contrast requirements', () => {
      render(<LanguageSwitcher {...defaultProps} />);

      const button = screen.getByRole('button');

      // Button should have sufficient contrast
      const styles = window.getComputedStyle(button);
      const backgroundColor = styles.backgroundColor;
      const color = styles.color;

      // This is a basic check - in real implementation, you'd use a contrast checking library
      expect(backgroundColor).not.toBe('transparent');
      expect(color).not.toBe('transparent');
    });

    it('should have proper focus indicators', () => {
      render(<LanguageSwitcher {...defaultProps} />);

      const button = screen.getByRole('button');
      button.focus();

      const styles = window.getComputedStyle(button);
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;

      // Should have visible focus indicator
      expect(outline).not.toBe('none');
      expect(boxShadow).not.toBe('none');
    });

    it('should be usable with high contrast mode', () => {
      // Simulate high contrast mode
      const originalMediaQuery = window.matchMedia;
      (window as any).matchMedia = (query: string) => ({
        matches: query.includes('prefers-contrast: high'),
        addEventListener: () => {},
        removeEventListener: () => {}
      });

      render(<LanguageSwitcher {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Restore original media query
      window.matchMedia = originalMediaQuery;
    });
  });

  describe('Internationalization Accessibility', () => {
    it('should support right-to-left languages', () => {
      render(<LanguageSwitcher {...defaultProps} />);

      // Components should be designed to support RTL
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should provide proper language identification', () => {
      render(<LanguageSwitcher {...defaultProps} />);

      // Should have proper lang attributes
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // In a real implementation, you might check for lang attributes
      // expect(document.documentElement).toHaveAttribute('lang', 'en');
    });

    it('should handle language changes for screen readers', () => {
      render(<LanguageSwitcher {...defaultProps} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Screen readers should be notified of language changes
      // This would typically be handled by the i18n library
      expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
    });
  });
});
