import PocketBase, { getTokenPayload } from 'pocketbase';

const POCKETBASE_URL = import.meta.env.PUBLIC_POCKETBASE_URL ?? '';
export const POCKETBASE_ACCESS_COOKIE = 'pb-access-token';
export const POCKETBASE_REFRESH_COOKIE = 'pb-refresh-token';

export interface PocketBaseSessionTokens {
  accessToken?: string;
  refreshToken?: string;
}

function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=');
    if (!rawKey) return acc;
    acc[rawKey] = rest.join('=');
    return acc;
  }, {});
}

export function extractTokensFromRequest(request: Request): PocketBaseSessionTokens {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  return {
    accessToken: cookies[POCKETBASE_ACCESS_COOKIE],
    refreshToken: cookies[POCKETBASE_REFRESH_COOKIE]
  };
}

export function serializeAuthCookies(params: {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn?: number;
  refreshExpiresIn?: number;
  secure?: boolean;
}) {
  const accessMaxAge = params.accessExpiresIn ?? 60 * 60;
  const refreshMaxAge = params.refreshExpiresIn ?? 60 * 60 * 24 * 7;
  const secureFlag = params.secure ?? !import.meta.env.DEV;
  const baseAttributes = `Path=/; SameSite=Lax${secureFlag ? '; Secure' : ''}; HttpOnly`;
  return [
    `${POCKETBASE_ACCESS_COOKIE}=${params.accessToken}; Max-Age=${accessMaxAge}; ${baseAttributes}`,
    `${POCKETBASE_REFRESH_COOKIE}=${params.refreshToken}; Max-Age=${refreshMaxAge}; ${baseAttributes}`
  ];
}

export function clearAuthCookies() {
  const expires = 'Max-Age=0; Path=/; SameSite=Lax; HttpOnly';
  return [
    `${POCKETBASE_ACCESS_COOKIE}=; ${expires}`,
    `${POCKETBASE_REFRESH_COOKIE}=; ${expires}`
  ];
}

export async function refreshPocketBaseSession(tokens: PocketBaseSessionTokens) {
  if (!tokens.accessToken || !tokens.refreshToken) {
    throw new Error('PocketBase session refresh requires both access and refresh tokens.');
  }
  const client = new PocketBase(POCKETBASE_URL);
  client.authStore.save(tokens.accessToken, null);
  client.authStore.refreshToken = tokens.refreshToken;
  const result = await client.collection('users').authRefresh();
  const expiresAt = getTokenExpiration(client.authStore.token);
  return {
    accessToken: client.authStore.token,
    refreshToken: client.authStore.refreshToken,
    user: result.record,
    expiresAt
  };
}

export async function fetchPocketBaseProfile(tokens: PocketBaseSessionTokens) {
  const refreshed = await refreshPocketBaseSession(tokens);
  return {
    user: refreshed.user,
    tokens: {
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken
    },
    expiresAt: refreshed.expiresAt
  };
}

export function getTokenExpiration(token?: string) {
  if (!token) return undefined;
  try {
    const payload = getTokenPayload(token) as { exp?: number } | undefined;
    if (payload?.exp) {
      return new Date(payload.exp * 1000).toISOString();
    }
  } catch {
    // ignore decoding errors
  }
  return undefined;
}
