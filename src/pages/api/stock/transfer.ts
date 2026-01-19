import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { transferStock } from '../../../lib/services/stock';
import { getInventorySnapshot } from '../../../lib/data/inventory';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const payload = await request.json();
    const { itemId, sourceWarehouseId, targetWarehouseId, quantity, reference, notes, occurredAt } = payload ?? {};

    if (typeof itemId !== 'string' || typeof sourceWarehouseId !== 'string' || typeof targetWarehouseId !== 'string') {
      return errorResponse('itemId, sourceWarehouseId und targetWarehouseId sind erforderlich.');
    }

    if (typeof quantity !== 'number') {
      return errorResponse('quantity muss eine Zahl sein.');
    }

    const result = await transferStock({
      itemId,
      sourceWarehouseId,
      targetWarehouseId,
      quantity,
      reference,
      notes,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      performedBy: user.email ?? user.id
    });
    const snapshot = await getInventorySnapshot();

    return json({ result, snapshot });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
