import { useContext } from 'react';
import { LocaleContext } from './context';
import { createTranslator, formatCurrency, formatNumber, formatDate, formatDateTime } from './utils';
import type { Locale } from './constants';
import { DEFAULT_LOCALE } from './constants';

/**
 * Hook for translations in React components
 */
export function useTranslation() {
  const locale = useContext(LocaleContext) || DEFAULT_LOCALE;
  const t = createTranslator(locale);
  
  return {
    t,
    locale,
    formatCurrency: (amount: number) => formatCurrency(amount, locale),
    formatNumber: (number: number) => formatNumber(number, locale),
    formatDate: (date: Date) => formatDate(date, locale),
    formatDateTime: (date: Date) => formatDateTime(date, locale)
  };
}