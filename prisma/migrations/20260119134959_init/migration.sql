/*
  Warnings:

  - You are about to drop the column `shopId` on the `BusinessProfile` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `ItemStockLevel` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `NotificationPreference` table. All the data in the column will be lost.
  - You are about to drop the column `userShopId` on the `NotificationRecipient` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `OperationalPreference` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `SettingsAuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `StaffInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `StockTransaction` table. All the data in the column will be lost.
  - You are about to drop the `Shop` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserShop` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sku]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[category,channel]` on the table `NotificationPreference` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,status]` on the table `StaffInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."BusinessProfile" DROP CONSTRAINT "BusinessProfile_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Item" DROP CONSTRAINT "Item_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ItemStockLevel" DROP CONSTRAINT "ItemStockLevel_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationPreference" DROP CONSTRAINT "NotificationPreference_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."NotificationRecipient" DROP CONSTRAINT "NotificationRecipient_userShopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."OperationalPreference" DROP CONSTRAINT "OperationalPreference_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Product" DROP CONSTRAINT "Product_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."SettingsAuditLog" DROP CONSTRAINT "SettingsAuditLog_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StaffInvitation" DROP CONSTRAINT "StaffInvitation_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockTransaction" DROP CONSTRAINT "StockTransaction_shopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserShop" DROP CONSTRAINT "UserShop_shopId_fkey";

-- DropIndex
DROP INDEX "public"."BusinessProfile_shopId_key";

-- DropIndex
DROP INDEX "public"."Item_barcode_key";

-- DropIndex
DROP INDEX "public"."Item_shopId_idx";

-- DropIndex
DROP INDEX "public"."Item_shopId_sku_key";

-- DropIndex
DROP INDEX "public"."ItemStockLevel_shopId_idx";

-- DropIndex
DROP INDEX "public"."NotificationPreference_shopId_category_channel_key";

-- DropIndex
DROP INDEX "public"."NotificationPreference_shopId_idx";

-- DropIndex
DROP INDEX "public"."NotificationRecipient_preferenceId_userShopId_key";

-- DropIndex
DROP INDEX "public"."NotificationRecipient_userShopId_idx";

-- DropIndex
DROP INDEX "public"."OperationalPreference_shopId_key";

-- DropIndex
DROP INDEX "public"."Product_shopId_idx";

-- DropIndex
DROP INDEX "public"."ProductVariant_shopId_idx";

-- DropIndex
DROP INDEX "public"."ProductVariant_shopId_sku_key";

-- DropIndex
DROP INDEX "public"."SettingsAuditLog_shopId_section_idx";

-- DropIndex
DROP INDEX "public"."StaffInvitation_shopId_email_status_key";

-- DropIndex
DROP INDEX "public"."StaffInvitation_shopId_idx";

-- DropIndex
DROP INDEX "public"."StockTransaction_shopId_idx";

-- AlterTable
ALTER TABLE "public"."BusinessProfile" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."ItemStockLevel" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."NotificationPreference" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."NotificationRecipient" DROP COLUMN "userShopId";

-- AlterTable
ALTER TABLE "public"."OperationalPreference" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."Product" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."ProductVariant" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."SettingsAuditLog" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."StaffInvitation" DROP COLUMN "shopId";

-- AlterTable
ALTER TABLE "public"."StockTransaction" DROP COLUMN "shopId";

-- DropTable
DROP TABLE "public"."Shop";

-- DropTable
DROP TABLE "public"."UserShop";

-- DropEnum
DROP TYPE "public"."UserMembershipStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Item_sku_key" ON "public"."Item"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_category_channel_key" ON "public"."NotificationPreference"("category", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "SettingsAuditLog_section_idx" ON "public"."SettingsAuditLog"("section");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvitation_email_status_key" ON "public"."StaffInvitation"("email", "status");
