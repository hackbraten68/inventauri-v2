import PocketBase, { getTokenPayload, type RecordModel } from 'pocketbase';
import { extractTokensFromRequest } from './pocketbase-session';

const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;

if (!pocketbaseUrl) {
  console.warn('PocketBase URL fehlt. API Auth wird nicht funktionieren.');
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user: RecordModel;
}

function decodeUserIdFromToken(token: string): string | null {
  try {
    const payload = getTokenPayload(token) as { id?: string } | undefined;
    return payload?.id ?? null;
  } catch {
    return null;
  }
}

async function fetchPocketBaseUser(accessToken: string): Promise<RecordModel> {
  if (!pocketbaseUrl) {
    throw new Error('PocketBase URL nicht konfiguriert.');
  }
  const userId = decodeUserIdFromToken(accessToken);
  if (!userId) {
    throw Object.assign(new Error('Ungültiges Zugriffstoken'), { status: 401 });
  }
  const client = new PocketBase(pocketbaseUrl);
  client.authStore.save(accessToken, null);
  return client.collection('users').getOne(userId, {
    expand: 'profile'
  });
}

export async function getUserFromRequest(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const tokens = extractTokensFromRequest(request);
  const accessToken = tokenFromHeader ?? tokens.accessToken;
  if (!accessToken) {
    return null;
  }

  try {
    const userRecord = await fetchPocketBaseUser(accessToken);
    return {
      id: userRecord.id,
      email: userRecord.email ?? undefined,
      user: userRecord
    };
  } catch {
    return null;
  }
}

export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const authenticated = await getUserFromRequest(request);
  if (!authenticated) {
    throw Object.assign(new Error('Nicht authentifiziert'), { status: 401 });
  }
  return authenticated;
}
