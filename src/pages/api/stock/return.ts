import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { recordReturn } from '../../../lib/services/stock';
import { getInventorySnapshot } from '../../../lib/data/inventory';
import { getUserShopIdOrThrow } from '../../../lib/tenant';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const shopId = await getUserShopIdOrThrow(user.id);
    const payload = await request.json();
    const { itemId, warehouseId, quantity, reference, notes, occurredAt, reason } = payload ?? {};

    if (typeof itemId !== 'string' || typeof warehouseId !== 'string') {
      return errorResponse('itemId und warehouseId sind erforderlich.');
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      return errorResponse('quantity muss größer 0 sein.');
    }

    if (!reference) {
      return errorResponse('reference ist erforderlich, um eine Retoure einem Verkauf zuzuordnen.');
    }

    const formattedNotes = [notes, reason ? `Grund: ${reason}` : null]
      .filter(Boolean)
      .join(' \n')
      .trim() || undefined;

    const result = await recordReturn({
      itemId,
      warehouseId,
      quantity,
      reference,
      notes: formattedNotes,
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
