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

  const payload = getTokenPayload(accessToken) as { id?: string; collectionId?: string } | undefined;
  const userId = payload?.id;
  const isCollectionToken = !!payload?.collectionId;

  if (!userId) {
    throw Object.assign(new Error('Ungültiges Zugriffstoken'), { status: 401 });
  }

  // If it's NOT a collection token, it's a system admin token
  if (!isCollectionToken) {
    console.log('Detected system admin token for ID:', userId);
    const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
    // We return a synthetic profile for the admin
    return {
      id: 'admin_profile',
      role: 'superadmin',
      active: true,
      expand: {
        user: {
          id: userId,
          email: PB_ADMIN_EMAIL || 'admin@system.local'
        }
      }
    } as unknown as RecordModel;
  }

  console.log('Fetching profile for userId:', userId);
  const client = new PocketBase(pocketbaseUrl);
  client.authStore.save(accessToken, null);

  const profiles = await client.collection('profiles').getList(1, 1, {
    filter: `user = "${userId}"`,
    expand: 'user'
  });

  if (profiles.items.length === 0) {
    throw Object.assign(new Error('PocketBase-Profil fehlt.'), { status: 403 });
  }
  return profiles.items[0];
}

function ensureRole(value: unknown): TenantRole | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  if (normalized === 'superadmin' || normalized === 'owner' || normalized === 'manager' || normalized === 'staff') {
    return normalized as TenantRole;
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
