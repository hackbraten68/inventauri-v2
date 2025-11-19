import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { getJson } from '../util';
import { authHeaders, primeSettingsFixtures } from '../setup';
import { getAccessToken } from '../auth';

const prisma = new PrismaClient();

let ACCESS_TOKEN = process.env.ACCESS_TOKEN;
let ORIGINAL_PROFILE:
  | {
      legalName: string;
      displayName: string;
      email: string;
      addressLine1: string;
      city: string;
      postalCode: string;
      country: string;
      version: number;
    }
  | null = null;

describe('Settings integration - Business profile workflow', () => {
  beforeAll(async () => {
    const { token } = await getAccessToken();
    ACCESS_TOKEN = token;
    await primeSettingsFixtures();

    const shop = await prisma.shop.findFirst({ select: { id: true } });
    if (!shop) {
      throw new Error('Kein Shop in der Datenbank gefunden. Seed ausführen.');
    }
    const profile = await prisma.businessProfile.findUnique({ where: { shopId: shop.id } });
    if (!profile) {
      throw new Error('Kein Geschäftsprofil vorhanden. Seed ausführen.');
    }
    ORIGINAL_PROFILE = {
      legalName: profile.legalName,
      displayName: profile.displayName,
      email: profile.email,
      addressLine1: profile.addressLine1,
      city: profile.city,
      postalCode: profile.postalCode,
      country: profile.country,
      version: profile.version
    };
  });

  afterAll(async () => {
    if (ORIGINAL_PROFILE) {
      const shop = await prisma.shop.findFirst({ select: { id: true } });
      if (shop) {
        await prisma.businessProfile.update({
          where: { shopId: shop.id },
          data: {
            legalName: ORIGINAL_PROFILE.legalName,
            displayName: ORIGINAL_PROFILE.displayName,
            email: ORIGINAL_PROFILE.email,
            addressLine1: ORIGINAL_PROFILE.addressLine1,
            city: ORIGINAL_PROFILE.city,
            postalCode: ORIGINAL_PROFILE.postalCode,
            country: ORIGINAL_PROFILE.country,
            version: ORIGINAL_PROFILE.version
          }
        });
      }
    }
  });

  it('creates the business profile when version 0 is submitted and no record exists', async () => {
    const shop = await prisma.shop.findFirst({ select: { id: true } });
    if (!shop) {
      throw new Error('Kein Shop in der Datenbank gefunden. Seed ausführen.');
    }

    const existing = await prisma.businessProfile.findUnique({ where: { shopId: shop.id } });
    if (existing) {
      await prisma.businessProfile.delete({ where: { shopId: shop.id } });
    }

    const createPayload = {
      legalName: 'Inventauri Onboarding GmbH',
      displayName: 'Inventauri Onboarding',
      taxId: null,
      email: 'onboarding@inventauri.app',
      phone: null,
      website: null,
      addressLine1: 'Onboardingstraße 1',
      addressLine2: null,
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      version: 0
    };

    const create = await getJson<any>('/api/settings/business-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify(createPayload)
    });

    expect(create.status).toBe(200);
    expect(create.body?.displayName).toBe(createPayload.displayName);
    expect(create.body?.version).toBe(1);

    const fetched = await getJson<any>('/api/settings/business-profile', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(fetched.status).toBe(200);
    expect(fetched.body?.displayName).toBe(createPayload.displayName);
    expect(fetched.body?.version).toBe(1);

    if (ORIGINAL_PROFILE) {
      const revertPayload = {
        ...ORIGINAL_PROFILE,
        version: fetched.body.version
      };

      const revert = await getJson<any>('/api/settings/business-profile', {
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

  it('allows only one concurrent version-zero create to succeed', async () => {
    const shop = await prisma.shop.findFirst({ select: { id: true } });
    if (!shop) {
      throw new Error('Kein Shop in der Datenbank gefunden. Seed ausführen.');
    }

    const existing = await prisma.businessProfile.findUnique({ where: { shopId: shop.id } });
    if (existing) {
      await prisma.businessProfile.delete({ where: { shopId: shop.id } });
    }

    const concurrentPayload = {
      legalName: 'Inventauri Parallel GmbH',
      displayName: 'Inventauri Parallel',
      taxId: null,
      email: 'parallel@inventauri.app',
      phone: null,
      website: null,
      addressLine1: 'Parallelstraße 1',
      addressLine2: null,
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      version: 0
    };

    const [first, second] = await Promise.all([
      getJson<any>('/api/settings/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(ACCESS_TOKEN)
        },
        body: JSON.stringify(concurrentPayload)
      }),
      getJson<any>('/api/settings/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(ACCESS_TOKEN)
        },
        body: JSON.stringify(concurrentPayload)
      })
    ]);

    const statuses = [first.status, second.status];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);

    const success = first.status === 200 ? first : second;
    const conflict = first.status === 409 ? first : second.status === 409 ? second : null;

    expect(success.body?.version).toBe(1);
    expect(success.body?.displayName).toBe(concurrentPayload.displayName);
    if (conflict) {
      const message = conflict.body?.error ?? conflict.body?.message ?? '';
      expect(message).toContain('parallel');
    }

    if (ORIGINAL_PROFILE) {
      await prisma.businessProfile.update({
        where: { shopId: shop.id },
        data: {
          legalName: ORIGINAL_PROFILE.legalName,
          displayName: ORIGINAL_PROFILE.displayName,
          taxId: ORIGINAL_PROFILE.taxId,
          email: ORIGINAL_PROFILE.email,
          phone: ORIGINAL_PROFILE.phone,
          website: ORIGINAL_PROFILE.website,
          addressLine1: ORIGINAL_PROFILE.addressLine1,
          addressLine2: ORIGINAL_PROFILE.addressLine2,
          city: ORIGINAL_PROFILE.city,
          postalCode: ORIGINAL_PROFILE.postalCode,
          country: ORIGINAL_PROFILE.country,
          version: ORIGINAL_PROFILE.version
        }
      });
    } else {
      await prisma.businessProfile.delete({ where: { shopId: shop.id } });
    }
  });

  it('updates the business profile and reflects new values on subsequent fetch', async () => {
    const initial = await getJson<any>('/api/settings/business-profile', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(initial.status).toBe(200);
    const nextDisplayName = `Inventauri QA ${Date.now()}`;

    const updatePayload = {
      ...initial.body,
      displayName: nextDisplayName,
      legalName: initial.body.legalName,
      email: initial.body.email,
      addressLine1: initial.body.addressLine1,
      city: initial.body.city,
      postalCode: initial.body.postalCode,
      country: initial.body.country,
      version: initial.body.version
    };

    const update = await getJson<any>('/api/settings/business-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify(updatePayload)
    });
    expect(update.status).toBe(200);
    expect(update.body?.displayName).toBe(nextDisplayName);
    expect(update.body?.version).toBe(updatePayload.version + 1);

    const refreshed = await getJson<any>('/api/settings/business-profile', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body?.displayName).toBe(nextDisplayName);
  });

  it('returns a conflict when attempting to save with an outdated version', async () => {
    const current = await getJson<any>('/api/settings/business-profile', {
      method: 'GET',
      headers: authHeaders(ACCESS_TOKEN)
    });
    expect(current.status).toBe(200);

    const stalePayload = {
      ...current.body,
      displayName: `Inventauri Conflict ${Date.now()}`,
      version: current.body.version - 1
    };

    const conflict = await getJson<{ message: string }>('/api/settings/business-profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(ACCESS_TOKEN)
      },
      body: JSON.stringify(stalePayload)
    });

    expect(conflict.status).toBe(409);
    const message = conflict.body?.error ?? conflict.body?.message ?? '';
    expect(message).toContain('bereits geändert');
  });
});
