/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { Language } from './i18n/types';

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace App {
    interface Locals {
      language: string; // Current detected language code
      supportedLanguages: Language[]; // All supported languages
      user?: {
        id: string;
        email: string;
        // Add other user properties as needed
      };
    }
  }
}
