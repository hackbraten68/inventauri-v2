import { randomUUID } from 'node:crypto';
import { ensurePocketBaseAdminAuth } from '../../pocketbase-admin';

export const hasServiceRole =
  Boolean(import.meta.env.POCKETBASE_SERVICE_ROLE_TOKEN) ||
  (Boolean(import.meta.env.POCKETBASE_ADMIN_EMAIL) && Boolean(import.meta.env.POCKETBASE_ADMIN_PASSWORD));

export interface InviteUserResult {
  userId: string | null;
  email: string;
}

export async function inviteUser(email: string, role: string): Promise<InviteUserResult> {
  if (!hasServiceRole) {
    return { userId: null, email };
  }

  const adminClient = await ensurePocketBaseAdminAuth();
  const password = randomUUID().replace(/-/g, '').slice(0, 16);
  try {
    const record = await adminClient.collection('users').create({
      email,
      password,
      passwordConfirm: password,
      verified: false
    });
    return {
      userId: record?.id ?? null,
      email: record?.email ?? email
    };
  } catch (error) {
    const err = new Error(error instanceof Error ? error.message : 'PocketBase Einladung fehlgeschlagen.');
    (err as Error & { status?: number }).status = 502;
    throw err;
  }
}

export async function disableUser(userId: string): Promise<void> {
  if (!hasServiceRole) {
    return;
  }

  const adminClient = await ensurePocketBaseAdminAuth();
  try {
    await adminClient.collection('users').update(userId, {
      banned: true
    });
  } catch (error) {
    const err = new Error(error instanceof Error ? error.message : 'PocketBase Update fehlgeschlagen.');
    (err as Error & { status?: number }).status = 502;
    throw err;
  }
}

export async function fetchUserEmail(userId: string): Promise<string | null> {
  if (!hasServiceRole) {
    return null;
  }
  const adminClient = await ensurePocketBaseAdminAuth();
  try {
    const record = await adminClient.collection('users').getOne(userId);
    return record?.email ?? null;
  } catch (error) {
    console.warn('Failed to fetch PocketBase user email', error);
    return null;
  }
}
