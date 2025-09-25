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
  return cookieHeader?.split(';').some((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`)) ?? false;
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

  // 3. Return default language
  return DEFAULT_LANGUAGE;
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

        return redirect(redirectUrl.toString());
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
