import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../lib/api/response';
import { requireSettingsAdmin } from '../../../lib/api/settings/guard';
import {
  getBusinessProfile,
  updateBusinessProfile
} from '../../../lib/data/settings/business-profile';
import { parseBusinessProfilePayload, ValidationError } from '../../../lib/settings/validation';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { shopId } = await requireSettingsAdmin(request);
    const profile = await getBusinessProfile(shopId);
    if (!profile) {
      return json({
        legalName: '',
        displayName: '',
        taxId: null,
        email: '',
        phone: null,
        website: null,
        addressLine1: '',
        addressLine2: null,
        city: '',
        postalCode: '',
        country: 'DE',
        version: 0
      });
    }
    return json(profile);
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
    const payload = parseBusinessProfilePayload(await request.json());
    const profile = await updateBusinessProfile({
      shopId: context.shopId,
      payload,
      actorId: context.userId,
      actorEmail: context.userEmail
    });
    return json(profile);
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
