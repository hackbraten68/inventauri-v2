import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../../lib/api/response';
import { requireSettingsAdmin } from '../../../../lib/api/settings/guard';
import { updateStaffMember } from '../../../../lib/data/settings/staff';
import { ValidationError } from '../../../../lib/settings/validation';

export const PATCH: APIRoute = async ({ request, params }) => {
  try {
    const context = await requireSettingsAdmin(request);
    const payload = await request.json();
    const updated = await updateStaffMember({
      shopId: context.shopId,
      userShopId: params.userShopId!,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      status: typeof payload.status === 'string' ? payload.status : undefined,
      actorId: context.userId
    });
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
