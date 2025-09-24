import { PrismaClient, TransactionType, WarehouseType } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_WAREHOUSE_SLUG = process.env.SEED_CENTRAL_SLUG ?? 'central-hq';
const DEFAULT_WAREHOUSE_NAME = process.env.SEED_CENTRAL_NAME ?? 'Hauptlager HQ';

const POS_PRESETS = [
  {
    name: 'POS Innenstadt',
    slug: 'pos-city',
    contactName: 'Anna Schmidt',
    contactEmail: 'city@inventauri.app'
  },
  {
    name: 'POS Bahnhof',
    slug: 'pos-station',
    contactName: 'Lars Weber',
    contactEmail: 'station@inventauri.app'
  }
];

const ITEM_PRESETS = [
  {
    sku: 'COFFEE-250',
    name: 'Kaffee Premium 250g',
    description: 'Arabica Röstung, ganze Bohne',
    unit: 'stk'
  },
  {
    sku: 'TEE-HERBAL',
    name: 'Kräutertee Auswahl',
    description: '12er Box Mischsorten',
    unit: 'stk'
  },
  {
    sku: 'MUG-CLASSIC',
    name: 'Inventauri Tasse',
    description: 'Keramik, 300ml',
    unit: 'stk'
  }
];

async function ensureCentralWarehouse() {
  const existing = await prisma.warehouse.findUnique({ where: { slug: DEFAULT_WAREHOUSE_SLUG } });

  if (existing) {
    return existing;
  }

  return prisma.warehouse.create({
    data: {
      name: DEFAULT_WAREHOUSE_NAME,
      slug: DEFAULT_WAREHOUSE_SLUG,
      type: WarehouseType.central
    }
  });
}

async function ensurePosWarehouses() {
  const results = [];

  for (const preset of POS_PRESETS) {
    let warehouse = await prisma.warehouse.findUnique({ where: { slug: preset.slug } });

    if (!warehouse) {
      warehouse = await prisma.warehouse.create({
        data: {
          name: preset.name,
          slug: preset.slug,
          type: WarehouseType.pos,
          posProfile: {
            create: {
              contactName: preset.contactName,
              contactEmail: preset.contactEmail
            }
          }
        }
      });
      console.info(`POS Lager '${preset.name}' angelegt.`);
    }

    results.push(warehouse);
  }

  return results;
}

async function seedItems() {
  const items = [];

  for (const preset of ITEM_PRESETS) {
    let item = await prisma.item.findUnique({ where: { sku: preset.sku } });

    if (!item) {
      item = await prisma.item.create({
        data: {
          sku: preset.sku,
          name: preset.name,
          description: preset.description,
          unit: preset.unit
        }
      });
      console.info(`Artikel '${item.name}' angelegt.`);
    }

    items.push(item);
  }

  return items;
}

async function seedStock(
  centralWarehouseId: string,
  posWarehouses: { id: string }[],
  items: { id: string; sku: string }[]
) {
  for (const item of items) {
    // Initialbestand im Zentrallager
    await prisma.itemStockLevel.upsert({
      where: {
        warehouseId_itemId: {
          warehouseId: centralWarehouseId,
          itemId: item.id
        }
      },
      update: {
        quantityOnHand: { increment: 100 }
      },
      create: {
        warehouseId: centralWarehouseId,
        itemId: item.id,
        quantityOnHand: 100,
        reorderPoint: 20
      }
    });

    await prisma.stockTransaction.create({
      data: {
        itemId: item.id,
        transactionType: TransactionType.inbound,
        quantity: 100,
        reference: 'SEED-INBOUND',
        notes: 'Initialer Seed-Bestand Zentrallager'
      }
    });

    for (const pos of posWarehouses) {
      await prisma.itemStockLevel.upsert({
        where: {
          warehouseId_itemId: {
            warehouseId: pos.id,
            itemId: item.id
          }
        },
        update: {
          quantityOnHand: { increment: 15 }
        },
        create: {
          warehouseId: pos.id,
          itemId: item.id,
          quantityOnHand: 15,
          reorderPoint: 5
        }
      });

      await prisma.stockTransaction.create({
        data: {
          itemId: item.id,
          transactionType: TransactionType.transfer,
          quantity: 15,
          sourceWarehouseId: centralWarehouseId,
          targetWarehouseId: pos.id,
          reference: 'SEED-TRANSFER',
          notes: 'Initiale POS-Bestückung'
        }
      });
    }
  }
}

async function main() {
  console.info('Seed gestartet…');

  const centralWarehouse = await ensureCentralWarehouse();
  if (!centralWarehouse) {
    throw new Error('Konnte Zentrallager nicht anlegen.');
  }

  const posWarehouses = await ensurePosWarehouses();
  const items = await seedItems();

  await seedStock(centralWarehouse.id, posWarehouses, items);

  console.info('Seed abgeschlossen.');
}

main()
  .catch((error) => {
    console.error('Seed fehlgeschlagen:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
