// Minimal client helper to provide auth headers for server-side fetches.
// This file exists because several pages call `getAuthHeaders()` during SSR
// to forward authentication. In many setups this reads a cookie or token and
// returns an Authorization header. For now return an empty headers object so
// builds succeed; extend as needed to integrate with Supabase auth.

export async function getAuthHeaders(): Promise<Record<string, string>> {
  // TODO: read auth cookie or environment-provided token and return
  // Authorization: `Bearer <token>` when available.
  return {};
}
