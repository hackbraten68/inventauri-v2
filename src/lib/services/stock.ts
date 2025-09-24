import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../prisma';

const DECIMAL_SCALE = 3;

async function ensureVariantId(
  tx: Prisma.TransactionClient,
  itemId: string,
  shopId?: string
): Promise<string | undefined> {
  // If no shopId, try to derive from item
  const item = await tx.item.findUnique({
    where: { id: itemId },
    select: { id: true, sku: true, name: true, shopId: true }
  });
  if (!item) return undefined;
  const tenantId = shopId || item.shopId;
  if (!tenantId) return undefined;

  // Try to find existing ProductVariant by (shopId, sku)
  const anyTx = tx as any;
  const existing = await anyTx.productVariant.findUnique?.({
    where: { shopId_sku: { shopId: tenantId, sku: item.sku } }
  });
  if (existing?.id) return existing.id as string;

  // If not found, ensure Product and create Variant
  const product =
    (await anyTx.product.findFirst({ where: { shopId: tenantId, name: item.name } })) ||
    (await anyTx.product.create({ data: { name: item.name, shopId: tenantId, description: item.name } }));

  const variant = await anyTx.productVariant.create({
    data: {
      productId: product.id,
      shopId: tenantId,
      sku: item.sku,
      unit: 'pcs'
    }
  });
  return variant.id as string;
}

interface BaseMutationOptions {
  reference?: string;
  notes?: string;
  performedBy?: string;
  occurredAt?: Date;
  // staged multi-tenant field
  shopId?: string;
}

interface InboundOptions extends BaseMutationOptions {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

interface TransferOptions extends BaseMutationOptions {
  itemId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  quantity: number;
}

interface AdjustmentOptions extends BaseMutationOptions {
  itemId: string;
  warehouseId: string;
  delta: number;
}

interface SaleOptions extends BaseMutationOptions {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

interface WriteOffOptions extends BaseMutationOptions {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

interface DonationOptions extends BaseMutationOptions {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

interface ReturnOptions extends BaseMutationOptions {
  itemId: string;
  warehouseId: string;
  quantity: number;
}

interface MutationResult {
  transactionId: string;
  itemId: string;
  updatedWarehouses: Array<{
    warehouseId: string;
    quantityOnHand: number;
    quantityReserved: number;
  }>;
}

function toDecimal(value: number) {
  return new Prisma.Decimal(value.toFixed(DECIMAL_SCALE));
}

function toNumber(value: Prisma.Decimal | number) {
  return value instanceof Prisma.Decimal ? Number(value.toFixed(DECIMAL_SCALE)) : value;
}

async function mutateStockLevel(
  tx: Prisma.TransactionClient,
  params: {
    itemId: string;
    warehouseId: string;
    deltaOnHand: number;
    deltaReserved?: number;
    shopId?: string;
    variantId?: string;
  }
) {
  const { itemId, warehouseId, deltaOnHand, deltaReserved = 0, shopId, variantId } = params;

  const existing = await tx.itemStockLevel.findUnique({
    where: {
      warehouseId_itemId: {
        warehouseId,
        itemId
      }
    }
  });

  if (!existing) {
    if (deltaOnHand < 0 || deltaReserved < 0) {
      throw new Error('Ungenügender Bestand für diese Operation.');
    }

    return tx.itemStockLevel.create({
      data: {
        warehouseId,
        itemId,
        quantityOnHand: toDecimal(deltaOnHand),
        quantityReserved: toDecimal(deltaReserved),
        // staged multi-tenant field
        shopId: shopId || undefined,
        // Phase 3: attach variant
        variantId: variantId || undefined
      } as any
    });
  }

  const nextOnHand = toNumber(existing.quantityOnHand) + deltaOnHand;
  const nextReserved = toNumber(existing.quantityReserved) + deltaReserved;

  if (nextOnHand < 0 || nextReserved < 0) {
    throw new Error('Ungenügender Bestand für diese Operation.');
  }

  return tx.itemStockLevel.update({
    where: {
      warehouseId_itemId: {
        warehouseId,
        itemId
      }
    },
    data: {
      quantityOnHand: toDecimal(nextOnHand),
      quantityReserved: toDecimal(nextReserved)
    }
  });
}

async function buildResult(
  tx: Prisma.TransactionClient,
  itemId: string,
  warehouses: string[],
  transactionId: string,
  shopId?: string
): Promise<MutationResult> {
  const stockLevels = await tx.itemStockLevel.findMany({
    where: {
      itemId,
      warehouseId: { in: warehouses },
      ...(shopId ? { shopId } : {})
    }
  });

  return {
    transactionId,
    itemId,
    updatedWarehouses: stockLevels.map((level) => ({
      warehouseId: level.warehouseId,
      quantityOnHand: toNumber(level.quantityOnHand),
      quantityReserved: toNumber(level.quantityReserved)
    }))
  };
}

function assertPositive(quantity: number, context: string) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`${context}: Menge muss größer als 0 sein.`);
  }
}

export async function createInbound(options: InboundOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt, shopId } = options;
  assertPositive(quantity, 'Einbuchung');

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: quantity,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.inbound,
        quantity: toDecimal(quantity),
        targetWarehouseId: warehouseId,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id, shopId);
  });
}

export async function transferStock(options: TransferOptions): Promise<MutationResult> {
  const { itemId, sourceWarehouseId, targetWarehouseId, quantity, reference, notes, performedBy, occurredAt, shopId } = options;
  assertPositive(quantity, 'Umbuchung');

  if (sourceWarehouseId === targetWarehouseId) {
    throw new Error('Umbuchung erfordert unterschiedliche Lager.');
  }

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId: sourceWarehouseId,
      deltaOnHand: -quantity,
      shopId,
      variantId
    });

    await mutateStockLevel(tx, {
      itemId,
      warehouseId: targetWarehouseId,
      deltaOnHand: quantity,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.transfer,
        quantity: toDecimal(quantity),
        sourceWarehouseId,
        targetWarehouseId,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [sourceWarehouseId, targetWarehouseId], transaction.id, shopId);
  });
}

export async function adjustStock(options: AdjustmentOptions): Promise<MutationResult> {
  const { itemId, warehouseId, delta, reference, notes, performedBy, occurredAt, shopId } = options;
  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error('Korrekturen benötigen einen Wert ungleich 0.');
  }

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: delta,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.adjustment,
        quantity: toDecimal(Math.abs(delta)),
        targetWarehouseId: delta > 0 ? warehouseId : null,
        sourceWarehouseId: delta < 0 ? warehouseId : null,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id, shopId);
  });
}

export async function recordSale(options: SaleOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt, shopId } = options;
  assertPositive(quantity, 'Verkauf');

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: -quantity,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.sale,
        quantity: toDecimal(quantity),
        sourceWarehouseId: warehouseId,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id, shopId);
  });
}

export async function recordWriteOff(options: WriteOffOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt, shopId } = options;
  assertPositive(quantity, 'Abschreibung');

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: -quantity,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.writeoff,
        quantity: toDecimal(quantity),
        sourceWarehouseId: warehouseId,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id, shopId);
  });
}

export async function recordDonation(options: DonationOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt, shopId } = options;
  assertPositive(quantity, 'Spende');

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: -quantity,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.donation,
        quantity: toDecimal(quantity),
        sourceWarehouseId: warehouseId,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id, shopId);
  });
}

export async function recordReturn(options: ReturnOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt, shopId } = options;
  assertPositive(quantity, 'Retoure');

  return prisma.$transaction(async (tx) => {
    const variantId = await ensureVariantId(tx, itemId, shopId);
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: quantity,
      shopId,
      variantId
    });

    const transaction = await tx.stockTransaction.create({
      data: {
        itemId,
        transactionType: TransactionType.return,
        quantity: toDecimal(quantity),
        targetWarehouseId: warehouseId,
        reference,
        notes,
        performedBy,
        occurredAt: occurredAt ?? new Date(),
        shopId: shopId || undefined,
        variantId: variantId || undefined
      } as any
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id, shopId);
  });
}

export interface HistoryFilters {
  itemId: string;
  limit?: number;
  offset?: number;
  transactionTypes?: TransactionType[];
  warehouseId?: string;
  from?: Date;
  to?: Date;
  // staged multi-tenant filter
  shopId?: string;
}

export async function getItemHistory(filters: HistoryFilters) {
  const { itemId, limit = 50, offset = 0, transactionTypes, warehouseId, from, to } = filters;

  return prisma.stockTransaction.findMany({
    where: {
      itemId,
      transactionType: transactionTypes ? { in: transactionTypes } : undefined,
      OR: warehouseId
        ? [
            { sourceWarehouseId: warehouseId },
            { targetWarehouseId: warehouseId }
          ]
        : undefined,
      shopId: filters.shopId ?? undefined,
      occurredAt: {
        gte: from ?? undefined,
        lte: to ?? undefined
      }
    },
    orderBy: { occurredAt: 'desc' },
    take: limit,
    skip: offset
  });
}
