-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."WarehouseType" AS ENUM ('central', 'pos', 'virtual');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('inbound', 'transfer', 'sale', 'adjustment', 'writeoff', 'return');

-- CreateTable
CREATE TABLE "public"."Warehouse" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "public"."WarehouseType" NOT NULL DEFAULT 'pos',
    "address" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PosLocation" (
    "id" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PosLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Item" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'pcs',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ItemStockLevel" (
    "warehouseId" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "quantityOnHand" DECIMAL(16,3) NOT NULL DEFAULT 0,
    "quantityReserved" DECIMAL(16,3) NOT NULL DEFAULT 0,
    "reorderPoint" DECIMAL(16,3),
    "safetyStock" DECIMAL(16,3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemStockLevel_pkey" PRIMARY KEY ("warehouseId","itemId")
);

-- CreateTable
CREATE TABLE "public"."StockTransaction" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "sourceWarehouseId" UUID,
    "targetWarehouseId" UUID,
    "transactionType" "public"."TransactionType" NOT NULL,
    "quantity" DECIMAL(16,3) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_slug_key" ON "public"."Warehouse"("slug");

-- CreateIndex
CREATE INDEX "Warehouse_type_idx" ON "public"."Warehouse"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PosLocation_warehouseId_key" ON "public"."PosLocation"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Item_barcode_key" ON "public"."Item"("barcode");

-- CreateIndex
CREATE INDEX "ItemStockLevel_itemId_idx" ON "public"."ItemStockLevel"("itemId");

-- CreateIndex
CREATE INDEX "ItemStockLevel_warehouseId_idx" ON "public"."ItemStockLevel"("warehouseId");

-- CreateIndex
CREATE INDEX "StockTransaction_itemId_idx" ON "public"."StockTransaction"("itemId");

-- CreateIndex
CREATE INDEX "StockTransaction_sourceWarehouseId_idx" ON "public"."StockTransaction"("sourceWarehouseId");

-- CreateIndex
CREATE INDEX "StockTransaction_targetWarehouseId_idx" ON "public"."StockTransaction"("targetWarehouseId");

-- CreateIndex
CREATE INDEX "StockTransaction_transactionType_idx" ON "public"."StockTransaction"("transactionType");

-- CreateIndex
CREATE INDEX "StockTransaction_occurredAt_idx" ON "public"."StockTransaction"("occurredAt");

-- AddForeignKey
ALTER TABLE "public"."PosLocation" ADD CONSTRAINT "PosLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemStockLevel" ADD CONSTRAINT "ItemStockLevel_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemStockLevel" ADD CONSTRAINT "ItemStockLevel_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockTransaction" ADD CONSTRAINT "StockTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockTransaction" ADD CONSTRAINT "StockTransaction_sourceWarehouseId_fkey" FOREIGN KEY ("sourceWarehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockTransaction" ADD CONSTRAINT "StockTransaction_targetWarehouseId_fkey" FOREIGN KEY ("targetWarehouseId") REFERENCES "public"."Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Optional: Activate Row Level Security when Policies are ready
-- ALTER TABLE "public"."Warehouse" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."PosLocation" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."Item" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."ItemStockLevel" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "public"."StockTransaction" ENABLE ROW LEVEL SECURITY;
