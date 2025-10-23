import { beforeAll, describe, expect, it } from 'vitest';
import { getJson } from '../util';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getAccessToken } from '../auth';

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;

describe('Settings integration - Operational & notifications', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();
  });

  it('updates operational defaults and notification preferences end-to-end', async () => {
    const initialOperational = await getJson<any>('/api/settings/operational', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(initialOperational.status).toBe(200);

    const nextCurrency = initialOperational.body?.currencyCode === 'EUR' ? 'USD' : 'EUR';
    const updateOperational = await getJson<any>('/api/settings/operational', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify({
        ...initialOperational.body,
        currencyCode: nextCurrency,
        timezone: 'Europe/Berlin',
        unitSystem: 'metric'
      })
    });
    expect(updateOperational.status).toBe(200);
    expect(updateOperational.body?.currencyCode).toBe(nextCurrency);
    expect(updateOperational.body?.version).toBe(initialOperational.body.version + 1);

    const refreshedOperational = await getJson<any>('/api/settings/operational', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(refreshedOperational.status).toBe(200);
    expect(refreshedOperational.body?.currencyCode).toBe(nextCurrency);

    const notifications = await getJson<any[]>('/api/settings/notifications', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(notifications.status).toBe(200);
    expect(Array.isArray(notifications.body)).toBe(true);
    const firstPreference = notifications.body?.[0];
    expect(firstPreference).toBeTruthy();

    const toggle = await getJson<any[]>('/api/settings/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify([
        {
          id: firstPreference.id,
          isEnabled: !firstPreference.isEnabled,
          throttleMinutes: firstPreference.throttleMinutes ?? null,
          version: firstPreference.version
        }
      ])
    });
    expect(toggle.status).toBe(200);
    const updatedPreference = toggle.body?.find((entry: any) => entry.id === firstPreference.id);
    expect(updatedPreference?.version).toBe(firstPreference.version + 1);
    expect(updatedPreference?.isEnabled).toBe(!firstPreference.isEnabled);
  });
});
