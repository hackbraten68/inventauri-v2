import { beforeAll, describe, expect, it } from 'vitest';
import { getJson } from '../util';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getAccessToken } from '../auth';

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Settings contracts - Operational & notifications', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();
  });

  it('GET /api/settings/operational returns operational defaults', async () => {
    const res = await getJson<Record<string, unknown>>('/api/settings/operational', {
      method: 'GET',
      headers: {
        ...authHeaders(ACCESS_TOKEN)
      }
    });

    expect(res.status).toBe(200);
    expect(res.body?.currencyCode).toBeTypeOf('string');
    expect(res.body?.timezone).toBeTypeOf('string');
    expect(res.body?.unitSystem).toBeTypeOf('string');
    expect(res.body?.version).toBeTypeOf('number');
  });

  it('PUT /api/settings/operational validates inputs', async () => {
    const res = await getJson('/api/settings/operational', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({ currencyCode: 'EU', version: 0 })
    });

    expect(res.status).toBe(422);
    expect(res.body?.error ?? res.body?.message ?? '').toBeTypeOf('string');
  });

  it('GET /api/settings/notifications returns configured categories', async () => {
    const res = await getJson<Array<Record<string, unknown>>>('/api/settings/notifications', {
      method: 'GET',
      headers: {
        ...authHeaders(ACCESS_TOKEN)
      }
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/settings/notifications enforces payload schema', async () => {
    const res = await getJson('/api/settings/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify([{ id: 'missing-version' }])
    });

    expect(res.status).toBe(422);
    expect(res.body?.error ?? res.body?.message ?? '').toBeTypeOf('string');
  });
});
