-- B2B partner footer branding (logo + colour scheme)
-- ---------------------------------------------------------------------------
-- Additive migration: creates ONE new table. No existing table is altered,
-- dropped or back-filled, so an install that never onboards a partner with
-- custom branding behaves exactly as before. PartnerBranding.partnerId matches
-- PartnerProfile.partnerId (the B2B tenant key) and is unique: one branding
-- record per partner company, not per partner user.
--
-- Rendered only in the partner footer block shown to students recruited by that
-- partner; ALO students and every ALO employee see the general ALO footer only.
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE `PartnerBranding` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL DEFAULT '',
    `tagline` VARCHAR(191) NOT NULL DEFAULT '',
    `logoUrl` TEXT NOT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#0066CC',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#F37021',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#FFB347',
    `websiteUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `supportEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `supportPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `showInFooter` BOOLEAN NOT NULL DEFAULT true,
    `updatedById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerBranding_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
