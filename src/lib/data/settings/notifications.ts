import {
  NotificationChannel,
  NotificationCategory,
  SettingsChangeType,
  SettingsSection
} from '@prisma/client';
import { prisma } from '../../prisma';
import { buildSettingsDiff, recordSettingsChange } from './audit';
import { parseNotificationPreferencePatch, ValidationError } from '../../settings/validation';
import { ensureExpectedVersion } from '../../settings/validation';

export interface NotificationPreferenceRecord {
  id: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  isEnabled: boolean;
  throttleMinutes: number | null;
  version: number;
  recipients: Array<{
    id: string;
    userShopId: string | null;
    email: string | null;
  }>;
}

function mapPreference(preference: {
  id: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  isEnabled: boolean;
  throttleMinutes: number | null;
  version: number;
  recipients: Array<{ id: string; userShopId: string | null; email: string | null }>;
}): NotificationPreferenceRecord {
  return {
    id: preference.id,
    category: preference.category,
    channel: preference.channel,
    isEnabled: preference.isEnabled,
    throttleMinutes: preference.throttleMinutes,
    version: preference.version,
    recipients: preference.recipients.map((recipient) => ({
      id: recipient.id,
      userShopId: recipient.userShopId,
      email: recipient.email
    }))
  };
}

export async function listNotificationPreferences(shopId: string): Promise<NotificationPreferenceRecord[]> {
  const preferences = await prisma.notificationPreference.findMany({
    where: { shopId },
    orderBy: { category: 'asc' },
    include: { recipients: true }
  });
  return preferences.map(mapPreference);
}

export interface UpdateNotificationPreferencesArgs {
  shopId: string;
  actorId: string;
  actorEmail?: string;
  payload: unknown;
}

export async function updateNotificationPreferences(args: UpdateNotificationPreferencesArgs) {
  const { shopId, actorId, actorEmail, payload } = args;
  if (!Array.isArray(payload)) {
    throw new ValidationError('Aktualisierung erwartet eine Liste von Änderungen.');
  }

  const parsedPatches = payload.map(parseNotificationPreferencePatch);

  return prisma.$transaction(async (tx) => {
    const updatedRecords: NotificationPreferenceRecord[] = [];

    for (const patch of parsedPatches) {
      const existing = await tx.notificationPreference.findUnique({
        where: { id: patch.id },
        include: { recipients: true }
      });

      if (!existing || existing.shopId !== shopId) {
        throw new ValidationError('Benachrichtigung konnte nicht gefunden werden.');
      }

      ensureExpectedVersion(patch.version, existing.version);

      const updated = await tx.notificationPreference.update({
        where: { id: patch.id },
        data: {
          isEnabled: patch.isEnabled,
          throttleMinutes: patch.throttleMinutes ?? null,
          updatedBy: actorId,
          version: existing.version + 1
        },
        include: { recipients: true }
      });

      await recordSettingsChange({
        shopId,
        section: SettingsSection.notifications,
        changeType: SettingsChangeType.update,
        actorId,
        actorEmail: actorEmail ?? 'unknown@inventauri.app',
        diff: buildSettingsDiff(mapPreference(existing), mapPreference(updated))
      });

      updatedRecords.push(mapPreference(updated));
    }

    return updatedRecords;
  });
}

export interface CreateRecipientArgs {
  preferenceId: string;
  userShopId?: string;
  email?: string;
}

export async function addNotificationRecipient(shopId: string, args: CreateRecipientArgs) {
  if (!args.userShopId && !args.email) {
    throw new ValidationError('Empfänger benötigt entweder userShopId oder email.');
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: { id: args.preferenceId },
    include: { recipients: true }
  });

  if (!preference || preference.shopId !== shopId) {
    throw new ValidationError('Benachrichtigung nicht gefunden.');
  }

  const recipient = await prisma.notificationRecipient.create({
    data: {
      preferenceId: preference.id,
      userShopId: args.userShopId ?? null,
      email: args.email ?? null
    }
  });

  await recordSettingsChange({
    shopId,
    section: SettingsSection.notifications,
    changeType: SettingsChangeType.update,
    actorId: preference.updatedBy,
    actorEmail: 'system@inventauri.app',
    diff: buildSettingsDiff(null, recipient)
  });

  return recipient;
}

export interface RemoveRecipientArgs {
  preferenceId: string;
  userShopId?: string;
  email?: string;
}

export async function removeNotificationRecipient(shopId: string, args: RemoveRecipientArgs) {
  const preference = await prisma.notificationPreference.findUnique({
    where: { id: args.preferenceId }
  });

  if (!preference || preference.shopId !== shopId) {
    throw new ValidationError('Benachrichtigung nicht gefunden.');
  }

  if (!args.userShopId && !args.email) {
    throw new ValidationError('Zum Entfernen muss userShopId oder email angegeben werden.');
  }

  const recipient = await prisma.notificationRecipient.findFirst({
    where: {
      preferenceId: args.preferenceId,
      ...(args.userShopId ? { userShopId: args.userShopId } : {}),
      ...(args.email ? { email: args.email } : {})
    }
  });

  if (!recipient) {
    throw new ValidationError('Empfänger existiert nicht.');
  }

  await prisma.notificationRecipient.delete({ where: { id: recipient.id } });

  await recordSettingsChange({
    shopId,
    section: SettingsSection.notifications,
    changeType: SettingsChangeType.update,
    actorId: preference.updatedBy,
    actorEmail: 'system@inventauri.app',
    diff: buildSettingsDiff(recipient, null)
  });
}
