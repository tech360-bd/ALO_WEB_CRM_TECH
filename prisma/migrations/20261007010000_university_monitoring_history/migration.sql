-- ═══════════════════════════════════════════════════════════════════════════
-- UNIVERSITY & COURSE DATA MONITORING — historical versioning tables
--
-- Adds the append-only history tables required by the monitoring spec
-- ("For every important field: Never destroy the old value").
--
-- DataChange already records every DETECTED change (including rejected ones).
-- These three tables record the subset that a Super Admin APPROVED and that
-- therefore actually mutated production data, together with the official
-- evidence URL, the detection timestamp, the approver and the approval id —
-- so a tuition/deadline/requirement timeline stays searchable forever.
--
-- Additive only. No existing table or column is altered or dropped.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `UniversityHistory` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `changeId` VARCHAR(191) NOT NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `detectedAt` DATETIME(3) NOT NULL,
    `approvedBy` VARCHAR(191) NOT NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UniversityHistory_universitySlug_idx`(`universitySlug`),
    INDEX `UniversityHistory_fieldName_idx`(`fieldName`),
    INDEX `UniversityHistory_changeId_idx`(`changeId`),
    INDEX `UniversityHistory_approvedAt_idx`(`approvedAt`),
    INDEX `UniversityHistory_universitySlug_fieldName_idx`(`universitySlug`, `fieldName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CourseHistory` (
    `id` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `changeId` VARCHAR(191) NOT NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `detectedAt` DATETIME(3) NOT NULL,
    `approvedBy` VARCHAR(191) NOT NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CourseHistory_courseSlug_idx`(`courseSlug`),
    INDEX `CourseHistory_universitySlug_idx`(`universitySlug`),
    INDEX `CourseHistory_fieldName_idx`(`fieldName`),
    INDEX `CourseHistory_changeId_idx`(`changeId`),
    INDEX `CourseHistory_approvedAt_idx`(`approvedAt`),
    INDEX `CourseHistory_courseSlug_fieldName_idx`(`courseSlug`, `fieldName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ScholarshipHistory` (
    `id` VARCHAR(191) NOT NULL,
    `scholarshipSlug` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` TEXT NULL,
    `newValue` TEXT NULL,
    `changeId` VARCHAR(191) NOT NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `detectedAt` DATETIME(3) NOT NULL,
    `approvedBy` VARCHAR(191) NOT NULL,
    `approvedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ScholarshipHistory_scholarshipSlug_idx`(`scholarshipSlug`),
    INDEX `ScholarshipHistory_universitySlug_idx`(`universitySlug`),
    INDEX `ScholarshipHistory_fieldName_idx`(`fieldName`),
    INDEX `ScholarshipHistory_changeId_idx`(`changeId`),
    INDEX `ScholarshipHistory_approvedAt_idx`(`approvedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
