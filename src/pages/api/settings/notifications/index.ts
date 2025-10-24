import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../../lib/api/response';
import { requireSettingsAdmin } from '../../../../lib/api/settings/guard';
import {
  listNotificationPreferences,
  updateNotificationPreferences
} from '../../../../lib/data/settings/notifications';
import { ValidationError } from '../../../../lib/settings/validation';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { shopId } = await requireSettingsAdmin(request);
    const preferences = await listNotificationPreferences(shopId);
    return json(preferences);
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

export const PATCH: APIRoute = async ({ request }) => {
  try {
    const context = await requireSettingsAdmin(request);
    const payload = await request.json();
    const preferences = await updateNotificationPreferences({
      shopId: context.shopId,
      actorId: context.userId,
      actorEmail: context.userEmail,
      payload
    });
    return json(preferences);
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
