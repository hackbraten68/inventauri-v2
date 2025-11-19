import { prisma } from '../../prisma';
import type { SettingsChangeType, SettingsSection } from '@prisma/client';

export interface SettingsAuditInput {
  shopId: string;
  section: SettingsSection;
  changeType: SettingsChangeType;
  actorId: string;
  actorEmail: string;
  diff: Record<string, unknown>;
}

/**
 * Helper to build a simple before/after diff structure that downstream tooling can render.
 */
export function buildSettingsDiff<T extends Record<string, unknown>>(before: T | null, after: T | null) {
  return {
    before: before ?? null,
    after: after ?? null
  } as const;
}

export async function recordSettingsChange(input: SettingsAuditInput) {
  const { shopId, section, changeType, actorId, actorEmail, diff } = input;

  return prisma.settingsAuditLog.create({
    data: {
      shopId,
      section,
      changeType,
      actorId,
      actorEmail,
      diff
    }
  });
}

export interface SettingsAuditQuery {
  shopId: string;
  section?: SettingsSection;
  limit?: number;
}

export async function listSettingsAuditLogs(query: SettingsAuditQuery) {
  const { shopId, section, limit = 50 } = query;

  return prisma.settingsAuditLog.findMany({
    where: {
      shopId,
      ...(section ? { section } : {})
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });
}
