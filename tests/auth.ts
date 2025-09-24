import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const DEFAULT_EMAIL = process.env.ACCESS_EMAIL || 'test+contracts@inventauri.app';
const DEFAULT_PASSWORD = process.env.ACCESS_PASSWORD || 'Password123!';

export async function getAccessToken(): Promise<{ token: string; userId: string }> {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL or Service Role Key missing. Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // Try to sign in first; if it fails, create user and then sign in
  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  let signIn = await client.auth.signInWithPassword({ email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD });
  if (signIn.error) {
    // Create user and retry sign-in
    const create = await admin.auth.admin.createUser({ email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD, email_confirm: true });
    if (create.error) {
      throw create.error;
    }
    signIn = await client.auth.signInWithPassword({ email: DEFAULT_EMAIL, password: DEFAULT_PASSWORD });
    if (signIn.error) {
      throw signIn.error;
    }
  }

  const session = signIn.data.session;
  if (!session) throw new Error('No session returned from Supabase');

  const userId = session.user.id;

  // Ensure tenant mapping exists
  const shop = await prisma.shop.findFirst({ where: { slug: 'demo-shop' } });
  if (!shop) throw new Error("Demo shop not found; run seed first");

  const mapping = await prisma.userShop.findFirst({ where: { userId, shopId: shop.id } });
  if (!mapping) {
    await prisma.userShop.create({ data: { userId, shopId: shop.id, role: 'owner' } });
  }

  return { token: session.access_token, userId };
}
