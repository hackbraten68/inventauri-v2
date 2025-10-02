/**
 * Main application layout with I18nProvider for authenticated pages
 * This component wraps all React components with the translation context
 */

import React from 'react';
import { I18nProvider } from '../../i18n/react-integration';
import { LogoutButton } from '../auth/LogoutButton';
import { LanguageSwitcher } from '../ui/language-switcher';

interface AppLayoutProps {
  children: React.ReactNode;
  currentLanguage: string;
}

export function AppLayoutWithI18n({ children, currentLanguage }: AppLayoutProps) {
  const handleLanguageChange = (lang: string) => {
    if (lang !== currentLanguage) {
      window.location.href = `${window.location.pathname}?lang=${lang}`;
    }
  };

  return (
    <I18nProvider initialLanguage={currentLanguage}>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="flex flex-col border-b border-r border-border bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/70 md:sticky md:top-0 md:h-screen md:w-64">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Inventauri</p>
              <p className="text-lg font-bold text-foreground">Control Center</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">IA</span>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <a href="/dashboard" className="group block rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
              <p className="text-sm font-medium">Dashboard</p>
              <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Overview and trends</p>
            </a>
            <a href="/inventory" className="group block rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
              <p className="text-sm font-medium">Inventory</p>
              <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Item overview and stock levels</p>
            </a>
            <a href="/pos" className="group block rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
              <p className="text-sm font-medium">Point of Sale</p>
              <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Quick transactions and sales</p>
            </a>
            <a href="/items" className="group block rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
              <p className="text-sm font-medium">Items</p>
              <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Products, variants and suppliers</p>
            </a>
            <a href="/items/new" className="group block rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
              <p className="text-sm font-medium">Add Item</p>
              <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">Create new products</p>
            </a>
          </nav>
          <div className="border-t border-border px-3 py-4">
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 bg-background">
          <header className="flex flex-col gap-4 border-b border-border bg-card/40 px-6 py-6 backdrop-blur supports-[backdrop-filter]:bg-card/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inventauri</h1>
              <p className="text-sm text-muted-foreground">Lightweight inventory for micro-shops</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden flex-col text-right text-sm text-muted-foreground sm:flex">
                <span className="font-medium text-foreground">Demo Benutzer</span>
                <span>demo@inventauri.app</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-secondary" />
              <LanguageSwitcher
                currentLanguage={currentLanguage}
                onLanguageChange={handleLanguageChange}
              />
            </div>
          </header>
          <div className="container mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </I18nProvider>
  );
}
