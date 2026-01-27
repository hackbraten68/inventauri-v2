import type { Locale } from './constants';

export interface Translations {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    filter: string;
    loading: string;
    error: string;
    success: string;
    confirm: string;
    back: string;
    next: string;
    previous: string;
    close: string;
  };
  auth: {
    login: string;
    logout: string;
    email: string;
    password: string;
    loginFailed: string;
    loginInProgress: string;
    loginSuccess: string;
    logoutInProgress: string;
    logoutFailed: string;
    welcomeBack: string;
    loginToInventauri: string;
  };
  navigation: {
    dashboard: string;
    totalInventory: string;
    posWarehouse: string;
    itemManagement: string;
    addItem: string;
    settings: string;
  };
}

import en from './locales/en.json';
import de from './locales/de.json';

export const translations: Record<Locale, Translations> = {
  en,
  de
} as const;