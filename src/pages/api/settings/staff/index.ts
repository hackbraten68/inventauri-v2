import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../../lib/api/response';
import { requireSettingsAdmin } from '../../../../lib/api/settings/guard';
import { listStaff } from '../../../../lib/data/settings/staff';
import { ValidationError } from '../../../../lib/settings/validation';

export const GET: APIRoute = async ({ request }) => {
  try {
    const { shopId } = await requireSettingsAdmin(request);
    const staff = await listStaff(shopId);
    return json(staff);
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
