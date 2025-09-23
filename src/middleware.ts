import type { MiddlewareHandler } from 'astro';

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

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, redirect, url } = context;
  const pathname = url.pathname;

  if (NON_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return next();
  }

  if (requiresAuth(pathname) && !hasAccessCookie(request)) {
    const searchParams = new URLSearchParams({ redirectTo: pathname });
    return redirect(`/login?${searchParams.toString()}`);
  }

  return next();
};
