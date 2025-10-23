import { SettingsChangeType, SettingsSection, UnitSystem } from '@prisma/client';
import { prisma } from '../../prisma';
import { buildSettingsDiff, recordSettingsChange } from './audit';
import {
  ensureExpectedVersion,
  parseOperationalPreferencePayload,
  type OperationalPreferencePayload
} from '../../settings/validation';

export interface OperationalPreferenceRecord {
  currencyCode: string;
  timezone: string;
  unitSystem: UnitSystem;
  defaultUnitPrecision: number;
  fiscalWeekStart: number;
  autoApplyTaxes: boolean;
  version: number;
}

function mapPreference(preference: {
  currencyCode: string;
  timezone: string;
  unitSystem: UnitSystem;
  defaultUnitPrecision: number;
  fiscalWeekStart: number;
  autoApplyTaxes: boolean;
  version: number;
}): OperationalPreferenceRecord {
  return {
    currencyCode: preference.currencyCode,
    timezone: preference.timezone,
    unitSystem: preference.unitSystem,
    defaultUnitPrecision: preference.defaultUnitPrecision,
    fiscalWeekStart: preference.fiscalWeekStart,
    autoApplyTaxes: preference.autoApplyTaxes,
    version: preference.version
  };
}

export async function getOperationalPreference(shopId: string): Promise<OperationalPreferenceRecord | null> {
  const preference = await prisma.operationalPreference.findUnique({ where: { shopId } });
  return preference ? mapPreference(preference) : null;
}

export interface UpdateOperationalPreferenceArgs {
  shopId: string;
  payload: OperationalPreferencePayload;
  actorId: string;
  actorEmail?: string;
}

export async function updateOperationalPreference(args: UpdateOperationalPreferenceArgs): Promise<OperationalPreferenceRecord> {
  const { shopId, payload, actorId, actorEmail } = args;
  const parsed = parseOperationalPreferencePayload(payload);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.operationalPreference.findUnique({ where: { shopId } });

    if (!existing) {
      ensureExpectedVersion(parsed.version, 0);
      const created = await tx.operationalPreference.create({
        data: {
          shopId,
          currencyCode: parsed.currencyCode,
          timezone: parsed.timezone,
          unitSystem: parsed.unitSystem,
          defaultUnitPrecision: parsed.defaultUnitPrecision,
          fiscalWeekStart: parsed.fiscalWeekStart,
          autoApplyTaxes: parsed.autoApplyTaxes ?? false,
          updatedBy: actorId,
          version: 1
        }
      });

      await recordSettingsChange({
        shopId,
        section: SettingsSection.operational,
        changeType: SettingsChangeType.create,
        actorId,
        actorEmail: actorEmail ?? 'unknown@inventauri.app',
        diff: buildSettingsDiff(null, mapPreference(created))
      });

      return mapPreference(created);
    }

    ensureExpectedVersion(parsed.version, existing.version);

    const updated = await tx.operationalPreference.update({
      where: { shopId },
      data: {
        currencyCode: parsed.currencyCode,
        timezone: parsed.timezone,
        unitSystem: parsed.unitSystem,
        defaultUnitPrecision: parsed.defaultUnitPrecision,
        fiscalWeekStart: parsed.fiscalWeekStart,
        autoApplyTaxes: parsed.autoApplyTaxes ?? existing.autoApplyTaxes,
        updatedBy: actorId,
        version: existing.version + 1
      }
    });

    await recordSettingsChange({
      shopId,
      section: SettingsSection.operational,
      changeType: SettingsChangeType.update,
      actorId,
      actorEmail: actorEmail ?? 'unknown@inventauri.app',
      diff: buildSettingsDiff(mapPreference(existing), mapPreference(updated))
    });

    return mapPreference(updated);
  });
}
