import type { WarehouseType } from '@prisma/client';
import { prisma } from '../prisma';

type DecimalLike = { toNumber: () => number } | number;

function toNumber(value: DecimalLike | null | undefined) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export interface InventoryWarehouseBreakdown {
  warehouseId: string;
  warehouseSlug: string;
  warehouseName: string;
  warehouseType: WarehouseType;
  quantityOnHand: number;
  quantityReserved: number;
}

export interface InventoryItemSummary {
  itemId: string;
  sku: string;
  name: string;
  description?: string | null;
  unit: string;
  totalOnHand: number;
  totalReserved: number;
  breakdown: InventoryWarehouseBreakdown[];
}

export interface InventorySnapshot {
  items: InventoryItemSummary[];
  totals: {
    onHand: number;
    reserved: number;
  };
  warehouseTotals: InventoryWarehouseBreakdown[];
}

export async function getInventorySnapshot(): Promise<InventorySnapshot> {
  const items = await prisma.item.findMany({
    where: { isActive: true },
    include: {
      stockLevels: {
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  const warehouseTotalsMap = new Map<string, InventoryWarehouseBreakdown>();
  let globalOnHand = 0;
  let globalReserved = 0;

  const itemSummaries: InventoryItemSummary[] = items.map((item) => {
    let itemOnHand = 0;
    let itemReserved = 0;
    const breakdown: InventoryWarehouseBreakdown[] = item.stockLevels.map((level) => {
      const onHand = toNumber(level.quantityOnHand);
      const reserved = toNumber(level.quantityReserved);

      itemOnHand += onHand;
      itemReserved += reserved;

      const warehouseKey = level.warehouse.id;
      const aggregate = warehouseTotalsMap.get(warehouseKey) ?? {
        warehouseId: level.warehouse.id,
        warehouseSlug: level.warehouse.slug,
        warehouseName: level.warehouse.name,
        warehouseType: level.warehouse.type,
        quantityOnHand: 0,
        quantityReserved: 0
      };

      aggregate.quantityOnHand += onHand;
      aggregate.quantityReserved += reserved;
      warehouseTotalsMap.set(warehouseKey, aggregate);

      return {
        warehouseId: level.warehouse.id,
        warehouseSlug: level.warehouse.slug,
        warehouseName: level.warehouse.name,
        warehouseType: level.warehouse.type,
        quantityOnHand: onHand,
        quantityReserved: reserved
      } satisfies InventoryWarehouseBreakdown;
    });

    globalOnHand += itemOnHand;
    globalReserved += itemReserved;

    return {
      itemId: item.id,
      sku: item.sku,
      name: item.name,
      description: item.description,
      unit: item.unit,
      totalOnHand: itemOnHand,
      totalReserved: itemReserved,
      breakdown
    } satisfies InventoryItemSummary;
  });

  return {
    items: itemSummaries,
    totals: {
      onHand: globalOnHand,
      reserved: globalReserved
    },
    warehouseTotals: Array.from(warehouseTotalsMap.values()).sort((a, b) => a.warehouseName.localeCompare(b.warehouseName))
  } satisfies InventorySnapshot;
}
