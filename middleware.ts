import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicPaths = ['/auth/signin', '/api/auth/callback'];
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  );

  // If it's a public path, continue
  if (isPublicPath) {
    return response;
  }

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res: response });
  
  // Get the session
  const { data: { session } } = await supabase.auth.getSession();

  // Redirect to signin if not authenticated
  if (!session) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Add user info to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.user.id);

  // Get organization ID from the URL or cookie
  const orgId = request.nextUrl.pathname.split('/')[2] || request.cookies.get('org-id')?.value;

  if (orgId) {
    // Here you would typically check if the user has access to this organization
    // For now, we'll just set the header if an org ID is present
    requestHeaders.set('x-org-id', orgId);

    // Set the organization ID in a cookie for client-side access
    response.cookies.set('org-id', orgId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which routes the middleware will run on
export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - api/auth (NextAuth API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public folder
    '/((?!api/auth|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
