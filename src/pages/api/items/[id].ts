import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { deleteItem } from '../../../lib/data/items';
import { getInventorySnapshot } from '../../../lib/data/inventory';

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    await requireUser(request);
    const itemId = params.id;

    if (!itemId) {
      return errorResponse('itemId fehlt in der URL.', 400);
    }

    await deleteItem(itemId);
    const snapshot = await getInventorySnapshot();
    return json({ itemId, snapshot });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
