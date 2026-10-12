-- Real double-entry accounting ledger (2026-10-01).
-- Generated from prisma/schema.prisma via:
--   prisma migrate diff --from-schema-datamodel <previous> --to-schema-datamodel prisma/schema.prisma --script
-- Replaces the legacy journal adapter that stored journals as JSON in CrmAuditLog.
-- All monetary amounts are INTEGER CENTS. Additive only: creates 4 new tables,
-- no existing table is altered, no data is rewritten.
-- CreateTable
CREATE TABLE `ChartOfAccount` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `subType` VARCHAR(191) NULL,
    `parentCode` VARCHAR(191) NULL,
    `isPostable` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ChartOfAccount_code_key`(`code`),
    INDEX `ChartOfAccount_type_idx`(`type`),
    INDEX `ChartOfAccount_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FiscalPeriod` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `closedById` VARCHAR(191) NULL,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FiscalPeriod_name_key`(`name`),
    INDEX `FiscalPeriod_status_idx`(`status`),
    INDEX `FiscalPeriod_startDate_endDate_idx`(`startDate`, `endDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` VARCHAR(191) NOT NULL,
    `entryDate` DATETIME(3) NOT NULL,
    `memo` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'manual',
    `sourceRefId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'POSTED',
    `reversalOfId` VARCHAR(191) NULL,
    `reversedById` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `totalDebit` INTEGER NOT NULL,
    `totalCredit` INTEGER NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `postedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JournalEntry_entryDate_idx`(`entryDate`),
    INDEX `JournalEntry_status_idx`(`status`),
    INDEX `JournalEntry_source_idx`(`source`),
    INDEX `JournalEntry_reversalOfId_idx`(`reversalOfId`),
    UNIQUE INDEX `JournalEntry_source_sourceRefId_key`(`source`, `sourceRefId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalLine` (
    `id` VARCHAR(191) NOT NULL,
    `entryId` VARCHAR(191) NOT NULL,
    `accountCode` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `debit` INTEGER NOT NULL DEFAULT 0,
    `credit` INTEGER NOT NULL DEFAULT 0,
    `entityId` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NULL,

    INDEX `JournalLine_accountCode_idx`(`accountCode`),
    INDEX `JournalLine_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `JournalLine` ADD CONSTRAINT `JournalLine_entryId_fkey` FOREIGN KEY (`entryId`) REFERENCES `JournalEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalLine` ADD CONSTRAINT `JournalLine_accountCode_fkey` FOREIGN KEY (`accountCode`) REFERENCES `ChartOfAccount`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

