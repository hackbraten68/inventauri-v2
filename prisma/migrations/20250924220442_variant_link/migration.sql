-- AlterTable
ALTER TABLE "public"."ItemStockLevel" ADD COLUMN     "variantId" UUID;

-- AlterTable
ALTER TABLE "public"."StockTransaction" ADD COLUMN     "variantId" UUID;

-- CreateIndex
CREATE INDEX "ItemStockLevel_variantId_idx" ON "public"."ItemStockLevel"("variantId");

-- CreateIndex
CREATE INDEX "StockTransaction_variantId_idx" ON "public"."StockTransaction"("variantId");

-- Backfill: ensure Product & ProductVariant exist per Item (shopId, sku), then set variantId links
DO $$
DECLARE
  rec RECORD;
  v_product_id uuid;
  v_variant_id uuid;
BEGIN
  FOR rec IN SELECT id, "shopId", sku, name, unit, barcode FROM "public"."Item" LOOP
    -- find or create product by (shopId, name)
    SELECT id INTO v_product_id FROM "public"."Product" WHERE "shopId" = rec."shopId" AND name = rec.name LIMIT 1;
    IF v_product_id IS NULL THEN
      INSERT INTO "public"."Product" (id, "shopId", name, description, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), rec."shopId", rec.name, rec.name, true, now(), now())
      RETURNING id INTO v_product_id;
    END IF;

    -- find or create variant by (shopId, sku)
    SELECT id INTO v_variant_id FROM "public"."ProductVariant" WHERE "shopId" = rec."shopId" AND sku = rec.sku LIMIT 1;
    IF v_variant_id IS NULL THEN
      INSERT INTO "public"."ProductVariant" (id, "productId", "shopId", sku, unit, barcode, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), v_product_id, rec."shopId", rec.sku, COALESCE(rec.unit, 'pcs'), rec.barcode, true, now(), now())
      RETURNING id INTO v_variant_id;
    END IF;
  END LOOP;

  -- link stock levels
  UPDATE "public"."ItemStockLevel" isl
  SET "variantId" = pv.id
  FROM "public"."Item" i
  JOIN "public"."ProductVariant" pv ON pv."shopId" = i."shopId" AND pv.sku = i.sku
  WHERE isl."itemId" = i.id AND isl."variantId" IS NULL;

  -- link stock transactions
  UPDATE "public"."StockTransaction" st
  SET "variantId" = pv.id
  FROM "public"."Item" i
  JOIN "public"."ProductVariant" pv ON pv."shopId" = i."shopId" AND pv.sku = i.sku
  WHERE st."itemId" = i.id AND st."variantId" IS NULL;
END $$;

-- AddForeignKey
ALTER TABLE "public"."ItemStockLevel" ADD CONSTRAINT "ItemStockLevel_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockTransaction" ADD CONSTRAINT "StockTransaction_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
