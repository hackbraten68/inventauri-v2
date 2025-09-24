import { Prisma, TransactionType } from '@prisma/client';
import { prisma } from '../prisma';

export type Interval = 'day' | 'week' | 'month';

export interface SalesTotalsParams {
  shopId: string;
  from?: Date;
  to?: Date;
  interval?: Interval;
}

export interface SalesBucket {
  periodStart: string; // ISO date for the bucket start
  totalQuantity: number;
}

function startOf(date: Date, interval: Interval): Date {
  const d = new Date(date);
  if (interval === 'day') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (interval === 'week') {
    const day = d.getDay();
    // make Monday start of week (ISO)
    const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // month
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addInterval(date: Date, interval: Interval): Date {
  const d = new Date(date);
  if (interval === 'day') {
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (interval === 'week') {
    d.setDate(d.getDate() + 7);
    return d;
  }
  d.setMonth(d.getMonth() + 1);
  return d;
}

export async function getSalesTotals(params: SalesTotalsParams): Promise<SalesBucket[]> {
  const { shopId, from, to, interval = 'day' } = params;

  // fetch sales transactions for shop within range
  const transactions = await prisma.stockTransaction.findMany({
    where: {
      shopId,
      transactionType: TransactionType.sale,
      occurredAt: {
        gte: from ?? undefined,
        lte: to ?? undefined
      }
    },
    select: {
      occurredAt: true,
      quantity: true
    },
    orderBy: { occurredAt: 'asc' }
  });

  if (transactions.length === 0) return [];

  const first = transactions[0].occurredAt;
  const rangeStart = from ? startOf(from, interval) : startOf(first, interval);
  const rangeEnd = to ? new Date(to) : new Date(transactions[transactions.length - 1].occurredAt);

  // build buckets map
  const buckets = new Map<string, number>();
  for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addInterval(cursor, interval)) {
    buckets.set(cursor.toISOString(), 0);
  }

  for (const tx of transactions) {
    const bucketStart = startOf(tx.occurredAt, interval).toISOString();
    const prev = buckets.get(bucketStart) ?? 0;
    // quantities are Decimal; ensure Number
    const qty = tx.quantity instanceof Prisma.Decimal ? Number(tx.quantity) : (tx.quantity as unknown as number);
    buckets.set(bucketStart, prev + qty);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodStart, totalQuantity]) => ({ periodStart, totalQuantity }));
}
