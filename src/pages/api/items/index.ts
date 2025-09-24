import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { createItemWithStock } from '../../../lib/data/items';
import { getInventorySnapshot } from '../../../lib/data/inventory';
import { getUserShopIdOrThrow } from '../../../lib/tenant';

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const shopId = await getUserShopIdOrThrow(user.id);
    const payload = await request.json();
    const {
      name,
      sku,
      unit,
      barcode,
      description,
      metadata,
      initialStock,
      warehouseId,
      reference,
      notes
    } = payload ?? {};

    if (typeof name !== 'string' || typeof sku !== 'string') {
      return errorResponse('Name und SKU sind erforderlich.');
    }

    const initialStockValue = typeof initialStock === 'number' ? initialStock : 0;
    if (initialStockValue < 0) {
      return errorResponse('Startbestand darf nicht negativ sein.');
    }

    const result = await createItemWithStock({
      name,
      sku,
      unit,
      barcode,
      description,
      metadata,
      initialStock: initialStockValue,
      warehouseId,
      reference,
      notes,
      performedBy: user.email ?? user.id,
      shopId
    });

    const snapshot = await getInventorySnapshot(shopId);

    return json({ item: result.item, stockLevel: result.stockLevel, snapshot }, { status: 201 });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
