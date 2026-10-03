-- ═══════════════════════════════════════════════════════════════════════════
-- SERVICES + SCHOLARSHIPS + RESOURCES (spec §15) — scholarship filter fields
--
-- Additive only: adds scholarshipType (merit/need/...) + intake to Scholarship.
-- Guarded idempotent DDL (MySQL 8 has no native ADD COLUMN IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

SET @sch_scholarshipType := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Scholarship' AND COLUMN_NAME = 'scholarshipType') = 0,
    'ALTER TABLE Scholarship ADD COLUMN scholarshipType VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_sch_scholarshipType FROM @sch_scholarshipType; EXECUTE stmt_sch_scholarshipType; DEALLOCATE PREPARE stmt_sch_scholarshipType;

SET @sch_intake := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Scholarship' AND COLUMN_NAME = 'intake') = 0,
    'ALTER TABLE Scholarship ADD COLUMN intake VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_sch_intake FROM @sch_intake; EXECUTE stmt_sch_intake; DEALLOCATE PREPARE stmt_sch_intake;

SET @sch_idx_type := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Scholarship' AND INDEX_NAME = 'Scholarship_scholarshipType_idx') = 0,
    'CREATE INDEX Scholarship_scholarshipType_idx ON Scholarship (scholarshipType)', 'SELECT 1'));
PREPARE stmt_sch_idx_type FROM @sch_idx_type; EXECUTE stmt_sch_idx_type; DEALLOCATE PREPARE stmt_sch_idx_type;

-- ─────────────────────────────────────────────────────────────────────────
-- Re-declaration (CREATE TABLE IF NOT EXISTS): keeps the migration chain
-- self-describing vs schema.prisma (drift guard / migration-order sim).
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `scholarships` (
    `id` VARCHAR(191) NOT NULL DEFAULT '',
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipCode` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `university` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingAmount` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingAmountNumber` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingType` VARCHAR(191) NOT NULL DEFAULT '',
    `coverage` TEXT NOT NULL,
    `documentsRequired` TEXT NOT NULL,
    `eligibility` TEXT NOT NULL,
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `deadlineDate` DATETIME(3) NULL,
    `openingDate` DATETIME(3) NULL,
    `closingDate` DATETIME(3) NULL,
    `overview` TEXT NOT NULL,
    `whoCanApply` TEXT NOT NULL,
    `academicRequirements` TEXT NOT NULL,
    `englishRequirements` TEXT NOT NULL,
    `nationalityRequirements` TEXT NOT NULL,
    `courseEligibility` TEXT NOT NULL,
    `universityEligibility` TEXT NOT NULL,
    `whatCovers` TEXT NOT NULL,
    `whatNotCovers` TEXT NOT NULL,
    `minimumRequirements` TEXT NOT NULL,
    `requiredDocuments` TEXT NOT NULL,
    `howToApply` TEXT NOT NULL,
    `applicationSteps` TEXT NOT NULL,
    `selectionProcess` TEXT NOT NULL,
    `resultTimeline` VARCHAR(191) NOT NULL DEFAULT '',
    `renewalConditions` TEXT NOT NULL,
    `commonMistakes` TEXT NOT NULL,
    `howAloHelps` TEXT NOT NULL,
    `officialSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialSourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` TEXT NOT NULL,
    `canonicalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT '',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eligibleCourses` VARCHAR(191) NOT NULL DEFAULT '',
    `eligibleUniversities` VARCHAR(191) NOT NULL DEFAULT '',
    `countrySlug` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `studyLevel` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `scholarshipType` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationMethod` VARCHAR(191) NULL,
    `applicationUrl` TEXT NULL,
    `decisionDate` VARCHAR(191) NULL,
    `sourceUrl` TEXT NULL,
    `sourceName` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
