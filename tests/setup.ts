import { config } from 'dotenv';
config({ path: '.env.local' });

import {
  NotificationCategory,
  NotificationChannel,
  UnitSystem
} from '@prisma/client';
import { prisma } from '../src/lib/prisma';

// Simple helper to build headers with Supabase token if present
export function authHeaders(token?: string) {
  if (!token) return {} as Record<string, string>;
  return { Authorization: `Bearer ${token}` };
}

const TEST_ACTOR_ID = process.env.TEST_ACTOR_ID ?? '00000000-0000-0000-0000-000000000000';

export async function primeSettingsFixtures() {
  const settingsId = '00000000-0000-0000-0000-000000000000';

  await prisma.businessProfile.upsert({
    where: { id: settingsId },
    update: {},
    create: {
      id: settingsId,
      legalName: 'Test Shop',
      displayName: 'Test Shop',
      email: 'test@inventauri.app',
      addressLine1: 'Teststraße 1',
      city: 'Berlin',
      postalCode: '10115',
      country: 'DE',
      updatedBy: TEST_ACTOR_ID
    }
  });

  await prisma.operationalPreference.upsert({
    where: { id: settingsId },
    update: {},
    create: {
      id: settingsId,
      currencyCode: 'EUR',
      timezone: 'Europe/Berlin',
      unitSystem: UnitSystem.metric,
      defaultUnitPrecision: 2,
      fiscalWeekStart: 1,
      autoApplyTaxes: false,
      updatedBy: TEST_ACTOR_ID
    }
  });

  const categories: NotificationCategory[] = [
    NotificationCategory.low_stock,
    NotificationCategory.failed_sync,
    NotificationCategory.role_invite,
    NotificationCategory.audit_alert
  ];

  for (const category of categories) {
    await prisma.notificationPreference.upsert({
      where: {
        category_channel: {
          category,
          channel: NotificationChannel.email
        }
      },
      update: {},
      create: {
        category,
        channel: NotificationChannel.email,
        isEnabled: true,
        updatedBy: TEST_ACTOR_ID
      }
    });
  }
}

void primeSettingsFixtures().catch((error) => {
  console.warn('Konnte Settings-Fixtures nicht initialisieren:', error);
});
