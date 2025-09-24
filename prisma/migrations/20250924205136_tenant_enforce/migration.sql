/*
  Warnings:

  - A unique constraint covering the columns `[shopId,sku]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Made the column `shopId` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shopId` on table `ItemStockLevel` required. This step will fail if there are existing NULL values in that column.
  - Made the column `shopId` on table `StockTransaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemStockLevel" DROP CONSTRAINT "ItemStockLevel_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockTransaction" DROP CONSTRAINT "StockTransaction_shopId_fkey";

-- DropIndex
DROP INDEX "public"."Item_sku_key";

-- Backfill tenant for existing rows prior to NOT NULL enforcement
DO $$
DECLARE
  v_shop_id uuid;
  v_cnt int;
BEGIN
  -- Prefer the demo shop if present, otherwise pick the oldest shop
  SELECT id INTO v_shop_id FROM "public"."Shop" WHERE slug = 'demo-shop' LIMIT 1;
  IF v_shop_id IS NULL THEN
    SELECT id INTO v_shop_id FROM "public"."Shop" ORDER BY "createdAt" ASC LIMIT 1;
  END IF;

  -- If still none, create a default demo shop (for shadow DB or empty DB cases)
  IF v_shop_id IS NULL THEN
    INSERT INTO "public"."Shop" (id, name, slug, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'Demo Shop', 'demo-shop', now(), now());
    SELECT id INTO v_shop_id FROM "public"."Shop" WHERE slug = 'demo-shop' LIMIT 1;
  END IF;

  UPDATE "public"."Item" SET "shopId" = v_shop_id WHERE "shopId" IS NULL;
  UPDATE "public"."ItemStockLevel" SET "shopId" = v_shop_id WHERE "shopId" IS NULL;
  UPDATE "public"."StockTransaction" SET "shopId" = v_shop_id WHERE "shopId" IS NULL;
END $$;

-- AlterTable
ALTER TABLE "public"."Item" ALTER COLUMN "shopId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."ItemStockLevel" ALTER COLUMN "shopId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."StockTransaction" ALTER COLUMN "shopId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Item_shopId_sku_key" ON "public"."Item"("shopId", "sku");

-- AddForeignKey
ALTER TABLE "public"."Item" ADD CONSTRAINT "Item_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ItemStockLevel" ADD CONSTRAINT "ItemStockLevel_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockTransaction" ADD CONSTRAINT "StockTransaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
