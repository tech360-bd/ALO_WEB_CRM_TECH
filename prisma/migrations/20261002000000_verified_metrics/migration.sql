-- Centralized verified marketing metrics (Part 13 of the master specification).
--
-- Creates the VerifiedMetric governance table plus the Country accentColor
-- brand-default update (ALO official palette #0B5ED7). This migration is
-- additive: it creates one new table and modifies one column default. It does
-- not delete, rewrite, or truncate any rows.

CREATE TABLE `VerifiedMetric` (
    `id` VARCHAR(191) NOT NULL,
    `metric` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `displayValue` VARCHAR(191) NOT NULL DEFAULT '',
    `source` VARCHAR(191) NOT NULL DEFAULT 'internal-database-aggregate',
    `verifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerifiedMetric_metric_key`(`metric`),
    INDEX `VerifiedMetric_status_idx`(`status`),
    INDEX `VerifiedMetric_metric_status_idx`(`metric`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Brand palette consolidation: ALO BLUE #0B5ED7 (official) replaces legacy
-- #0057B8 as the column default for new seeded countries.
ALTER TABLE `Country`
    MODIFY `accentColor` VARCHAR(191) NOT NULL DEFAULT '#0B5ED7';
