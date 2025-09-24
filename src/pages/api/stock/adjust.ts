import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { adjustStock } from '../../../lib/services/stock';
import { getInventorySnapshot } from '../../../lib/data/inventory';
import { getUserShopIdOrThrow } from '../../../lib/tenant';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const shopId = await getUserShopIdOrThrow(user.id);
    const payload = await request.json();
    const { itemId, warehouseId, delta, reference, notes, occurredAt } = payload ?? {};

    if (typeof itemId !== 'string' || typeof warehouseId !== 'string') {
      return errorResponse('itemId und warehouseId sind erforderlich.');
    }

    if (typeof delta !== 'number') {
      return errorResponse('delta muss eine Zahl sein.');
    }

    const result = await adjustStock({
      itemId,
      warehouseId,
      delta,
      reference,
      notes,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      performedBy: user.email ?? user.id,
      shopId
    });
    const snapshot = await getInventorySnapshot();

    return json({ result, snapshot });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
