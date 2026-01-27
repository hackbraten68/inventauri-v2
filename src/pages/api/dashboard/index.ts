import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { getDashboardSnapshot } from '../../../lib/data/dashboard';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const rangeParam = url.searchParams.get('range');
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');

    const rangeDays = rangeParam ? Number(rangeParam) : undefined;
    const fromDate = fromParam ? new Date(fromParam) : undefined;
    const toDate = toParam ? new Date(toParam) : undefined;

    const snapshot = await getDashboardSnapshot({ rangeDays, fromDate, toDate });
    return json(snapshot);
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
