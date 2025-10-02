/**
 * GET /api/language/detect endpoint
 * Detects the user's preferred language based on URL parameters and browser settings
 */

import type { APIRoute } from 'astro';
import { detectLanguage } from '../../../i18n/utils';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../../i18n/config';
import type { LanguageResponse } from '../../../i18n/types';

export const GET: APIRoute = async ({ request }) => {
  try {
    // Get supported language codes
    const supportedLanguages = SUPPORTED_LANGUAGES.map((lang: any) => lang.code);

    // Detect language
    const detectedLanguage = detectLanguage({
      supportedLanguages,
      defaultLanguage: DEFAULT_LANGUAGE,
      fallbackToBrowserLanguage: true
    });

    // Get the language configuration
    const languageConfig = SUPPORTED_LANGUAGES.find((lang: any) => lang.code === detectedLanguage);

    if (!languageConfig) {
      return new Response(
        JSON.stringify({
          error: 'LANGUAGE_CONFIG_NOT_FOUND',
          message: `Language configuration not found for: ${detectedLanguage}`
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Return the detected language configuration
    const response: LanguageResponse = {
      code: languageConfig.code,
      name: languageConfig.name,
      nativeName: languageConfig.nativeName,
      flagIcon: languageConfig.flagIcon,
      isDefault: languageConfig.isDefault,
      textDirection: languageConfig.textDirection
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    );

  } catch (error) {
    console.error('Language detection error:', error);

    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while detecting language'
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
