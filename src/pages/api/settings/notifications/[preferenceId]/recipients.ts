import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../../../lib/api/response';
import { requireSettingsAdmin } from '../../../../../lib/api/settings/guard';
import {
  addNotificationRecipient,
  removeNotificationRecipient
} from '../../../../../lib/data/settings/notifications';
import { ValidationError } from '../../../../../lib/settings/validation';

export const POST: APIRoute = async ({ request, params }) => {
  try {
    const context = await requireSettingsAdmin(request);
    const payload = await request.json();
    const recipient = await addNotificationRecipient({
      shopId: context.shopId,
      preferenceId: params.preferenceId!,
      actorId: context.userId,
      actorEmail: context.userEmail,
      userShopId: payload.userShopId,
      email: payload.email
    });
    return json(recipient, { status: 201 });
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

export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    const context = await requireSettingsAdmin(request);
    const payload = await request.json();
    await removeNotificationRecipient({
      shopId: context.shopId,
      preferenceId: params.preferenceId!,
      actorId: context.userId,
      actorEmail: context.userEmail,
      userShopId: payload.userShopId,
      email: payload.email
    });
    return new Response(null, { status: 204 });
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
