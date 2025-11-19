import { describe, it, beforeAll, expect } from 'vitest';
import { getJson } from '../util';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getAccessToken } from '../auth';

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Settings contracts - Business Profile', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();
  });

  it('GET /api/settings/business-profile returns the current business profile payload', async () => {
    const res = await getJson<Record<string, unknown>>('/api/settings/business-profile', {
      method: 'GET',
      headers: {
        ...authHeaders(ACCESS_TOKEN)
      }
    });

    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
    expect(res.body?.legalName).toBeTypeOf('string');
    expect(res.body?.displayName).toBeTypeOf('string');
    expect(res.body?.email).toBeTypeOf('string');
    expect(res.body?.addressLine1).toBeTypeOf('string');
    expect(res.body?.city).toBeTypeOf('string');
    expect(res.body?.postalCode).toBeTypeOf('string');
    expect(res.body?.country).toMatch(/^[A-Z]{2}$/);
    expect(res.body?.version).toBeTypeOf('number');
  });

  it('PUT /api/settings/business-profile validates required fields and version', async () => {
    const res = await getJson<{ message: string }>('/api/settings/business-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({}) // missing required fields should fail validation
    });

    expect(res.status).toBe(422);
    expect(res.body?.error ?? res.body?.message).toBeTypeOf('string');
  });
});
