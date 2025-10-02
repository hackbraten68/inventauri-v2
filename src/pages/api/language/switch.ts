/**
 * POST /api/language/switch endpoint
 * Switches the application language and updates the user session
 */

import type { APIRoute } from 'astro';
import { updateLanguageInUrl } from '../../../i18n/utils';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../../../i18n/config';
import type { LanguageResponse } from '../../../i18n/types';

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    // Parse form data
    const formData = await request.formData();
    const languageCode = formData.get('language') as string;
    const persist = formData.get('persist') !== 'false'; // Default to true

    if (!languageCode) {
      return new Response(
        JSON.stringify({
          error: 'MISSING_LANGUAGE_CODE',
          message: 'Language code is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get supported language codes
    const supportedLanguages = SUPPORTED_LANGUAGES.map((lang: any) => lang.code);

    // Validate language code
    if (!supportedLanguages.includes(languageCode)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_LANGUAGE_CODE',
          message: 'The provided language code is not supported',
          supportedLanguages
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Get the language configuration
    const languageConfig = SUPPORTED_LANGUAGES.find((lang: any) => lang.code === languageCode);

    if (!languageConfig) {
      return new Response(
        JSON.stringify({
          error: 'LANGUAGE_CONFIG_NOT_FOUND',
          message: `Language configuration not found for: ${languageCode}`
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Update URL with new language
    updateLanguageInUrl(languageCode);

    // Create response
    const response: LanguageResponse = {
      code: languageConfig.code,
      name: languageConfig.name,
      nativeName: languageConfig.nativeName,
      flagIcon: languageConfig.flagIcon,
      isDefault: languageConfig.isDefault,
      textDirection: languageConfig.textDirection
    };

    // Get the current URL for redirect
    const currentUrl = new URL(request.url);
    const redirectPath = formData.get('redirectTo') as string || '/';

    // Build redirect URL with new language
    const redirectUrl = new URL(redirectPath, currentUrl.origin);
    if (languageCode !== DEFAULT_LANGUAGE) {
      redirectUrl.searchParams.set('lang', languageCode);
    }

    // Return success response with redirect
    return new Response(
      JSON.stringify({
        ...response,
        redirectTo: redirectUrl.toString(),
        persisted: persist
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Redirect-To': redirectUrl.toString()
        }
      }
    );

  } catch (error) {
    console.error('Language switching error:', error);

    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred while switching language'
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
