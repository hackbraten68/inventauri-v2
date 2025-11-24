import type { APIRoute } from 'astro';
export const prerender = false;
import { json } from '../../../lib/api/response';
import {
  extractTokensFromRequest,
  refreshPocketBaseSession,
  serializeAuthCookies,
  clearAuthCookies
} from '../../../lib/auth/pocketbase-session';

export const GET: APIRoute = async ({ request }) => {
  try {
    const tokens = extractTokensFromRequest(request);
    if (!tokens.accessToken || !tokens.refreshToken) {
      throw Object.assign(new Error('Nicht authentifiziert'), { status: 401 });
    }

    const refreshed = await refreshPocketBaseSession(tokens);
    const headers = new Headers();
    serializeAuthCookies({
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken
    }).forEach((cookie) => headers.append('set-cookie', cookie));

    return json(
      {
        sessionValid: true,
        expiresAt: refreshed.expiresAt,
        user: refreshed.user,
        tokens: {
          accessToken: refreshed.accessToken
        }
      },
      { headers }
    );
  } catch (error) {
    const headers = new Headers();
    clearAuthCookies().forEach((cookie) => headers.append('set-cookie', cookie));
    headers.set('content-type', 'application/json; charset=utf-8');
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status: number }).status : 401;
    return new Response(JSON.stringify({ error: 'Nicht authentifiziert' }), {
      status,
      headers
    });
  }
};
