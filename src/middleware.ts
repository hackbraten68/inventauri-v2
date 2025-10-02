import type { MiddlewareHandler } from 'astro';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from './i18n/config';

const PROTECTED_PREFIXES = ['/dashboard', '/inventory', '/pos', '/items'];
const NON_PROTECTED_PREFIXES = ['/api', '/_astro', '/@fs', '/@id', '/node_modules', '/src', '/favicon', '/public'];
const AUTH_COOKIE_NAME = 'sb-access-token';

function requiresAuth(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function hasAccessCookie(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return false;
  }

  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const accessTokenCookie = cookies.find(cookie => cookie.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!accessTokenCookie) {
    return false;
  }

  const token = accessTokenCookie.split('=')[1];
  return token && token.length > 0;
}

function detectLanguageFromRequest(request: Request): string {
  // Get supported language codes
  const supportedLanguages = SUPPORTED_LANGUAGES.map(lang => lang.code);

  // 1. Check URL parameter first (?lang=de)
  const url = new URL(request.url);
  const urlLanguage = url.searchParams.get('lang');

  if (urlLanguage && supportedLanguages.includes(urlLanguage)) {
    return urlLanguage;
  }

  // 2. Check Accept-Language header (browser preference)
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const browserLanguage = acceptLanguage.split(',')[0]?.split('-')[0]; // Get primary language code
    if (browserLanguage && supportedLanguages.includes(browserLanguage)) {
      return browserLanguage;
    }
  }

  // 3. Enhanced browser language detection with quality values
  if (acceptLanguage) {
    const languagePreferences = acceptLanguage.split(',')
      .map(lang => {
        const [code, quality = '1'] = lang.trim().split(';q=');
        return {
          code: code.split('-')[0].toLowerCase(), // Normalize to primary language code
          quality: parseFloat(quality)
        };
      })
      .filter(lang => supportedLanguages.includes(lang.code))
      .sort((a, b) => b.quality - a.quality); // Sort by quality (highest first)

    if (languagePreferences.length > 0) {
      return languagePreferences[0].code;
    }
  }

  // 4. Check for language preferences in cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const langCookie = cookies.find(cookie => cookie.trim().startsWith('lang='));
    if (langCookie) {
      const cookieLang = langCookie.split('=')[1];
      if (supportedLanguages.includes(cookieLang)) {
        return cookieLang;
      }
    }
  }

  // 5. Return default language
  return DEFAULT_LANGUAGE;
}

function setLanguageCookie(language: string, response: Response): void {
  // Set language preference in cookie for persistence
  const cookieValue = `lang=${language}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  response.headers.set('Set-Cookie', cookieValue);
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, redirect, url } = context;
  const pathname = url.pathname;

  // Skip middleware for static assets and API routes
  if (
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.') // Skip files with extensions
  ) {
    return next();
  }

  // Get supported language codes
  const supportedLanguages = SUPPORTED_LANGUAGES.map(lang => lang.code);

  // Detect user's preferred language
  const detectedLanguage = detectLanguageFromRequest(request);

  // Handle language switching via POST request
  if (request.method === 'POST' && url.pathname === '/api/language/switch') {
    try {
      const formData = await request.formData();
      const newLanguage = formData.get('language') as string;

      if (newLanguage && supportedLanguages.includes(newLanguage)) {
        // Update URL with new language
        const redirectUrl = new URL(url.pathname, url.origin);
        if (newLanguage !== DEFAULT_LANGUAGE) {
          redirectUrl.searchParams.set('lang', newLanguage);
        }

        // Create response with language cookie
        const response = new Response(
          JSON.stringify({
            language: newLanguage,
            redirectTo: redirectUrl.toString()
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'X-Redirect-To': redirectUrl.toString()
            }
          }
        );

        setLanguageCookie(newLanguage, response);
        return response;
      }
    } catch (error) {
      console.error('Language switching error:', error);
    }
  }

  // Ensure URL has correct language parameter
  const currentLang = url.searchParams.get('lang');
  if (!currentLang || !supportedLanguages.includes(currentLang)) {
    // Set detected language if not already set
    if (detectedLanguage !== DEFAULT_LANGUAGE) {
      url.searchParams.set('lang', detectedLanguage);
      return redirect(url.toString());
    }
  }

  // Store detected language in locals for use in pages
  context.locals.language = detectedLanguage;
  context.locals.supportedLanguages = SUPPORTED_LANGUAGES;

  // Handle authentication
  if (NON_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return next();
  }

  if (requiresAuth(pathname) && !hasAccessCookie(request)) {
    const searchParams = new URLSearchParams({ redirectTo: pathname });
    return redirect(`/login?${searchParams.toString()}`);
  }

  return next();
};
