import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../lib/api/response';
import { requireSettingsAdmin } from '../../../lib/api/settings/guard';
import {
  getOperationalPreference,
  updateOperationalPreference
} from '../../../lib/data/settings/operational';
import { parseOperationalPreferencePayload, ValidationError } from '../../../lib/settings/validation';
import { propagateOperationalChanges } from '../../../lib/services/settings/propagate';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { shopId } = await requireSettingsAdmin(request);
    const preference = await getOperationalPreference(shopId);
    if (!preference) {
      return json({
        currencyCode: 'EUR',
        timezone: 'Europe/Berlin',
        unitSystem: 'metric',
        defaultUnitPrecision: 2,
        fiscalWeekStart: 1,
        autoApplyTaxes: false,
        version: 0
      });
    }
    return json(preference);
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return errorResponse(cause.message, cause.status ?? 422);
    }
    const status = typeof (cause as { status?: number }).status === 'number'
      ? (cause as { status: number }).status
      : 500;
    return errorResponse((cause as Error).message ?? 'Unbekannter Fehler.', status);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const context = await requireSettingsAdmin(request);
    const payload = parseOperationalPreferencePayload(await request.json());
    const updated = await updateOperationalPreference({
      shopId: context.shopId,
      payload,
      actorId: context.userId,
      actorEmail: context.userEmail
    });
    await propagateOperationalChanges(context.shopId);
    return json(updated);
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return errorResponse(cause.message, cause.status ?? 422);
    }
    const status = typeof (cause as { status?: number }).status === 'number'
      ? (cause as { status: number }).status
      : 500;
    return errorResponse((cause as Error).message ?? 'Unbekannter Fehler.', status);
  }
};
