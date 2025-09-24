import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../prisma';

export interface CreateItemInput {
  name: string;
  sku: string;
  unit?: string;
  barcode?: string | null;
  description?: string | null;
  metadata?: Prisma.InputJsonValue;
  initialStock?: number;
  warehouseId?: string | null;
  reference?: string | null;
  notes?: string | null;
  performedBy?: string | null;
  shopId?: string | null;
}

export async function createItemWithStock(input: CreateItemInput) {
  const {
    name,
    sku,
    unit = 'stk',
    barcode,
    description,
    metadata,
    initialStock = 0,
    warehouseId,
    reference,
    notes,
    performedBy
  } = input;

  if (!name.trim()) {
    throw new Error('Name ist erforderlich.');
  }
  if (!sku.trim()) {
    throw new Error('SKU ist erforderlich.');
  }

  return prisma.$transaction(async (tx) => {
    // Enforce tenant-scoped SKU uniqueness
    const existing = await tx.item.findFirst({ where: { sku, shopId: input.shopId || undefined } });
    if (existing) {
      throw new Error('SKU existiert bereits.');
    }

    const item = await tx.item.create({
      data: {
        name,
        sku,
        unit,
        barcode: barcode || undefined,
        description: description || undefined,
        metadata,
        // staged multi-tenant field
        shopId: input.shopId || undefined
      }
    });

    // Phase 2 dual-write: mirror to Product + ProductVariant (backward-compatible)
    // Only if we have a shopId to scope under
    if (input.shopId) {
      const anyTx = tx as any;
      // Reuse product by name within shop if it exists, else create
      const product =
        (await anyTx.product.findFirst({ where: { shopId: input.shopId, name } })) ||
        (await anyTx.product.create({
          data: {
            name,
            description: description || undefined,
            shopId: input.shopId
          }
        }));

      // Ensure a variant exists for this SKU within the tenant
      await anyTx.productVariant.upsert({
        where: {
          shopId_sku: {
            shopId: input.shopId,
            sku
          }
        },
        update: {
          unit,
          barcode: barcode || undefined,
          // Keep price in metadata for now; pricing model will move to variant later
          // price: undefined
          isActive: true
        },
        create: {
          productId: product.id,
          shopId: input.shopId,
          sku,
          unit,
          barcode: barcode || undefined,
          // price: undefined
          isActive: true
        }
      });
    }

    let stockLevel = null;
    if (warehouseId && initialStock > 0) {
      stockLevel = await tx.itemStockLevel.upsert({
        where: {
          warehouseId_itemId: {
            warehouseId,
            itemId: item.id
          }
        },
        update: {
          quantityOnHand: new Prisma.Decimal(initialStock)
        },
        create: {
          warehouseId,
          itemId: item.id,
          quantityOnHand: new Prisma.Decimal(initialStock),
          // staged multi-tenant field
          shopId: input.shopId || undefined
        }
      });

      await tx.stockTransaction.create({
        data: {
          itemId: item.id,
          transactionType: TransactionType.inbound,
          quantity: new Prisma.Decimal(initialStock),
          targetWarehouseId: warehouseId,
          reference: reference ?? 'ITEM_INIT',
          notes: notes ?? 'Initiale Bestandsanlage',
          performedBy: performedBy || undefined,
          // staged multi-tenant field
          shopId: input.shopId || undefined
        }
      });
    }

    return {
      item,
      stockLevel
    };
  });
}

export async function deleteItem(itemId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new Error('Artikel nicht gefunden.');
    }

    await tx.stockTransaction.deleteMany({ where: { itemId } });
    await tx.itemStockLevel.deleteMany({ where: { itemId } });
    await tx.item.delete({ where: { id: itemId } });

    return { itemId };
  });
}
