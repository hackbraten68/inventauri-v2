import { subDays } from 'date-fns';
import { prisma } from '../prisma';
import type { TransactionType } from '@prisma/client';
import type { SalesDeltaResult, InboundCoverageResult, SalesMetric, DaysOfCoverResult } from './dashboard-metrics';
import { calculateDaysOfCover, computeSalesDelta } from './dashboard-metrics';

const SALE_TYPE: TransactionType = 'sale';

export interface DashboardOptions {
  rangeDays?: number;
  shopId?: string;
}

export interface DashboardSnapshot {
  totals: {
    itemCount: number;
    totalOnHand: number;
    totalValue: number;
    salesQuantity: number;
    salesRevenue: number;
    salesDelta?: SalesDeltaResult;
  };
  warnings: Array<{
    itemId: string;
    itemName: string;
    sku: string;
    warehouseId: string;
    warehouseName: string;
    quantityOnHand: number;
    threshold: number;
    daysOfCover?: number | null;
    daysOfCoverStatus?: 'ok' | 'risk' | 'insufficient-data';
    inboundCoverage?: InboundCoverageResult | null;
    avgDailySales?: number | null;
  }>;
  mostSold: Array<{
    itemId: string;
    name: string;
    sku: string;
    quantity: number;
  }>;
  recentTransactions: Array<{
    id: string;
    itemId: string;
    itemName: string;
    sku: string;
    warehouseName: string;
    quantity: number;
    type: TransactionType;
    occurredAt: Date;
    reference?: string | null;
  }>;
}

function parsePrice(metadata: unknown): number {
  if (!metadata) return 0;
  if (typeof metadata === 'object' && metadata !== null && 'price' in metadata) {
    const value = (metadata as Record<string, unknown>).price;
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
  return 0;
}

export async function getDashboardSnapshot(options: DashboardOptions = {}): Promise<DashboardSnapshot> {
  const rangeDays = options.rangeDays ?? 7;
  const shopId = options.shopId;
  const since = subDays(new Date(), rangeDays);

  const [items, salesGroup, recentTransactions] = await Promise.all([
    prisma.item.findMany({
      where: { isActive: true, ...(shopId ? { shopId } : {}) },
      include: {
        stockLevels: {
          where: shopId ? { shopId } : undefined,
          include: {
            warehouse: true
          }
        }
      }
    }),
    prisma.stockTransaction.groupBy({
      by: ['itemId'],
      where: {
        transactionType: SALE_TYPE,
        ...(shopId ? { shopId } : {}),
        occurredAt: { gte: since }
      },
      _sum: { quantity: true }
    }),
    prisma.stockTransaction.findMany({
      where: {
        occurredAt: { gte: since },
        ...(shopId ? { shopId } : {})
      },
      orderBy: { occurredAt: 'desc' },
      take: 15,
      include: {
        item: true,
        sourceWarehouse: true,
        targetWarehouse: true
      }
    })
  ]);

  const saleMap = new Map<string, number>();
  salesGroup.forEach((entry) => {
    saleMap.set(entry.itemId, Number(entry._sum.quantity ?? 0));
  });

  let totalOnHand = 0;
  let totalValue = 0;
  const warningsBase: DashboardSnapshot['warnings'] = [];

  items.forEach((item) => {
    const price = parsePrice(item.metadata);
    const totalItemQuantity = item.stockLevels.reduce((sum, level) => sum + Number(level.quantityOnHand), 0);
    totalOnHand += totalItemQuantity;
    totalValue += totalItemQuantity * price;

    item.stockLevels.forEach((level) => {
      const quantity = Number(level.quantityOnHand);
      const threshold = level.warehouse.type === 'central'
        ? Number(level.reorderPoint ?? 0)
        : Number(level.safetyStock ?? 0);
      if (threshold > 0 && quantity <= threshold) {
        warningsBase.push({
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          warehouseId: level.warehouseId,
          warehouseName: level.warehouse.name,
          quantityOnHand: quantity,
          threshold
        });
      }
    });
  });

  const warnings = await Promise.all(
    warningsBase.map(async (warning) => {
      const cover: DaysOfCoverResult = await calculateDaysOfCover({
        shopId,
        itemId: warning.itemId,
        warehouseId: warning.warehouseId,
        onHandQuantity: warning.quantityOnHand,
        rangeDays
      });

      return {
        ...warning,
        daysOfCover: cover.daysOfCover,
        daysOfCoverStatus: cover.status,
        avgDailySales: cover.averageDaily
      };
    })
  );

  const mostSold = Array.from(saleMap.entries())
    .map(([itemId, quantity]) => {
      const item = items.find((entry) => entry.id === itemId);
      return item
        ? { itemId, name: item.name, sku: item.sku, quantity }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b!.quantity - a!.quantity))
    .slice(0, 5) as DashboardSnapshot['mostSold'];

  const totalSalesQuantity = Array.from(saleMap.values()).reduce((sum, quantity) => sum + quantity, 0);
  const totalSalesRevenue = Array.from(saleMap.entries()).reduce((sum, [itemId, quantity]) => {
    const item = items.find((it) => it.id === itemId);
    const price = item ? parsePrice(item.metadata) : 0;
    return sum + quantity * price;
  }, 0);

  const salesMetric: SalesMetric = totalSalesRevenue > 0 ? 'revenue' : 'units';
  const salesDelta = await computeSalesDelta({ shopId, rangeDays, metric: salesMetric });

  const recent = recentTransactions.map((transaction) => {
    const warehouse = transaction.targetWarehouse ?? transaction.sourceWarehouse;
    return {
      id: transaction.id,
      itemId: transaction.itemId,
      itemName: transaction.item.name,
      sku: transaction.item.sku,
      warehouseName: warehouse?.name ?? '—',
      quantity: Number(transaction.quantity),
      type: transaction.transactionType,
      occurredAt: transaction.occurredAt,
      reference: transaction.reference
    };
  });

  return {
    totals: {
      itemCount: items.length,
      totalOnHand,
      totalValue,
      salesQuantity: totalSalesQuantity,
      salesRevenue: totalSalesRevenue,
      salesDelta
    },
    warnings,
    mostSold,
    recentTransactions: recent
  };
}
