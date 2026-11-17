-- ALO CRM: Cookie consent records + B2B prospect research queue.
-- Additive only: two NEW tables. No existing table is altered or dropped.
-- Approval required to apply in production (see docs/COOKIE_CONSENT_AND_PROSPECT_IMPORT_2026-11-16.md).

-- CreateTable
CREATE TABLE `website_consents` (
    `id` VARCHAR(191) NOT NULL,
    `visitorId` VARCHAR(64) NOT NULL,
    `necessary` BOOLEAN NOT NULL DEFAULT true,
    `analytics` BOOLEAN NOT NULL DEFAULT false,
    `marketing` BOOLEAN NOT NULL DEFAULT false,
    `functional` BOOLEAN NOT NULL DEFAULT false,
    `consentVersion` VARCHAR(32) NOT NULL DEFAULT '2.0',
    `policyVersion` VARCHAR(32) NOT NULL DEFAULT '2.0',
    `source` VARCHAR(32) NOT NULL DEFAULT 'cookie_banner',
    `withdrawnAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `website_consents_visitorId_createdAt_idx` ON `website_consents`(`visitorId`, `createdAt`);

-- CreateIndex
CREATE INDEX `website_consents_withdrawnAt_idx` ON `website_consents`(`withdrawnAt`);

-- CreateTable
CREATE TABLE `b2b_prospects` (
    `id` VARCHAR(191) NOT NULL,
    `organizationName` VARCHAR(191) NOT NULL DEFAULT '',
    `contactPerson` VARCHAR(191) NOT NULL DEFAULT '',
    `businessEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `businessPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `officialWebsite` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `organizationType` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'HUMAN_GOOGLE_SEARCH',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `researchDate` DATETIME(3) NULL,
    `researcherId` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED',
    `relationshipStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED',
    `outreachPermission` BOOLEAN NOT NULL DEFAULT false,
    `doNotContact` BOOLEAN NOT NULL DEFAULT false,
    `dedupeKey` VARCHAR(512) NOT NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `b2b_prospects_dedupeKey_key` ON `b2b_prospects`(`dedupeKey`);

-- CreateIndex
CREATE INDEX `b2b_prospects_relationshipStatus_idx` ON `b2b_prospects`(`relationshipStatus`);

-- CreateIndex
CREATE INDEX `b2b_prospects_organizationType_idx` ON `b2b_prospects`(`organizationType`);

-- CreateIndex
CREATE INDEX `b2b_prospects_verificationStatus_idx` ON `b2b_prospects`(`verificationStatus`);
