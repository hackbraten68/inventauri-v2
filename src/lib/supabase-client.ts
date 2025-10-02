import { createClient } from '@supabase/supabase-js';

// Use the defined constants from Vite
const supabaseUrl = __SUPABASE_URL__;
const supabaseAnonKey = __SUPABASE_ANON_KEY__;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase client initialised without URL or anon key. Check environment variables.');
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
