-- Generated via prisma migrate diff --from-schema-datamodel /tmp/old_schema.prisma --to-schema-datamodel prisma/schema.prisma --script
-- Adds admin settings domain tables and supporting enums

CREATE TYPE "public"."UnitSystem" AS ENUM ('metric', 'imperial');

CREATE TYPE "public"."NotificationChannel" AS ENUM ('email');

CREATE TYPE "public"."NotificationCategory" AS ENUM ('low_stock', 'failed_sync', 'role_invite', 'audit_alert');

CREATE TYPE "public"."StaffInvitationStatus" AS ENUM ('pending', 'accepted', 'revoked', 'expired');

CREATE TYPE "public"."SettingsSection" AS ENUM ('business_profile', 'operational', 'notifications', 'staff');

CREATE TYPE "public"."SettingsChangeType" AS ENUM ('create', 'update', 'delete', 'deactivate');

CREATE TYPE "public"."UserMembershipStatus" AS ENUM ('active', 'deactivated');

ALTER TABLE "public"."UserShop" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedBy" UUID,
ADD COLUMN     "status" "public"."UserMembershipStatus" NOT NULL DEFAULT 'active';

CREATE TABLE "public"."BusinessProfile" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "updatedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BusinessProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."OperationalPreference" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "unitSystem" "public"."UnitSystem" NOT NULL DEFAULT 'metric',
    "defaultUnitPrecision" INTEGER NOT NULL DEFAULT 2,
    "fiscalWeekStart" INTEGER NOT NULL,
    "autoApplyTaxes" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "OperationalPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."NotificationPreference" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "category" "public"."NotificationCategory" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'email',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "throttleMinutes" INTEGER,
    "updatedBy" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."NotificationRecipient" (
    "id" UUID NOT NULL,
    "preferenceId" UUID NOT NULL,
    "userShopId" UUID,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."StaffInvitation" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" "public"."StaffInvitationStatus" NOT NULL DEFAULT 'pending',
    "supabaseInvitationId" TEXT NOT NULL,
    "invitedBy" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."SettingsAuditLog" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "section" "public"."SettingsSection" NOT NULL,
    "changeType" "public"."SettingsChangeType" NOT NULL,
    "actorId" UUID NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettingsAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessProfile_shopId_key" ON "public"."BusinessProfile"("shopId");

CREATE UNIQUE INDEX "OperationalPreference_shopId_key" ON "public"."OperationalPreference"("shopId");

CREATE INDEX "NotificationPreference_shopId_idx" ON "public"."NotificationPreference"("shopId");

CREATE INDEX "NotificationPreference_category_idx" ON "public"."NotificationPreference"("category");

CREATE UNIQUE INDEX "NotificationPreference_shopId_category_channel_key" ON "public"."NotificationPreference"("shopId", "category", "channel");

CREATE INDEX "NotificationRecipient_preferenceId_idx" ON "public"."NotificationRecipient"("preferenceId");

CREATE INDEX "NotificationRecipient_userShopId_idx" ON "public"."NotificationRecipient"("userShopId");

CREATE UNIQUE INDEX "NotificationRecipient_preferenceId_userShopId_key" ON "public"."NotificationRecipient"("preferenceId", "userShopId");

CREATE UNIQUE INDEX "NotificationRecipient_preferenceId_email_key" ON "public"."NotificationRecipient"("preferenceId", "email");

CREATE INDEX "StaffInvitation_shopId_idx" ON "public"."StaffInvitation"("shopId");

CREATE INDEX "StaffInvitation_status_idx" ON "public"."StaffInvitation"("status");

CREATE UNIQUE INDEX "StaffInvitation_shopId_email_status_key" ON "public"."StaffInvitation"("shopId", "email", "status");

CREATE INDEX "SettingsAuditLog_shopId_section_idx" ON "public"."SettingsAuditLog"("shopId", "section");

CREATE INDEX "SettingsAuditLog_createdAt_idx" ON "public"."SettingsAuditLog"("createdAt");

CREATE INDEX "UserShop_status_idx" ON "public"."UserShop"("status");

ALTER TABLE "public"."BusinessProfile" ADD CONSTRAINT "BusinessProfile_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."OperationalPreference" ADD CONSTRAINT "OperationalPreference_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_preferenceId_fkey" FOREIGN KEY ("preferenceId") REFERENCES "public"."NotificationPreference"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."NotificationRecipient" ADD CONSTRAINT "NotificationRecipient_userShopId_fkey" FOREIGN KEY ("userShopId") REFERENCES "public"."UserShop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."StaffInvitation" ADD CONSTRAINT "StaffInvitation_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."SettingsAuditLog" ADD CONSTRAINT "SettingsAuditLog_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
