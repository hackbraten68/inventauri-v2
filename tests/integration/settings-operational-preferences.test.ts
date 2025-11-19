import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getJson } from '../util';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getAccessToken } from '../auth';

const prisma = new PrismaClient();

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;
let ORIGINAL_PREFERENCES:
  | {
      currencyCode: string;
      timezone: string;
      unitSystem: string;
      defaultUnitPrecision: number;
      fiscalWeekStart: number;
      autoApplyTaxes: boolean;
      version: number;
    }
  | null = null;

describe('Settings integration - Operational preferences workflow', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();

    const shop = await prisma.shop.findFirst({ select: { id: true } });
    if (!shop) {
      throw new Error('Kein Shop in der Datenbank gefunden. Seed ausführen.');
    }
    const preferences = await prisma.operationalPreference.findUnique({ where: { shopId: shop.id } });
    if (preferences) {
      ORIGINAL_PREFERENCES = {
        currencyCode: preferences.currencyCode,
        timezone: preferences.timezone,
        unitSystem: preferences.unitSystem,
        defaultUnitPrecision: preferences.defaultUnitPrecision,
        fiscalWeekStart: preferences.fiscalWeekStart,
        autoApplyTaxes: preferences.autoApplyTaxes,
        version: preferences.version
      };
    }
  });

  afterAll(async () => {
    if (ORIGINAL_PREFERENCES) {
      const shop = await prisma.shop.findFirst({ select: { id: true } });
      if (shop) {
        await prisma.operationalPreference.update({
          where: { shopId: shop.id },
          data: {
            currencyCode: ORIGINAL_PREFERENCES.currencyCode,
            timezone: ORIGINAL_PREFERENCES.timezone,
            unitSystem: ORIGINAL_PREFERENCES.unitSystem as any,
            defaultUnitPrecision: ORIGINAL_PREFERENCES.defaultUnitPrecision,
            fiscalWeekStart: ORIGINAL_PREFERENCES.fiscalWeekStart,
            autoApplyTaxes: ORIGINAL_PREFERENCES.autoApplyTaxes,
            version: ORIGINAL_PREFERENCES.version
          }
        });
      }
    }
  });

  it('creates operational preferences when version 0 is submitted and no record exists', async () => {
    const shop = await prisma.shop.findFirst({ select: { id: true } });
    if (!shop) {
      throw new Error('Kein Shop in der Datenbank gefunden. Seed ausführen.');
    }

    const existing = await prisma.operationalPreference.findUnique({ where: { shopId: shop.id } });
    if (existing) {
      await prisma.operationalPreference.delete({ where: { shopId: shop.id } });
    }

    const createPayload = {
      currencyCode: 'USD',
      timezone: 'America/New_York',
      unitSystem: 'imperial',
      defaultUnitPrecision: 3,
      fiscalWeekStart: 0,
      autoApplyTaxes: true,
      version: 0
    };

    const create = await getJson<any>('/api/settings/operational', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify(createPayload)
    });

    expect(create.status).toBe(200);
    expect(create.body?.currencyCode).toBe(createPayload.currencyCode);
    expect(create.body?.version).toBe(1);

    const fetched = await getJson<any>('/api/settings/operational', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(fetched.status).toBe(200);
    expect(fetched.body?.currencyCode).toBe(createPayload.currencyCode);
    expect(fetched.body?.version).toBe(1);

    if (ORIGINAL_PREFERENCES) {
      const revertPayload = {
        ...ORIGINAL_PREFERENCES,
        version: fetched.body.version
      };

      const revert = await getJson<any>('/api/settings/operational', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(ACCESS_TOKEN)
        },
        body: JSON.stringify(revertPayload)
      });
      expect(revert.status).toBe(200);
    }
  });

  it('returns a conflict when attempting to save with an outdated version', async () => {
    const current = await getJson<any>('/api/settings/operational', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(current.status).toBe(200);

    const stalePayload = {
      ...current.body,
      currencyCode: 'GBP',
      version: current.body.version - 1
    };

    const conflict = await getJson<{ message: string }>('/api/settings/operational', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify(stalePayload)
    });

    expect(conflict.status).toBe(409);
    const message = conflict.body?.error ?? conflict.body?.message ?? '';
    expect(message).toContain('Version');
  });
});
