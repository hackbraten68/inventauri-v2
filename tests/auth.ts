import { config } from 'dotenv';
config({ path: '.env.local' });

import PocketBase from 'pocketbase';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pocketbaseUrl = () => process.env.PUBLIC_POCKETBASE_URL ?? 'http://localhost:8090';
export const skipPocketBaseTests = process.env.SKIP_PB_TESTS === 'true';
const getAdminEmail = () => process.env.POCKETBASE_ADMIN_EMAIL;
const getAdminPassword = () => process.env.POCKETBASE_ADMIN_PASSWORD;
const serviceToken = process.env.POCKETBASE_SERVICE_ROLE_TOKEN;
const TEST_ACTOR_ID = process.env.TEST_ACTOR_ID ?? '00000000-0000-0000-0000-000000000000';
const SHOP_SLUG = process.env.SEED_SHOP_SLUG ?? 'demo-shop';
const SHOP_NAME = process.env.SEED_SHOP_NAME ?? 'Demo Shop';

const DEFAULT_EMAIL = process.env.ACCESS_EMAIL || 'test+contracts@inventauri.app';
const DEFAULT_PASSWORD = process.env.ACCESS_PASSWORD || 'PocketBase!123';

async function ensureAdminClient() {
  const url = pocketbaseUrl();
  if (!url) {
    throw new Error('Set PUBLIC_POCKETBASE_URL before running contract tests.');
  }
  const client = new PocketBase(url);
  
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  if (!adminEmail || !adminPassword) {
    throw new Error('PocketBase admin credentials missing. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD.');
  }
  const response = await fetch(`${url}/api/admins/auth-with-password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ identity: adminEmail, password: adminPassword })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? 'PocketBase admin login failed.');
  }
  client.authStore.save(payload?.token, payload?.admin);
  
  return client;
}

async function ensureUser() {
  // In single-tenant setup, just ensure a user exists; no shop mappings needed
  return { userId: TEST_ACTOR_ID, role: 'owner' };
}

async function ensurePocketBaseUser() {
  const adminClient = await ensureAdminClient();
  
  // Try to find existing user by email
  let user = null;
  try {
    user = await adminClient.collection('users').getFirstListItem(`email="${DEFAULT_EMAIL}"`);
  } catch (e) {
    // User doesn't exist yet, continue to try creation
  }
  
  if (!user) {
    try {
      user = await adminClient.collection('users').create({
        email: DEFAULT_EMAIL,
        password: DEFAULT_PASSWORD,
        passwordConfirm: DEFAULT_PASSWORD,
        emailVisibility: false
      });
    } catch (error: any) {
      // Handle the case where user was created by another process (race condition)
      if (error?.status === 400 && error?.response?.data?.email) {
        // User was likely created by a parallel test, wait and try to fetch it
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          user = await adminClient.collection('users').getFirstListItem(`email="${DEFAULT_EMAIL}"`);
        } catch (refetchError: any) {
          console.error('Failed to fetch user after creation race condition:', refetchError?.message);
          throw error;
        }
      } else {
        throw error;
      }
    }
  }

  if (!user.verified) {
    user = await adminClient.collection('users').update(user.id, { verified: true });
  }

  const { userId, role } = await ensureUser();

  const profilePayload = {
    role,
    user: user.id
  };

  const profileFilter = `user="${user.id}"`;
  const existingProfile = await adminClient.collection('profiles').getFirstListItem(profileFilter).catch(() => null);
  if (existingProfile) {
    await adminClient.collection('profiles').update(existingProfile.id, profilePayload);
  } else {
    await adminClient.collection('profiles').create(profilePayload);
  }

  await ensureUserShop(user.id);

  return user;
}

async function ensureUserShop(userId: string) {
  const shop = await prisma.shop.upsert({
    where: { slug: SHOP_SLUG },
    update: {},
    create: {
      name: SHOP_NAME,
      slug: SHOP_SLUG
    }
  });

  await prisma.userShop.upsert({
    where: {
      userId_shopId: {
        userId,
        shopId: shop.id
      }
    },
    update: {},
    create: {
      userId,
      shopId: shop.id,
      role: 'owner',
      status: 'active'
    }
  });
}

export async function getAccessToken(): Promise<{ token: string; userId: string }> {
  if (skipPocketBaseTests) {
    throw new Error('PocketBase contract helper disabled (SKIP_PB_TESTS=true).');
  }
  const user = await ensurePocketBaseUser();
  const authClient = new PocketBase(pocketbaseUrl());
  const authResponse = await authClient.collection('users').authWithPassword(DEFAULT_EMAIL, DEFAULT_PASSWORD);
  const token = authClient.authStore.token;
  if (!token) {
    throw new Error('PocketBase login did not return a token.');
  }
  return { token, userId: authResponse.record.id };
}
