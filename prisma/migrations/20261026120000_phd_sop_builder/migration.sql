-- UK PhD Statement-of-Purpose builder — additive module migration
-- ---------------------------------------------------------------------------
-- Creates the four SOP tables and their foreign keys. No existing table is
-- altered or dropped; the only new constraints are keys on the
-- SOP tables themselves, all pointing at Phd module tables that already exist.
--
-- Generated with:
--   npx prisma migrate diff --from-schema-datamodel <previous schema> \
--     --to-schema-datamodel prisma/schema.prisma --script
--
-- Target: MySQL 8. Text columns hold student-authored prose; the JSON column
-- in this module is stored as LONGTEXT so the same schema runs in the SQLite
-- verification mirror without a dialect-specific type.
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE `PhdStatementOfPurpose` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NULL,
    `programmeId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `targetWords` INTEGER NOT NULL DEFAULT 1000,
    `wordLimit` INTEGER NULL,
    `aiDisclosureRequired` BOOLEAN NULL,
    `aiDisclosureIncluded` BOOLEAN NOT NULL DEFAULT false,
    `personalFacts` LONGTEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `studentReviewedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `requirementsVerifiedAt` DATETIME(3) NULL,
    `exportVerifiedAt` DATETIME(3) NULL,
    `notes` TEXT NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdStatementOfPurpose_projectId_status_idx`(`projectId`, `status`),
    UNIQUE INDEX `PhdStatementOfPurpose_projectId_universityId_programmeId_key`(`projectId`, `universityId`, `programmeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSopSection` (
    `id` VARCHAR(191) NOT NULL,
    `sopId` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL,
    `content` LONGTEXT NOT NULL,
    `aiAssisted` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdSopSection_sopId_sortOrder_idx`(`sopId`, `sortOrder`),
    UNIQUE INDEX `PhdSopSection_sopId_sectionKey_key`(`sopId`, `sectionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSopVersion` (
    `id` VARCHAR(191) NOT NULL,
    `sopId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `snapshot` LONGTEXT NOT NULL,
    `changeSummary` VARCHAR(191) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdSopVersion_sopId_createdAt_idx`(`sopId`, `createdAt`),
    UNIQUE INDEX `PhdSopVersion_sopId_version_key`(`sopId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSopReview` (
    `id` VARCHAR(191) NOT NULL,
    `sopId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `reviewerRole` VARCHAR(191) NOT NULL,
    `decision` VARCHAR(191) NOT NULL,
    `comments` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdSopReview_sopId_createdAt_idx`(`sopId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PhdStatementOfPurpose` ADD CONSTRAINT `PhdStatementOfPurpose_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdStatementOfPurpose` ADD CONSTRAINT `PhdStatementOfPurpose_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdStatementOfPurpose` ADD CONSTRAINT `PhdStatementOfPurpose_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `PhdProgramme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSopSection` ADD CONSTRAINT `PhdSopSection_sopId_fkey` FOREIGN KEY (`sopId`) REFERENCES `PhdStatementOfPurpose`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSopVersion` ADD CONSTRAINT `PhdSopVersion_sopId_fkey` FOREIGN KEY (`sopId`) REFERENCES `PhdStatementOfPurpose`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSopReview` ADD CONSTRAINT `PhdSopReview_sopId_fkey` FOREIGN KEY (`sopId`) REFERENCES `PhdStatementOfPurpose`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

