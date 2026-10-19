-- --------------------------------------------------------------------------
-- Regulatory rule versioning (spec s106) + policy change monitoring (s64).
--
-- Both tables are NEW. This migration is non-destructive: it alters no
-- existing table and drops nothing. The pre-existing Country* rule tables
-- (CountryEntryRequirement, CountryEnglishTest, CountryVisaStep,
-- CountryWorkRight) are left untouched so current behaviour is preserved;
-- RegulatoryRuleVersion layers versioned history on top of them.
--
-- TEXT/LONGBLOB defaults use Prisma's native expression form
-- `DEFAULT (_utf8mb4'...')` because MySQL 8 rejects a literal default on a
-- BLOB/TEXT/JSON column with ERROR 1101. Literal defaults are invisible on an
-- existing database (CREATE TABLE IF NOT EXISTS skips definition processing)
-- and only fail on a FRESH one, so they must never be written literally.
-- --------------------------------------------------------------------------

-- CreateTable
CREATE TABLE `RegulatoryRuleVersion` (
    `id` VARCHAR(191) NOT NULL,
    `ruleKey` VARCHAR(191) NOT NULL,
    `ruleType` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `versionNumber` INTEGER NOT NULL DEFAULT 1,
    `payload` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `summary` TEXT NOT NULL DEFAULT (_utf8mb4''),

    `effectiveFrom` DATETIME(3) NOT NULL,
    `effectiveUntil` DATETIME(3) NULL,

    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedAt` DATETIME(3) NULL,

    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `changeReason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `supersededById` VARCHAR(191) NULL,

    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `scope` VARCHAR(191) NOT NULL DEFAULT '',

    `policyChangeAlertId` VARCHAR(191) NOT NULL DEFAULT '',

    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RegulatoryRuleVersion_ruleKey_versionNumber_key`(`ruleKey`, `versionNumber`),
    INDEX `RegulatoryRuleVersion_ruleKey_status_idx`(`ruleKey`, `status`),
    INDEX `RegulatoryRuleVersion_ruleKey_effectiveFrom_effectiveUntil_idx`(`ruleKey`, `effectiveFrom`, `effectiveUntil`),
    INDEX `RegulatoryRuleVersion_status_idx`(`status`),
    INDEX `RegulatoryRuleVersion_verificationStatus_idx`(`verificationStatus`),
    INDEX `RegulatoryRuleVersion_countryId_idx`(`countryId`),
    INDEX `RegulatoryRuleVersion_policyChangeAlertId_idx`(`policyChangeAlertId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PolicyChangeAlert` (
    `id` VARCHAR(191) NOT NULL,
    `ruleKey` VARCHAR(191) NOT NULL DEFAULT '',
    `ruleType` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `severity` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'OFFICIAL_GOVERNMENT',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',

    `affectedWorkflows` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `affectedStudentIds` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `affectedApplicationIds` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `affectedCountryIds` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `impactCount` INTEGER NOT NULL DEFAULT 0,

    `status` VARCHAR(191) NOT NULL DEFAULT 'DETECTED',
    `proposedRuleVersionId` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewTaskId` VARCHAR(191) NOT NULL DEFAULT '',
    `requiresApproval` BOOLEAN NOT NULL DEFAULT true,
    `triagedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `triagedAt` DATETIME(3) NULL,
    `dismissedReason` VARCHAR(191) NOT NULL DEFAULT '',
    `resolvedAt` DATETIME(3) NULL,

    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PolicyChangeAlert_status_severity_idx`(`status`, `severity`),
    INDEX `PolicyChangeAlert_ruleKey_idx`(`ruleKey`),
    INDEX `PolicyChangeAlert_detectedAt_idx`(`detectedAt`),
    INDEX `PolicyChangeAlert_proposedRuleVersionId_idx`(`proposedRuleVersionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
