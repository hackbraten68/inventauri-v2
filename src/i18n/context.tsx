import React, { createContext, useContext } from 'react';
import type { Locale } from './constants';
import { DEFAULT_LOCALE } from './constants';

const LocaleContext = createContext<Locale | null>(null);

export { LocaleContext };

interface LocaleProviderProps {
  children: React.ReactNode;
  locale: Locale;
}

export function LocaleProvider({ children, locale }: LocaleProviderProps) {
  return (
    <LocaleContext.Provider value={locale}>
      {children}
    </LocaleContext.Provider>
  );
}