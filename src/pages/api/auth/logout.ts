import type { APIRoute } from 'astro';
export const prerender = false;
import { clearAuthCookies } from '../../../lib/auth/pocketbase-session';

export const POST: APIRoute = async () => {
  const headers = new Headers();
  clearAuthCookies().forEach((cookie) => headers.append('set-cookie', cookie));
  return new Response(null, { status: 204, headers });
};
