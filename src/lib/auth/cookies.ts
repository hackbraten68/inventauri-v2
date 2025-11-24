export function setPocketBaseCookies(params: {
  accessToken?: string | null;
  refreshToken?: string | null;
  accessExpiresIn?: number;
  refreshExpiresIn?: number;
}) {
  const secureFlag = window.location.protocol === 'https:';
  const baseAttributes = `Path=/; SameSite=Lax${secureFlag ? '; Secure' : ''}`;

  if (!params.accessToken) {
    document.cookie = `pb-access-token=; Max-Age=0; ${baseAttributes}`;
  } else {
    const maxAge = typeof params.accessExpiresIn === 'number' && params.accessExpiresIn > 0 ? params.accessExpiresIn : 60 * 60;
    document.cookie = `pb-access-token=${params.accessToken}; Max-Age=${maxAge}; ${baseAttributes}`;
  }

  if (!params.refreshToken) {
    document.cookie = `pb-refresh-token=; Max-Age=0; ${baseAttributes}`;
  } else {
    const refreshAge = typeof params.refreshExpiresIn === 'number' && params.refreshExpiresIn > 0 ? params.refreshExpiresIn : 60 * 60 * 24 * 7;
    document.cookie = `pb-refresh-token=${params.refreshToken}; Max-Age=${refreshAge}; ${baseAttributes}`;
  }
}
