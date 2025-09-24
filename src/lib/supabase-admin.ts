import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('Supabase admin client initialised without URL or service role key.');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey ?? '', {
  auth: {
    persistSession: false
  }
});
