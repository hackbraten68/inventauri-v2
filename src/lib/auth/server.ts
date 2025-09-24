import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL oder Anon Key fehlen. API Auth wird nicht funktionieren.');
}

const supabaseServerClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user: User;
}

export async function getUserFromRequest(request: Request): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const cookie = request.headers.get('cookie');
  const tokenFromCookie = cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('sb-access-token='))
    ?.split('=')[1];

  const accessToken = tokenFromHeader ?? tokenFromCookie;
  if (!accessToken) {
    return null;
  }

  const { data, error } = await supabaseServerClient.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? undefined,
    user: data.user
  };
}

export async function requireUser(request: Request): Promise<AuthenticatedUser> {
  const authenticated = await getUserFromRequest(request);
  if (!authenticated) {
    throw Object.assign(new Error('Nicht authentifiziert'), { status: 401 });
  }
  return authenticated;
}
