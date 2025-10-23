import { beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getAccessToken } from '../auth';
import { getJson } from '../util';

const prisma = new PrismaClient();

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Settings integration - Staff lifecycle', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();
  });

  it('invites a staff member, updates role, and deactivates account', async () => {
    const invitationEmail = `qa+${Date.now()}@inventauri.app`;

    const invite = await getJson<any>('/api/settings/staff/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ email: invitationEmail, role: 'manager' })
    });
    expect(invite.status).toBe(201);

    const shop = await prisma.shop.findFirst({ select: { id: true } });
    expect(shop).toBeTruthy();

    const accepted = await prisma.userShop.create({
      data: {
        shopId: shop!.id,
        userId: randomUUID(),
        role: 'manager'
      }
    });

    const updated = await getJson<any>(`/api/settings/staff/${accepted.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ role: 'staff' })
    });
    expect(updated.status).toBe(200);

    const deactivated = await getJson<any>(`/api/settings/staff/${accepted.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ status: 'deactivated' })
    });
    expect(deactivated.status).toBe(200);
    expect(deactivated.body?.status).toBe('deactivated');
  });
});
