import type { APIRoute } from 'astro';
export const prerender = false;
import PocketBase from 'pocketbase';
import { json, errorResponse } from '../../../lib/api/response';
import { serializeAuthCookies } from '../../../lib/auth/pocketbase-session';

const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;
const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!pocketbaseUrl) {
      return errorResponse('PocketBase URL nicht konfiguriert.', 500);
    }

    const payload = await request.json();
    const email = typeof payload?.email === 'string' ? payload.email : '';
    const password = typeof payload?.password === 'string' ? payload.password : '';

    if (!email || !password) {
      return errorResponse('E-Mail und Passwort sind erforderlich.', 400);
    }

    const client = new PocketBase(pocketbaseUrl);
    let authData;
    let isAdmin = false;

    // Check if it's the system admin
    if (PB_ADMIN_EMAIL && email.toLowerCase() === PB_ADMIN_EMAIL.toLowerCase()) {
      try {
        console.log('Login attempt for system admin...');
        authData = await client.admins.authWithPassword(email, password);
        isAdmin = true;
      } catch (adminErr) {
        console.error('System Admin Auth failed:', adminErr instanceof Error ? adminErr.message : 'Unknown');
        // If admin login fails, we don't try regular collection login for this email
        return errorResponse('Admin Login fehlgeschlagen.', 401);
      }
    } else {
      // Regular user login
      authData = await client.collection('users').authWithPassword(email, password);
    }

    if (!client.authStore.token) {
      return errorResponse('PocketBase Session fehlt.', 500);
    }

    const headers = new Headers();
    serializeAuthCookies({
      accessToken: client.authStore.token,
      refreshToken: client.authStore.token // temp fix
    }).forEach((cookie) => headers.append('set-cookie', cookie));

    const responseBody = {
      user: isAdmin ? { email, id: 'admin', role: 'superadmin' } : authData.record,
      tokens: {
        accessToken: client.authStore.token,
        refreshToken: client.authStore.token,
        accessExpiresIn: 60 * 60,
        refreshExpiresIn: 60 * 60 * 24 * 7
      }
    };

    return json(responseBody, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login fehlgeschlagen.';
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status: number }).status : 401;
    return errorResponse(message, status);
  }
};
