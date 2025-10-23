import { beforeAll, describe, expect, it } from 'vitest';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getJson } from '../util';
import { getAccessToken } from '../auth';

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Settings contracts - Staff management', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();
  });

  it('GET /api/settings/staff returns staff roster', async () => {
    const res = await getJson<any[]>('/api/settings/staff', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /api/settings/staff/invitations validates payload', async () => {
    const res = await getJson('/api/settings/staff/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ email: 'invalid', role: 'manager' })
    });
    expect(res.status).toBe(422);
    expect(res.body?.error ?? res.body?.message ?? '').toBeTypeOf('string');
  });

  it('PATCH /api/settings/staff/{userShopId} rejects unknown users', async () => {
    const res = await getJson(`/api/settings/staff/00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ status: 'deactivated' })
    });

    expect(res.status).toBe(404);
  });
});
