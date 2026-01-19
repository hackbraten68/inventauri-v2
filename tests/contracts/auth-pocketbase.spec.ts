import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import PocketBase from 'pocketbase';
import { PrismaClient, type UserShop } from '@prisma/client';
import { baseUrl } from '../util';

const prisma = new PrismaClient();

const POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL ?? 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const SERVICE_TOKEN = process.env.POCKETBASE_SERVICE_ROLE_TOKEN;

const TEST_EMAIL = process.env.ACCESS_EMAIL ?? 'contracts-pocketbase@inventauri.local';
const TEST_PASSWORD = process.env.ACCESS_PASSWORD ?? 'PocketBase!123';

let cookieJar = new Map<string, string>();

function getSetCookie(headers: Headers): string[] {
  const hook = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  if (typeof hook === 'function') {
    return hook.call(headers) ?? [];
  }
  const single = headers.get('set-cookie');
  return single ? [single] : [];
}

function applyCookies(setCookies: string[]) {
  setCookies.forEach((cookie) => {
    const [pair] = cookie.split(';', 1);
    if (!pair) return;
    const [name, value] = pair.split('=');
    if (!name) return;
    cookieJar.set(name.trim(), value ?? '');
  });
}

function cookieHeader() {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function ensureAdmin(pb: PocketBase) {
  if (SERVICE_TOKEN) {
    pb.authStore.save(SERVICE_TOKEN, null);
    return;
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('POCKETBASE_SERVICE_ROLE_TOKEN or admin email/password required for contract tests.');
  }
  await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
}

async function ensurePocketBaseProfile(pb: PocketBase, userId: string, role: string) {
  const profiles = pb.collection('profiles');
  const filter = `user="${userId}"`;
  const existing = await profiles.getFirstListItem(filter).catch(() => null);
  if (existing) {
    if (existing.role !== role) {
      await profiles.update(existing.id, { role });
    }
    return;
  }
  await profiles.create({
    role,
    user: userId
  });
}

async function ensureContractUser() {
  const pb = new PocketBase(POCKETBASE_URL);
  await ensureAdmin(pb);

  const filter = `email="${TEST_EMAIL}"`;
  let user = await pb.collection('users').getFirstListItem(filter).catch(() => null);
  if (!user) {
    user = await pb.collection('users').create({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      passwordConfirm: TEST_PASSWORD,
      emailVisibility: false,
      verified: true
    });
  } else if (!user.verified) {
    user = await pb.collection('users').update(user.id, { verified: true });
  }

  await ensurePocketBaseProfile(pb, user.id, 'owner');
}

async function login() {
  const response = await fetch(`${baseUrl()}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  return response;
}

describe('PocketBase auth endpoints', () => {
  beforeAll(async () => {
    await ensureContractUser();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('logs in and issues PocketBase cookies', async () => {
    const response = await login();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body?.user).toBeDefined();

    const cookies = getSetCookie(response.headers);
    expect(cookies.length).toBeGreaterThanOrEqual(2);
    applyCookies(cookies);

    const cookieNames = Array.from(cookieJar.keys());
    expect(cookieNames).toContain('pb-access-token');
    expect(cookieNames).toContain('pb-refresh-token');
  });

  it('refreshes session and extends cookies', async () => {
    const response = await fetch(`${baseUrl()}/api/auth/session`, {
      method: 'GET',
      headers: { cookie: cookieHeader() }
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.sessionValid).toBe(true);
    expect(payload.user).toBeDefined();
    applyCookies(getSetCookie(response.headers));
  });

  it('logs out and clears cookies', async () => {
    const response = await fetch(`${baseUrl()}/api/auth/logout`, {
      method: 'POST',
      headers: { cookie: cookieHeader() }
    });
    expect(response.status).toBe(204);

    const cookies = getSetCookie(response.headers);
    applyCookies(cookies);

    const header = cookieHeader();
    expect(header.includes('pb-access-token=')).toBe(true);

    const sessionResponse = await fetch(`${baseUrl()}/api/auth/session`, {
      method: 'GET',
      headers: { cookie: header }
    });
    expect(sessionResponse.status).toBe(401);
  });
});
