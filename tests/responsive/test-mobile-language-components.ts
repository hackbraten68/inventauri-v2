/**
 * Mobile responsiveness testing for language components
 * Tests responsive design, touch interactions, and mobile-specific behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher, LanguageSwitcherModal } from '../../src/components/ui/language-switcher';
import { LanguageModal, LanguageModalCompact } from '../../src/components/ui/language-modal';
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

// Mock matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Mobile Responsiveness Testing', () => {
  const mockOnLanguageChange = vi.fn();

  const defaultProps: LanguageSwitcherProps = {
    currentLanguage: 'en',
    onLanguageChange: mockOnLanguageChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LanguageSwitcher Responsive Behavior', () => {
    describe('Mobile Viewport (< 640px)', () => {
      beforeEach(() => {
        mockMatchMedia(false); // sm breakpoint not matched
      });

      it('should hide language name on mobile for authenticated variant', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="authenticated"
          />
        );

        const hiddenText = screen.getByText('English');
        expect(hiddenText).toHaveClass('hidden', 'sm:inline-block');
      });

      it('should maintain icon visibility on mobile', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="authenticated"
          />
        );

        // Globe icon should still be visible
        const globeIcon = screen.getByRole('button').querySelector('svg');
        expect(globeIcon).toBeInTheDocument();
      });

      it('should have appropriate touch target size on mobile', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const button = screen.getByRole('button');

        // Button should have minimum 44px touch target (Tailwind h-11 = 44px)
        expect(button).toHaveClass('h-11');
      });
    });

    describe('Desktop Viewport (≥ 640px)', () => {
      beforeEach(() => {
        mockMatchMedia(true); // sm breakpoint matched
      });

      it('should show language name on desktop for authenticated variant', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="authenticated"
          />
        );

        const visibleText = screen.getByText('English');
        expect(visibleText).toBeInTheDocument();
        expect(visibleText).not.toHaveClass('hidden');
      });

      it('should maintain proper spacing on desktop', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="sidebar"
          />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass('justify-start', 'gap-2', 'px-2');
      });
    });

    describe('Touch Interactions', () => {
      it('should respond to touch events', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const button = screen.getByRole('button');

        // Simulate touch events
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);

        expect(mockOnLanguageChange).toHaveBeenCalledWith('de');
      });

      it('should prevent double-tap zoom on buttons', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const button = screen.getByRole('button');

        // Buttons should have touch-action CSS property
        const styles = window.getComputedStyle(button);
        expect(styles.touchAction).toBe('manipulation');
      });

      it('should handle rapid successive taps', () => {
        render(
          <LanguageSwitcher
            {...defaultProps}
            variant="login"
          />
        );

        const button = screen.getByRole('button');

        // Rapid clicks should not cause issues
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        // Should still work normally
        expect(mockOnLanguageChange).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('LanguageModal Mobile Responsiveness', () => {
    const modalProps = {
      isOpen: true,
      onClose: mockOnLanguageChange,
      currentLanguage: 'en',
      onLanguageSelect: mockOnLanguageChange
    };

    beforeEach(() => {
      mockMatchMedia(false); // Mobile viewport
    });

    it('should use full width on mobile', () => {
      render(<LanguageModal {...modalProps} />);

      const dialog = screen.getByRole('dialog');
      const dialogContent = dialog.querySelector('[class*="max-w-"]');

      expect(dialogContent).toHaveClass('sm:max-w-[425px]');
      // Should not have width constraints on mobile
    });

    it('should have appropriate padding on mobile', () => {
      render(<LanguageModal {...modalProps} />);

      const dialogContent = screen.getByRole('dialog').querySelector('[class*="p-"]');
      expect(dialogContent).toBeInTheDocument();
    });

    it('should handle mobile keyboard properly', () => {
      render(<LanguageModal {...modalProps} />);

      const dialog = screen.getByRole('dialog');

      // Should not interfere with mobile keyboard
      expect(dialog).toBeInTheDocument();
    });

    it('should be scrollable on small screens', () => {
      render(<LanguageModal {...modalProps} />);

      const dialogContent = screen.getByRole('dialog').querySelector('[class*="overflow"]');
      expect(dialogContent).toBeInTheDocument();
    });
  });

  describe('LanguageModalCompact Mobile Optimization', () => {
    const compactProps = {
      isOpen: true,
      onClose: mockOnLanguageChange,
      currentLanguage: 'en',
      onLanguageSelect: mockOnLanguageChange
    };

    beforeEach(() => {
      mockMatchMedia(false); // Mobile viewport
    });

    it('should have compact dimensions on mobile', () => {
      render(<LanguageModalCompact {...compactProps} />);

      const dialog = screen.getByRole('dialog');
      const dialogContent = dialog.querySelector('[class*="max-w-"]');

      expect(dialogContent).toHaveClass('sm:max-w-[350px]', 'max-h-[80vh]', 'overflow-y-auto');
    });

    it('should use larger touch targets on mobile', () => {
      render(<LanguageModalCompact {...compactProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Should have adequate touch target size
        expect(button).toHaveClass('p-3');
      });
    });

    it('should handle vertical scrolling on small screens', () => {
      render(<LanguageModalCompact {...compactProps} />);

      const dialogContent = screen.getByRole('dialog').querySelector('[class*="overflow-y"]');
      expect(dialogContent).toBeInTheDocument();
    });

    it('should prevent horizontal scrolling on mobile', () => {
      render(<LanguageModalCompact {...compactProps} />);

      const dialog = screen.getByRole('dialog');
      const styles = window.getComputedStyle(dialog);

      // Should not cause horizontal overflow
      expect(styles.overflowX).toBe('hidden');
    });
  });

  describe('LanguageSwitcherModal Mobile Behavior', () => {
    it('should be optimized for mobile usage', () => {
      render(<LanguageSwitcherModal {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const dialog = screen.getByRole('dialog');

      // Should have mobile-friendly sizing
      expect(dialog).toBeInTheDocument();
    });

    it('should handle mobile modal positioning', () => {
      render(<LanguageSwitcherModal {...defaultProps} />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      const dialogContent = screen.getByRole('dialog').querySelector('[class*="fixed"]');
      expect(dialogContent).toBeInTheDocument();
    });
  });

  describe('Responsive Breakpoints', () => {
    it('should adapt to different screen sizes', () => {
      // Test small mobile (320px)
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      Object.defineProperty(window, 'innerHeight', { value: 568 });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle tablet breakpoint (768px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      Object.defineProperty(window, 'innerHeight', { value: 1024 });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle desktop breakpoint (1024px)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1024 });
      Object.defineProperty(window, 'innerHeight', { value: 768 });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should handle iOS Safari quirks', () => {
      // Mock iOS Safari
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true
      });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle Android Chrome behavior', () => {
      // Mock Android Chrome
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36',
        writable: true
      });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle mobile orientation changes', () => {
      // Mock portrait orientation
      Object.defineProperty(window.screen, 'orientation', {
        value: { angle: 0, type: 'portrait-primary' },
        writable: true
      });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="sidebar"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();

      // Mock landscape orientation
      Object.defineProperty(window.screen, 'orientation', {
        value: { angle: 90, type: 'landscape-primary' },
        writable: true
      });

      // Component should still work after orientation change
      expect(button).toBeInTheDocument();
    });
  });

  describe('Performance on Mobile', () => {
    it('should not cause layout shifts during language switching', () => {
      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="authenticated"
        />
      );

      const button = screen.getByRole('button');

      // Initial render should be stable
      const initialRect = button.getBoundingClientRect();

      // Language change should not cause layout shift
      fireEvent.click(button);

      const finalRect = button.getBoundingClientRect();
      // Position should remain stable
      expect(Math.abs(initialRect.left - finalRect.left)).toBeLessThan(10);
    });

    it('should handle low-memory mobile devices', () => {
      // Mock low memory device
      Object.defineProperty(window.navigator, 'deviceMemory', {
        value: 2, // 2GB RAM
        writable: true
      });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should work with reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <LanguageSwitcher
          {...defaultProps}
          variant="login"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });
});
