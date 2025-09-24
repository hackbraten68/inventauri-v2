import { prisma } from '../prisma';

export async function getPosInventory(warehouseSlug?: string, shopId?: string) {
  const warehouse = warehouseSlug
    ? await prisma.warehouse.findUnique({ where: { slug: warehouseSlug } })
    : await prisma.warehouse.findFirst({ where: { type: 'pos' } });

  if (!warehouse) {
    return { warehouse: null, items: [] };
  }

  const stockLevels = await prisma.itemStockLevel.findMany({
    where: { warehouseId: warehouse.id, ...(shopId ? { shopId } : {}) },
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

export async function getSalesByReference(reference: string, shopId?: string) {
  return prisma.stockTransaction.findMany({
    where: {
      transactionType: 'sale',
      reference,
      ...(shopId ? { shopId } : {})
    },
    include: {
      item: true,
      sourceWarehouse: true
    },
    orderBy: { occurredAt: 'asc' }
  });
}
