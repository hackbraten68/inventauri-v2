/**
 * GET /api/translations/{lang} endpoint
 * Loads translation strings for a specific language with fallback support
 */

import type { APIRoute } from 'astro';
import { loadTranslations } from '../../../i18n/utils';
import { SUPPORTED_LANGUAGES } from '../../../i18n/config';

export const GET: APIRoute = async ({ params, request }) => {
  try {
    const languageCode = params.lang;

    if (!languageCode) {
      return new Response(
        JSON.stringify({
          error: 'MISSING_LANGUAGE_PARAMETER',
          message: 'Language parameter is required in URL path'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Validate language code format (should be 2 lowercase letters)
    if (!/^[a-z]{2}$/.test(languageCode)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_LANGUAGE_FORMAT',
          message: 'Language code must be exactly 2 lowercase letters'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check if language is supported
    const supportedLanguages = SUPPORTED_LANGUAGES.map((lang: any) => lang.code);
    if (!supportedLanguages.includes(languageCode)) {
      return new Response(
        JSON.stringify({
          error: 'UNSUPPORTED_LANGUAGE',
          message: `Language '${languageCode}' is not supported`,
          supportedLanguages
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Load translations
    const translations = await loadTranslations({
      language: languageCode,
      fallbackLanguage: 'en',
      cacheTranslations: true,
      logMissingTranslations: true
    });

    // Return translations with metadata
    return new Response(
      JSON.stringify({
        language: languageCode,
        translations,
        supportedLanguages
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'X-Language': languageCode
        }
      }
    );

  } catch (error) {
    console.error('Translation loading error:', error);

    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while loading translations'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
