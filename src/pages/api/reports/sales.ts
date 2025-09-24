import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { getUserShopIdOrThrow } from '../../../lib/tenant';
import { getSalesTotals, type Interval } from '../../../lib/data/reports';

export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const shopId = await getUserShopIdOrThrow(user.id);

    const url = new URL(request.url);
    const intervalParam = (url.searchParams.get('interval') || 'day').toLowerCase();
    const interval: Interval = ['day', 'week', 'month'].includes(intervalParam) ? (intervalParam as Interval) : 'day';

    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;

    const buckets = await getSalesTotals({ shopId, interval, from, to });
    return json({ interval, from: from?.toISOString(), to: to?.toISOString(), data: buckets });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
