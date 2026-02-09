import type { MiddlewareHandler } from 'astro';
import { getSetupStatus } from './lib/data/setup';

const PROTECTED_PREFIXES = ['/dashboard', '/inventory', '/pos', '/items'];
const LOCALE_PROTECTED_PREFIXES = ['/en/dashboard', '/en/inventory', '/en/pos', '/en/items', '/de/dashboard', '/de/inventory', '/de/pos', '/de/items'];
const NON_PROTECTED_PREFIXES = ['/api', '/setup', '/_astro', '/@fs', '/@id', '/node_modules', '/src', '/favicon', '/public'];
const AUTH_COOKIE_NAME = 'pb-access-token';

function requiresAuth(pathname: string) {
  return PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ) || LOCALE_PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function hasAccessCookie(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  return cookieHeader?.split(';').some((cookie) => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`)) ?? false;
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, redirect, url } = context;
  const pathname = url.pathname;

  // Redirect old routes to new [locale] routes
  const oldRoutes = ['/', '/login', '/dashboard', '/inventory', '/pos', '/items', '/settings'];
  if (oldRoutes.includes(pathname)) {
    const searchParams = url.search;
    // Default to English for now - could be made smarter with browser locale detection
    const newUrl = `/en${pathname}${searchParams}`;
    return redirect(newUrl, 301);
  }

  if (NON_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return next();
  }

  // Setup check (cached or only for relevant routes)
  if (pathname !== '/setup' && !pathname.startsWith('/api/setup')) {
    const status = await getSetupStatus();
    if (!status.isInitialized) {
      return redirect('/setup');
    }
  }

  if (requiresAuth(pathname) && !hasAccessCookie(request)) {
    const searchParams = new URLSearchParams({ redirectTo: pathname });
    return redirect(`/login?${searchParams.toString()}`);
  }

  return next();
};
