import type { APIRoute } from 'astro';
export const prerender = false;
import { requireUser } from '../../../lib/auth/server';
import { json, errorResponse } from '../../../lib/api/response';
import { recordSale } from '../../../lib/services/stock';
import { getInventorySnapshot } from '../../../lib/data/inventory';
import { getSalesByReference } from '../../../lib/data/pos';
import { generateSaleReference } from '../../../lib/utils';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ request }) => {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return errorResponse('reference ist erforderlich.');
    }

    const transactions = await getSalesByReference(reference);
    if (transactions.length === 0) {
      return json({ reference, items: [], transactions: [] });
    }

    const itemsMap = new Map<string, {
      itemId: string;
      name: string;
      sku: string;
      unit: string;
      warehouseId: string;
      warehouseName: string;
      quantity: number;
      transactionIds: string[];
    }>();

    for (const transaction of transactions) {
      const key = transaction.itemId;
      const existing = itemsMap.get(key);
      const quantity = Number(transaction.quantity);
      if (existing) {
        existing.quantity += quantity;
        existing.transactionIds.push(transaction.id);
      } else {
        itemsMap.set(key, {
          itemId: transaction.itemId,
          name: transaction.item.name,
          sku: transaction.item.sku,
          unit: transaction.item.unit,
          warehouseId: transaction.sourceWarehouseId ?? '',
          warehouseName: transaction.sourceWarehouse?.name ?? '',
          quantity,
          transactionIds: [transaction.id]
        });
      }
    }

    return json({
      reference,
      warehouseId: transactions[0].sourceWarehouseId,
      warehouseName: transactions[0].sourceWarehouse?.name,
      items: Array.from(itemsMap.values()),
      transactions: transactions.map((transaction) => ({
        id: transaction.id,
        itemId: transaction.itemId,
        quantity: Number(transaction.quantity),
        occurredAt: transaction.occurredAt,
        notes: transaction.notes,
        performedBy: transaction.performedBy
      }))
    });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await requireUser(request);
    const payload = await request.json();
    const { itemId, warehouseId, quantity, reference, notes, occurredAt } = payload ?? {};

    if (typeof itemId !== 'string' || typeof warehouseId !== 'string') {
      return errorResponse('itemId und warehouseId sind erforderlich.');
    }

    if (typeof quantity !== 'number') {
      return errorResponse('quantity muss eine Zahl sein.');
    }

    let saleReference = reference;
    if (!saleReference) {
      const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
      saleReference = generateSaleReference(warehouse?.slug);
    }

    const result = await recordSale({
      itemId,
      warehouseId,
      quantity,
      reference: saleReference,
      notes,
      occurredAt: occurredAt ? new Date(occurredAt) : undefined,
      performedBy: user.email ?? user.id
    });
    const snapshot = await getInventorySnapshot();

    return json({ result, snapshot, reference: saleReference });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === 'number' ? (error as { status?: number }).status : 500;
    return errorResponse((error as Error).message ?? 'Unbekannter Fehler', status);
  }
};
