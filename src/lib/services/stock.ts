import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../prisma';

const DECIMAL_SCALE = 3;

interface BaseMutationOptions {
  reference?: string;
  notes?: string;
  performedBy?: string;
  occurredAt?: Date;
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
  }
) {
  const { itemId, warehouseId, deltaOnHand, deltaReserved = 0 } = params;

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
        quantityReserved: toDecimal(deltaReserved)
      }
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
  transactionId: string
): Promise<MutationResult> {
  const stockLevels = await tx.itemStockLevel.findMany({
    where: {
      itemId,
      warehouseId: { in: warehouses }
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
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt } = options;
  assertPositive(quantity, 'Einbuchung');

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: quantity
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id);
  });
}

export async function transferStock(options: TransferOptions): Promise<MutationResult> {
  const { itemId, sourceWarehouseId, targetWarehouseId, quantity, reference, notes, performedBy, occurredAt } = options;
  assertPositive(quantity, 'Umbuchung');

  if (sourceWarehouseId === targetWarehouseId) {
    throw new Error('Umbuchung erfordert unterschiedliche Lager.');
  }

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId: sourceWarehouseId,
      deltaOnHand: -quantity
    });

    await mutateStockLevel(tx, {
      itemId,
      warehouseId: targetWarehouseId,
      deltaOnHand: quantity
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [sourceWarehouseId, targetWarehouseId], transaction.id);
  });
}

export async function adjustStock(options: AdjustmentOptions): Promise<MutationResult> {
  const { itemId, warehouseId, delta, reference, notes, performedBy, occurredAt } = options;
  if (!Number.isFinite(delta) || delta === 0) {
    throw new Error('Korrekturen benötigen einen Wert ungleich 0.');
  }

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: delta
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id);
  });
}

export async function recordSale(options: SaleOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt } = options;
  assertPositive(quantity, 'Verkauf');

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: -quantity
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id);
  });
}

export async function recordWriteOff(options: WriteOffOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt } = options;
  assertPositive(quantity, 'Abschreibung');

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: -quantity
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id);
  });
}

export async function recordDonation(options: DonationOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt } = options;
  assertPositive(quantity, 'Spende');

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: -quantity
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id);
  });
}

export async function recordReturn(options: ReturnOptions): Promise<MutationResult> {
  const { itemId, warehouseId, quantity, reference, notes, performedBy, occurredAt } = options;
  assertPositive(quantity, 'Retoure');

  return prisma.$transaction(async (tx) => {
    await mutateStockLevel(tx, {
      itemId,
      warehouseId,
      deltaOnHand: quantity
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
        occurredAt: occurredAt ?? new Date()
      }
    });

    return buildResult(tx, itemId, [warehouseId], transaction.id);
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
