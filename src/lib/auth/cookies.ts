export function setAccessTokenCookie(token: string | null, expiresInSeconds?: number) {
  if (!token) {
    document.cookie = 'sb-access-token=; Max-Age=0; path=/; SameSite=Lax';
    return;
  }

  const maxAge = typeof expiresInSeconds === 'number' && expiresInSeconds > 0 ? expiresInSeconds : 60 * 60;
  document.cookie = `sb-access-token=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
