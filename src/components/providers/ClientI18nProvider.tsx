/**
 * Client-side I18nProvider wrapper for Astro pages
 * This component provides the I18n context for React components used in Astro pages
 */

import React, { useEffect, useState } from 'react';
import { I18nProvider } from '../../i18n/react-integration';

interface ClientI18nProviderProps {
  children: React.ReactNode;
  initialLanguage: string;
}

export function ClientI18nProvider({ children, initialLanguage }: ClientI18nProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Server-side rendering fallback
    return <div>{children}</div>;
  }

  return (
    <I18nProvider initialLanguage={initialLanguage}>
      {children}
    </I18nProvider>
  );
}
