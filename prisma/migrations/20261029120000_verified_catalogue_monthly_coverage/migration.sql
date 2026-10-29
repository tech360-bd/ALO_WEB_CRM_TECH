-- ALO Education — verified university catalogue + 13-month course coverage (Jan 2027 – Jan 2028)
-- ADDITIVE ONLY: creates five new tables (four domain tables + an append-only revision log).
-- No existing table, column, index or row is modified or dropped.
-- Generated with: npx prisma migrate diff --from-schema-datamodel <main> --to-schema-datamodel prisma/schema.prisma --script

-- CreateTable
CREATE TABLE `CrmOfficialEvidence` (
    `id` VARCHAR(191) NOT NULL,
    `evidenceKey` VARCHAR(191) NOT NULL,
    `sourceUrl` TEXT NOT NULL,
    `finalUrl` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'OFFICIAL_UNIVERSITY',
    `publisherName` VARCHAR(191) NOT NULL DEFAULT '',
    `pageTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `retrievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `publishedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `httpStatus` INTEGER NOT NULL DEFAULT 200,
    `contentHash` VARCHAR(191) NOT NULL DEFAULT '',
    `excerpt` TEXT NOT NULL,
    `entityType` VARCHAR(191) NOT NULL DEFAULT 'COURSE',
    `universitySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `courseSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `fieldScope` VARCHAR(191) NOT NULL DEFAULT '[]',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING_REVIEW',
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 1,
    `supersedesId` VARCHAR(191) NULL,
    `collectedBy` VARCHAR(191) NOT NULL DEFAULT 'alo-research-agent',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmOfficialEvidence_evidenceKey_key`(`evidenceKey`),
    INDEX `CrmOfficialEvidence_universitySlug_idx`(`universitySlug`),
    INDEX `CrmOfficialEvidence_courseSlug_idx`(`courseSlug`),
    INDEX `CrmOfficialEvidence_verificationStatus_idx`(`verificationStatus`),
    INDEX `CrmOfficialEvidence_sourceType_idx`(`sourceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCourseMonthlyCoverage` (
    `id` VARCHAR(191) NOT NULL,
    `coverageKey` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `monthLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_PUBLISHED',
    `intakeName` VARCHAR(191) NOT NULL DEFAULT '',
    `startDate` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationOpens` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationCloses` VARCHAR(191) NOT NULL DEFAULT '',
    `internationalDeadline` VARCHAR(191) NOT NULL DEFAULT '',
    `feeAmount` DOUBLE NOT NULL DEFAULT 0,
    `feeCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `academicYear` VARCHAR(191) NOT NULL DEFAULT '',
    `feePeriod` VARCHAR(191) NOT NULL DEFAULT '',
    `studentCategory` VARCHAR(191) NOT NULL DEFAULT 'INTERNATIONAL',
    `applicationFee` DOUBLE NOT NULL DEFAULT 0,
    `applicationFeeCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `depositAmount` DOUBLE NOT NULL DEFAULT 0,
    `depositCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipNote` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `academicRequirement` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `bangladeshRequirement` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `englishRequirements` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `workExperienceRequirement` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `portfolioRequirement` VARCHAR(191) NOT NULL DEFAULT '',
    `interviewRequirement` VARCHAR(191) NOT NULL DEFAULT '',
    `documentRequirements` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `internationalEligibility` VARCHAR(191) NOT NULL DEFAULT 'not_verified',
    `studyMode` VARCHAR(191) NOT NULL DEFAULT '',
    `campus` VARCHAR(191) NOT NULL DEFAULT '',
    `qualification` VARCHAR(191) NOT NULL DEFAULT '',
    `courseSourceUrl` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `feeSourceUrl` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `intakeSourceUrl` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `requirementSourceUrl` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `sourcePublishedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `collectedAt` DATETIME(3) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `published` BOOLEAN NOT NULL DEFAULT false,
    `evidenceId` VARCHAR(191) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `conflictNote` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `notes` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmCourseMonthlyCoverage_coverageKey_key`(`coverageKey`),
    INDEX `CrmCourseMonthlyCoverage_year_month_idx`(`year`, `month`),
    INDEX `CrmCourseMonthlyCoverage_status_idx`(`status`),
    INDEX `CrmCourseMonthlyCoverage_published_idx`(`published`),
    INDEX `CrmCourseMonthlyCoverage_approvalStatus_idx`(`approvalStatus`),
    INDEX `CrmCourseMonthlyCoverage_universityId_idx`(`universityId`),
    UNIQUE INDEX `CrmCourseMonthlyCoverage_courseId_year_month_key`(`courseId`, `year`, `month`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCatalogueTraversal` (
    `id` VARCHAR(191) NOT NULL,
    `traversalKey` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `universitySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `countrySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `catalogueUrl` TEXT NOT NULL,
    `catalogueType` VARCHAR(191) NOT NULL DEFAULT 'PROGRAMME_LIST',
    `facultyOrDepartment` VARCHAR(191) NOT NULL DEFAULT '',
    `httpStatus` INTEGER NOT NULL DEFAULT 0,
    `pageTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `programmeLinksObserved` INTEGER NOT NULL DEFAULT 0,
    `coursesDiscovered` INTEGER NOT NULL DEFAULT 0,
    `coursesVerified` INTEGER NOT NULL DEFAULT 0,
    `paginationComplete` BOOLEAN NOT NULL DEFAULT false,
    `nextPageUrl` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `completeness` VARCHAR(191) NOT NULL DEFAULT 'PARTIAL',
    `notes` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `lastTraversedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmCatalogueTraversal_traversalKey_key`(`traversalKey`),
    INDEX `CrmCatalogueTraversal_universitySlug_idx`(`universitySlug`),
    INDEX `CrmCatalogueTraversal_countrySlug_idx`(`countrySlug`),
    INDEX `CrmCatalogueTraversal_completeness_idx`(`completeness`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmResearchQueueItem` (
    `id` VARCHAR(191) NOT NULL,
    `queueKey` VARCHAR(191) NOT NULL,
    `countrySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `universitySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `officialWebsite` VARCHAR(191) NOT NULL DEFAULT '',
    `catalogueUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `reason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `discoveredVia` VARCHAR(191) NOT NULL DEFAULT '',
    `nextAction` VARCHAR(191) NOT NULL DEFAULT '',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastAttemptAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmResearchQueueItem_queueKey_key`(`queueKey`),
    INDEX `CrmResearchQueueItem_countrySlug_idx`(`countrySlug`),
    INDEX `CrmResearchQueueItem_status_idx`(`status`),
    INDEX `CrmResearchQueueItem_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCoverageRevision` (
    `id` VARCHAR(191) NOT NULL,
    `coverageKey` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `revision` INTEGER NOT NULL DEFAULT 1,
    `changeType` VARCHAR(191) NOT NULL DEFAULT 'UPDATED',
    `status` VARCHAR(191) NOT NULL DEFAULT '',
    `previousValueJson` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `newValueJson` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `evidenceId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CrmCoverageRevision_coverageKey_idx`(`coverageKey`),
    INDEX `CrmCoverageRevision_courseId_year_month_idx`(`courseId`, `year`, `month`),
    INDEX `CrmCoverageRevision_changeType_idx`(`changeType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CrmCourseMonthlyCoverage` ADD CONSTRAINT `CrmCourseMonthlyCoverage_evidenceId_fkey` FOREIGN KEY (`evidenceId`) REFERENCES `CrmOfficialEvidence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourseMonthlyCoverage` ADD CONSTRAINT `CrmCourseMonthlyCoverage_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourseMonthlyCoverage` ADD CONSTRAINT `CrmCourseMonthlyCoverage_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

