import { prisma } from '../prisma';

export async function getPosInventory(warehouseSlug: string | undefined, shopId: string) {
  if (!shopId) {
    throw new Error('shopId ist erforderlich, um POS Inventar abzurufen.');
  }
  const warehouse = warehouseSlug
    ? await prisma.warehouse.findUnique({ where: { slug: warehouseSlug } })
    : await prisma.warehouse.findFirst({ where: { type: 'pos' } });

  if (!warehouse) {
    return { warehouse: null, items: [] };
  }

  const stockLevels = await prisma.itemStockLevel.findMany({
    where: { warehouseId: warehouse.id, shopId },
    include: { item: true },
    orderBy: { item: { name: 'asc' } }
  });

  return {
    warehouse,
    items: stockLevels.map((level) => ({
      itemId: level.itemId,
      name: level.item.name,
      sku: level.item.sku,
      unit: level.item.unit,
      quantityOnHand: Number(level.quantityOnHand),
      quantityReserved: Number(level.quantityReserved)
    }))
  };
}

export async function listPosWarehouses() {
  return prisma.warehouse.findMany({
    where: { type: 'pos' },
    orderBy: { name: 'asc' }
  });
}

export async function getSalesByReference(reference: string) {
  return prisma.stockTransaction.findMany({
    where: {
      transactionType: 'sale',
      reference
    },
    include: {
      item: true,
      sourceWarehouse: true
    },
    orderBy: { occurredAt: 'asc' }
  });
}
