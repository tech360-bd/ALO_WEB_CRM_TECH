-- AlterTable
ALTER TABLE `CrmUniversity` ADD COLUMN `aliases` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `campuses` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `heroImageSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `internationalStudentSupportSummary` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `logoSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `mediaUsagePermissionStatus` VARCHAR(191) NOT NULL DEFAULT 'not_requested',
    ADD COLUMN `officialCourseSearchUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `officialInternationalAdmissionsUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `officialScholarshipUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `officialTuitionFeeUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `rankingBand` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `rankingProvider` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `rankingValue` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `rankingYear` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `sourceUrls` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE `CrmCourse` ADD COLUMN `attendanceMode` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `campus` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `city` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `country` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `deliveryMode` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `internationalEligibility` VARCHAR(191) NOT NULL DEFAULT 'not_verified',
    ADD COLUMN `officialApplicationUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `onlineOption` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `partTimeOption` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `pathwayStatus` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `placementOption` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `qualification` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `sandwichYearOption` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE `CrmCourseIntakeFee` ADD COLUMN `feeSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `intakeSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `tuitionPeriod` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW';

-- AlterTable
ALTER TABLE `CrmCourseRequirement` ADD COLUMN `acceptedQualifications` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `componentScores` VARCHAR(191) NOT NULL DEFAULT '{}',
    ADD COLUMN `countrySpecificRequirement` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `englishTest` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `officialRequirementUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `prerequisiteSubjects` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    ADD COLUMN `workExperience` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `CrmScholarship` ADD COLUMN `academicYear` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `applicationMethod` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `awardPercentage` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `coverageType` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `eligibleCountries` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `eligibleLevels` VARCHAR(191) NOT NULL DEFAULT '[]',
    ADD COLUMN `expiryStatus` VARCHAR(191) NOT NULL DEFAULT 'unknown',
    ADD COLUMN `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `officialScholarshipUrl` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `provider` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW';

-- CreateTable
CREATE TABLE `CrmRanking` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `rankingTitle` VARCHAR(191) NOT NULL,
    `rankingYear` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL DEFAULT 0,
    `rankBand` VARCHAR(191) NOT NULL DEFAULT '',
    `officialRankingSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `retrievedDate` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmRanking_universityId_idx`(`universityId`),
    INDEX `CrmRanking_provider_rankingYear_idx`(`provider`, `rankingYear`),
    UNIQUE INDEX `CrmRanking_universityId_provider_rankingTitle_rankingYear_key`(`universityId`, `provider`, `rankingTitle`, `rankingYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmDiscoverySource` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NOT NULL,
    `allowedUse` VARCHAR(191) NOT NULL DEFAULT 'discovery_only',
    `robotsUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `robotsStatus` VARCHAR(191) NOT NULL DEFAULT 'not_checked',
    `termsStatus` VARCHAR(191) NOT NULL DEFAULT 'not_reviewed',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmDiscoverySource_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmDiscoveryRecord` (
    `id` VARCHAR(191) NOT NULL,
    `discoverySourceId` VARCHAR(191) NOT NULL,
    `discoveryUrl` VARCHAR(191) NOT NULL,
    `discoveredUniversityName` VARCHAR(191) NOT NULL DEFAULT '',
    `discoveredCourseTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUniversityName` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUniversityUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialCourseUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceOrganization` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `matchingStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED_ONLY',
    `pipelineStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED_ONLY',
    `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'not_published',
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `unresolvedReason` VARCHAR(191) NOT NULL DEFAULT '',
    `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmDiscoveryRecord_discoverySourceId_idx`(`discoverySourceId`),
    INDEX `CrmDiscoveryRecord_verificationStatus_idx`(`verificationStatus`),
    INDEX `CrmDiscoveryRecord_pipelineStatus_idx`(`pipelineStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmSourceVerificationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL,
    `sourcePriority` INTEGER NOT NULL DEFAULT 8,
    `httpStatus` INTEGER NOT NULL DEFAULT 0,
    `finalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `soft404` BOOLEAN NOT NULL DEFAULT false,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `entityMatchStatus` VARCHAR(191) NOT NULL DEFAULT 'not_checked',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `checkedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `checkedBy` VARCHAR(191) NOT NULL DEFAULT 'system',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CrmSourceVerificationEvent_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `CrmSourceVerificationEvent_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CrmRanking` ADD CONSTRAINT `CrmRanking_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDiscoveryRecord` ADD CONSTRAINT `CrmDiscoveryRecord_discoverySourceId_fkey` FOREIGN KEY (`discoverySourceId`) REFERENCES `CrmDiscoverySource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

