import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false
    })
  ],
  // Language routing configuration
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: {
      prefixDefaultLocale: false // Use ?lang= parameter instead of subdirectories
    }
  },
  // Middleware configuration for language detection
  middleware: {
    // Language detection middleware is already configured in src/middleware.ts
    // This ensures language detection runs before page rendering
  },
  // Vite configuration for development
  vite: {
    define: {
      // Make supported languages available to client-side code
      __SUPPORTED_LANGUAGES__: JSON.stringify(['en', 'de']),
      __DEFAULT_LANGUAGE__: JSON.stringify('en'),
      // Make Supabase config available to client-side code
      __SUPABASE_URL__: JSON.stringify(process.env.PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'),
      __SUPABASE_ANON_KEY__: JSON.stringify(process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0')
    }
  }
});
