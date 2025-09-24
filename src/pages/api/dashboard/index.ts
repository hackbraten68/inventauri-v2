import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { getDashboardSnapshot } from '../../../lib/data/dashboard';

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const rangeParam = url.searchParams.get('range');
    const rangeDays = rangeParam ? Number(rangeParam) : undefined;

    const snapshot = await getDashboardSnapshot({ rangeDays });
    return json(snapshot);
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
