-- AlterTable
ALTER TABLE "public"."Item" ADD COLUMN     "shopId" UUID;

-- AlterTable
ALTER TABLE "public"."ItemStockLevel" ADD COLUMN     "shopId" UUID;

-- AlterTable
ALTER TABLE "public"."StockTransaction" ADD COLUMN     "shopId" UUID;

-- CreateTable
CREATE TABLE "public"."Shop" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserShop" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserShop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "public"."Shop"("slug");

-- CreateIndex
CREATE INDEX "UserShop_shopId_idx" ON "public"."UserShop"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "UserShop_userId_shopId_key" ON "public"."UserShop"("userId", "shopId");

-- CreateIndex
CREATE INDEX "Item_shopId_idx" ON "public"."Item"("shopId");

-- CreateIndex
CREATE INDEX "ItemStockLevel_shopId_idx" ON "public"."ItemStockLevel"("shopId");

-- CreateIndex
CREATE INDEX "StockTransaction_shopId_idx" ON "public"."StockTransaction"("shopId");

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemStockLevel" ADD CONSTRAINT "ItemStockLevel_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockTransaction" ADD CONSTRAINT "StockTransaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserShop" ADD CONSTRAINT "UserShop_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
