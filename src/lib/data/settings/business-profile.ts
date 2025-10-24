import { SettingsChangeType, SettingsSection } from '@prisma/client';
import { prisma } from '../../prisma';
import { buildSettingsDiff, recordSettingsChange } from './audit';
import {
  ensureExpectedVersion,
  parseBusinessProfilePayload,
  type BusinessProfilePayload
} from '../../settings/validation';

export interface BusinessProfileRecord {
  legalName: string;
  displayName: string;
  taxId: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  version: number;
}

function mapProfile(profile: {
  legalName: string;
  displayName: string;
  taxId: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  postalCode: string;
  country: string;
  version: number;
}): BusinessProfileRecord {
  return {
    legalName: profile.legalName,
    displayName: profile.displayName,
    taxId: profile.taxId,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    addressLine1: profile.addressLine1,
    addressLine2: profile.addressLine2,
    city: profile.city,
    postalCode: profile.postalCode,
    country: profile.country,
    version: profile.version
  };
}

export async function getBusinessProfile(shopId: string): Promise<BusinessProfileRecord | null> {
  const profile = await prisma.businessProfile.findUnique({
    where: { shopId }
  });
  if (!profile) {
    return null;
  }
  return mapProfile(profile);
}

export interface UpdateBusinessProfileArgs {
  shopId: string;
  payload: BusinessProfilePayload;
  actorId: string;
  actorEmail?: string;
}

export async function updateBusinessProfile(args: UpdateBusinessProfileArgs): Promise<BusinessProfileRecord> {
  const { shopId, payload, actorId, actorEmail } = args;
  const parsed = parseBusinessProfilePayload(payload);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.businessProfile.findUnique({ where: { shopId } });

    if (!existing) {
      ensureExpectedVersion(parsed.version, 0);
      const created = await tx.businessProfile.create({
        data: {
          shopId,
          legalName: parsed.legalName,
          displayName: parsed.displayName,
          taxId: parsed.taxId,
          email: parsed.email,
          phone: parsed.phone,
          website: parsed.website,
          addressLine1: parsed.addressLine1,
          addressLine2: parsed.addressLine2,
          city: parsed.city,
          postalCode: parsed.postalCode,
          country: parsed.country,
          updatedBy: actorId,
          version: 1
        }
      });

      await recordSettingsChange({
        shopId,
        section: SettingsSection.business_profile,
        changeType: SettingsChangeType.create,
        actorId,
        actorEmail: actorEmail ?? 'unknown@inventauri.app',
        diff: buildSettingsDiff(null, mapProfile(created))
      });

      return mapProfile(created);
    }

    ensureExpectedVersion(parsed.version, existing.version);

    const updated = await tx.businessProfile.update({
      where: { shopId },
      data: {
        legalName: parsed.legalName,
        displayName: parsed.displayName,
        taxId: parsed.taxId,
        email: parsed.email,
        phone: parsed.phone,
        website: parsed.website,
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2,
        city: parsed.city,
        postalCode: parsed.postalCode,
        country: parsed.country,
        updatedBy: actorId,
        version: existing.version + 1
      }
    });

    await recordSettingsChange({
      shopId,
      section: SettingsSection.business_profile,
      changeType: SettingsChangeType.update,
      actorId,
      actorEmail: actorEmail ?? 'unknown@inventauri.app',
      diff: buildSettingsDiff(mapProfile(existing), mapProfile(updated))
    });

    return mapProfile(updated);
  });
}
