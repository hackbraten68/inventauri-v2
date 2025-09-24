import { config } from 'dotenv';
config({ path: '.env.local' });

// Simple helper to build headers with Supabase token if present
export function authHeaders(token?: string) {
  if (!token) return {} as Record<string, string>;
  return { Authorization: `Bearer ${token}` };
}
