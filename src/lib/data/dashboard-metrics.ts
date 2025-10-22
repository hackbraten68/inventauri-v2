import { subDays } from 'date-fns';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

type DecimalLike = Prisma.Decimal | number | null | undefined;

function toNumber(value: DecimalLike) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

export type SalesMetric = 'revenue' | 'units';

export interface SalesDeltaResult {
  currentTotal: number;
  priorTotal: number;
  absolute: number;
  percentage: number | null;
  direction: 'up' | 'down' | 'flat' | 'na';
  metric: SalesMetric;
}

export interface SalesVelocityResult {
  averageDaily: number | null;
  observedDays: number;
}

export interface InboundCoverageResult {
  totalInboundUnits: number;
  nextArrivalDate: Date | null;
  references: string[];
}

export interface DaysOfCoverResult {
  daysOfCover: number | null;
  status: 'ok' | 'risk' | 'insufficient-data';
  averageDaily: number | null;
  observedDays: number;
}

function resolveDirection(absolute: number, percentage: number | null): SalesDeltaResult['direction'] {
  if (percentage === null) return 'na';
  if (absolute > 0) return 'up';
  if (absolute < 0) return 'down';
  return 'flat';
}

function safePercentage(current: number, prior: number) {
  if (!Number.isFinite(prior) || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

export async function computeSalesDelta(params: {
  shopId?: string;
  rangeDays: number;
  metric: SalesMetric;
}): Promise<SalesDeltaResult> {
  const { shopId, rangeDays, metric } = params;
  const now = new Date();
  const currentStart = subDays(now, rangeDays);
  const priorStart = subDays(currentStart, rangeDays);

  const whereBase = {
    occurredAt: { gte: priorStart },
    transactionType: 'sale' as const,
    ...(shopId ? { shopId } : {})
  };

  const transactions = await prisma.stockTransaction.findMany({
    where: whereBase,
    select: {
      quantity: true,
      occurredAt: true,
      item: metric === 'revenue' ? { select: { metadata: true } } : undefined
    }
  });

  let currentTotal = 0;
  let priorTotal = 0;

  for (const entry of transactions) {
    const quantity = toNumber(entry.quantity);
    const value = metric === 'revenue' ? quantity * parsePrice(entry.item?.metadata) : quantity;
    if (entry.occurredAt >= currentStart) {
      currentTotal += value;
    } else {
      priorTotal += value;
    }
  }

  const absolute = currentTotal - priorTotal;
  const percentage = safePercentage(currentTotal, priorTotal);

  return {
    currentTotal,
    priorTotal,
    absolute,
    percentage,
    direction: resolveDirection(absolute, percentage),
    metric
  };
}

function parsePrice(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') return 0;
  const price = (metadata as Record<string, unknown>).price;
  const numeric = typeof price === 'number' ? price : Number(price);
  return Number.isFinite(numeric) ? numeric : 0;
}

export async function computeSalesVelocity(params: {
  shopId?: string;
  itemId: string;
  warehouseId?: string;
  rangeDays: number;
}): Promise<SalesVelocityResult> {
  const { shopId, itemId, rangeDays, warehouseId } = params;
  const since = subDays(new Date(), rangeDays);

  const where: Prisma.StockTransactionWhereInput = {
    itemId,
    transactionType: 'sale',
    occurredAt: { gte: since },
    ...(shopId ? { shopId } : {}),
    ...(warehouseId ? { targetWarehouseId: warehouseId } : {})
  };

  const aggregate = await prisma.stockTransaction.aggregate({
    where,
    _sum: { quantity: true },
    _min: { occurredAt: true }
  });

  if (!aggregate._min.occurredAt) {
    return { averageDaily: null, observedDays: 0 };
  }

  const totalSold = toNumber(aggregate._sum.quantity);
  const observedDays = Math.max(
    1,
    Math.min(rangeDays, Math.ceil((Date.now() - aggregate._min.occurredAt.getTime()) / (1000 * 60 * 60 * 24)))
  );

  if (totalSold <= 0 || observedDays < 3) {
    return { averageDaily: null, observedDays };
  }

  const averageDaily = totalSold / observedDays;

  return {
    averageDaily,
    observedDays
  };
}

export async function computeInboundCoverage(params: {
  shopId?: string;
  itemId: string;
  rangeDays: number;
}): Promise<InboundCoverageResult> {
  const { shopId, itemId, rangeDays } = params;
  const since = subDays(new Date(), rangeDays);

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      itemId,
      transactionType: 'inbound',
      occurredAt: { gte: since },
      ...(shopId ? { shopId } : {})
    },
    select: {
      quantity: true,
      occurredAt: true,
      reference: true
    }
  });

  if (!transactions.length) {
    return {
      totalInboundUnits: 0,
      nextArrivalDate: null,
      references: []
    };
  }

  const totalInboundUnits = transactions.reduce((sum, entry) => sum + toNumber(entry.quantity), 0);
  const nextArrivalDate = transactions.reduce<Date | null>((earliest, entry) => {
    if (!entry.occurredAt) return earliest;
    if (!earliest || entry.occurredAt < earliest) return entry.occurredAt;
    return earliest;
  }, null);

  const references = Array.from(
    new Set(transactions.map((entry) => entry.reference).filter((ref): ref is string => Boolean(ref)))
  ).slice(0, 5);

  return {
    totalInboundUnits,
    nextArrivalDate,
    references
  };
}

export async function calculateDaysOfCover(params: {
  shopId?: string;
  itemId: string;
  warehouseId: string;
  onHandQuantity: number;
  rangeDays: number;
  riskDaysThreshold?: number;
}): Promise<DaysOfCoverResult> {
  const { shopId, itemId, warehouseId, onHandQuantity, rangeDays, riskDaysThreshold = 3 } = params;
  const velocity = await computeSalesVelocity({ shopId, itemId, warehouseId, rangeDays });

  if (!velocity.averageDaily || velocity.averageDaily <= 0) {
    return {
      daysOfCover: null,
      status: 'insufficient-data',
      averageDaily: null,
      observedDays: velocity.observedDays
    };
  }

  const rawCover = onHandQuantity / velocity.averageDaily;
  if (!Number.isFinite(rawCover)) {
    return {
      daysOfCover: null,
      status: 'insufficient-data',
      averageDaily: velocity.averageDaily,
      observedDays: velocity.observedDays
    };
  }

  const roundedCover = Number(rawCover.toFixed(1));
  const status = roundedCover <= riskDaysThreshold ? 'risk' : 'ok';

  return {
    daysOfCover: roundedCover,
    status,
    averageDaily: Number(velocity.averageDaily.toFixed(2)),
    observedDays: velocity.observedDays
  };
}
