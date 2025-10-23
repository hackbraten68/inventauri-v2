import type { APIRoute } from 'astro';
export const prerender = false;

import { json, errorResponse } from '../../../lib/api/response';
import { requireSettingsAdmin } from '../../../lib/api/settings/guard';
import { listSettingsAuditLogs } from '../../../lib/data/settings/audit';
import { ValidationError } from '../../../lib/settings/validation';

export const GET: APIRoute = async ({ request, url }) => {
  try {
    const { shopId } = await requireSettingsAdmin(request);
    const section = url.searchParams.get('section') ?? undefined;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;

    if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
      throw new ValidationError('Limit muss eine positive Zahl sein.', 422);
    }

    const logs = await listSettingsAuditLogs({
      shopId,
      section: section as any,
      limit
    });
    return json(logs);
  } catch (cause) {
    if (cause instanceof ValidationError) {
      return errorResponse(cause.message, cause.status ?? 422);
    }
    const status = typeof (cause as { status?: number }).status === 'number'
      ? (cause as { status: number }).status
      : 500;
    return errorResponse((cause as Error).message ?? 'Audit-Logs konnten nicht geladen werden.', status);
  }
};
