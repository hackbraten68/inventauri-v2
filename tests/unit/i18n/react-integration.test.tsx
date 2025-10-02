import React, { useEffect } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n } from '../../../src/i18n/react-integration';
import { I18nProviderWrapper } from '../../../src/components/providers/I18nProviderWrapper';

vi.mock('../../../src/i18n/utils', () => ({
  loadTranslations: vi.fn().mockResolvedValue({})
}));

const ORIGIN = 'http://localhost';

const createMockLocation = (url: string) => {
  const parsed = new URL(url, `${ORIGIN}/`);
  return {
    href: parsed.toString(),
    search: parsed.search,
    pathname: parsed.pathname,
    hash: parsed.hash,
    origin: parsed.origin,
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    toString: () => parsed.toString()
  };
};

let mockLocation = createMockLocation(`${ORIGIN}/`);

const setMockLocation = (url: string) => {
  const parsed = new URL(url, `${ORIGIN}/`);
  mockLocation.href = parsed.toString();
  mockLocation.search = parsed.search;
  mockLocation.pathname = parsed.pathname;
  mockLocation.hash = parsed.hash;
  mockLocation.origin = parsed.origin;
};

Object.defineProperty(window, 'location', {
  configurable: true,
  get: () => mockLocation,
  set: (value: string | URL) => {
    const next = typeof value === 'string' ? value : value.toString();
    setMockLocation(next);
  }
});

const applyHistoryUrl = (url?: string | URL | null) => {
  if (!url) {
    return;
  }
  setMockLocation(typeof url === 'string' ? url : url.toString());
};

let pushStateSpy: MockInstance<any, any>;
let replaceStateSpy: MockInstance<any, any>;

describe('React I18n Integration', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
    mockLocation = createMockLocation(`${ORIGIN}/`);
    pushStateSpy = vi.spyOn(window.history, 'pushState').mockImplementation((state, title, url) => {
      applyHistoryUrl(url);
    });
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation((state, title, url) => {
      applyHistoryUrl(url);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
    mockLocation = createMockLocation(`${ORIGIN}/`);
  });

  describe('I18nProvider', () => {
    it('initializes language from localStorage when available', async () => {
      window.localStorage.setItem('preferredLanguage', 'de');

      const TestComponent = () => {
        const { language } = useI18n();
        return <span data-testid="language">{language}</span>;
      };

      render(
        <I18nProvider initialLanguage="en">
          <TestComponent />
        </I18nProvider>
      );

      await act(async () => {});

      expect(screen.getByTestId('language').textContent).toBe('de');
    });

    it('prefers URL parameter over localStorage on first render', async () => {
      window.localStorage.setItem('preferredLanguage', 'en');
      setMockLocation('?lang=de');

      const TestComponent = () => {
        const { language } = useI18n();
        return <span data-testid="language">{language}</span>;
      };

      render(
        <I18nProvider initialLanguage="en">
          <TestComponent />
        </I18nProvider>
      );

      await act(async () => {});

      expect(screen.getByTestId('language').textContent).toBe('de');
      expect(window.localStorage.getItem('preferredLanguage')).toBe('de');
    });

    it('persists language changes to localStorage and URL', async () => {
      let changeLanguageRef: ((language: string, source?: string) => Promise<void>) | undefined;

      const TestComponent = () => {
        const { language, changeLanguage } = useI18n();
        useEffect(() => {
          changeLanguageRef = changeLanguage;
        }, [changeLanguage]);

        return <span data-testid="language">{language}</span>;
      };

      render(
        <I18nProvider initialLanguage="en">
          <TestComponent />
        </I18nProvider>
      );

      expect(screen.getByTestId('language').textContent).toBe('en');

      await act(async () => {
        await changeLanguageRef?.('de', 'test');
      });

      expect(window.localStorage.getItem('preferredLanguage')).toBe('de');
      expect(pushStateSpy.mock.calls.at(-1)?.[2]).toContain('lang=de');
    });
  });

  describe('I18nProviderWrapper', () => {
    it('resolves initial language from URL and persists it', async () => {
      applyHistoryUrl(`${ORIGIN}/?lang=de`);

      const TestComponent = () => {
        const { language } = useI18n();
        return <span data-testid="language">{language}</span>;
      };

      render(
        <I18nProviderWrapper initialLanguage="en">
          <TestComponent />
        </I18nProviderWrapper>
      );

      await act(async () => {});

      expect(screen.getByTestId('language').textContent).toBe('de');
      expect(window.localStorage.getItem('preferredLanguage')).toBe('de');
    });

    it('syncs URL when language changes', async () => {
      let changeLanguageRef: ((language: string, source?: string) => Promise<void>) | undefined;

      const TestComponent = () => {
        const { changeLanguage } = useI18n();
        useEffect(() => {
          changeLanguageRef = changeLanguage;
        }, [changeLanguage]);
        return null;
      };

      render(
        <I18nProviderWrapper initialLanguage="en">
          <TestComponent />
        </I18nProviderWrapper>
      );

      await act(async () => {
        await changeLanguageRef?.('de', 'test');
      });

      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).toContain('lang=de');

      await act(async () => {
        await changeLanguageRef?.('en', 'test');
      });

      expect(replaceStateSpy.mock.calls.at(-1)?.[2]).not.toContain('lang=');
    });
  });
});
