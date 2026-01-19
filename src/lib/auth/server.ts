import PocketBase, { getTokenPayload, type RecordModel } from 'pocketbase';
import { extractTokensFromRequest } from './pocketbase-session';
import type { AuthenticatedUser, PocketBaseProfile, TenantRole } from './types';

const pocketbaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL;

if (!pocketbaseUrl) {
  console.warn('PocketBase URL fehlt. API Auth wird nicht funktionieren.');
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

  console.log('Fetching profile for userId:', userId);
  const client = new PocketBase(pocketbaseUrl);
  client.authStore.save(accessToken, null);
  // Fetch profile where user matches, expand user
  const profiles = await client.collection('profiles').getList(1, 1, {
    filter: `user = "${userId}"`,
    expand: 'user'
  });
  console.log('Profiles response:', profiles);
  console.log('Profiles found:', profiles.items.length);
  if (profiles.items.length === 0) {
    throw Object.assign(new Error('PocketBase-Profil fehlt.'), { status: 403 });
  }
  return profiles.items[0]; // Return the profile record
}

function ensureRole(value: unknown): TenantRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (normalized === 'owner' || normalized === 'manager' || normalized === 'staff') {
    return normalized;
  }
  return null;
}

function parseProfile(profileRecord: RecordModel): { profile: PocketBaseProfile; user: RecordModel } {
  const role = ensureRole(profileRecord.role);
  const active = profileRecord.active !== false;
  const profileId = typeof profileRecord.id === 'string' ? profileRecord.id : null;
  const user = (profileRecord.expand?.user as RecordModel | undefined) ?? null;

  if (!role || !profileId || !user) {
    throw Object.assign(new Error('PocketBase-Profil oder Benutzer fehlt.'), { status: 403 });
  }

  return {
    profile: {
      id: profileId,
      role,
      active
    },
    user
  };
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
    const profileRecord = await fetchPocketBaseUser(accessToken);
    const { profile, user } = parseProfile(profileRecord);
    if (!profile.active) {
      throw Object.assign(new Error('PocketBase-Profil ist deaktiviert.'), { status: 403 });
    }
    return {
      id: user.id,
      email: user.email ?? undefined,
      role: profile.role,
      profileId: profile.id,
      profileActive: profile.active,
      record: user
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
