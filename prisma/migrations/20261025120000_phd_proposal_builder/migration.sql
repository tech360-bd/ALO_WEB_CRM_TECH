-- UK PhD Proposal Builder — additive module migration
-- ---------------------------------------------------------------------------
-- This migration is additive and Phd-only. It creates the 47 module tables with their indexes,
-- unique constraints and foreign keys. No existing table is created, altered
-- or dropped; the four foreign keys that point at `User` only add new
-- constraints on the Phd side, so existing CRM data is unaffected.
--
-- Note: PhdTuitionFee columns in its 5-column unique key are capped at 16/32
-- characters so the index stays inside the InnoDB 3072-byte limit under utf8mb4.
--
-- Generated with:
--   npx prisma migrate diff --from-empty \
--     --to-schema-datamodel .phd-migration-schema.prisma --script
-- where .phd-migration-schema.prisma is prisma/phd-schema-fragment.prisma
-- plus a minimal User stub (see scripts/phd/check-schema-sync.mjs).
--
-- Target: MySQL 8. Money is stored as integer minor units, percentages as
-- basis points, and enumerated values as validated strings (see
-- src/lib/phd/constants.ts). No floating-point money is stored.
-- ---------------------------------------------------------------------------

-- CreateTable
CREATE TABLE `PhdProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `highestQualification` VARCHAR(191) NOT NULL DEFAULT '',
    `degreeSubject` VARCHAR(191) NOT NULL DEFAULT '',
    `awardingInstitution` VARCHAR(191) NOT NULL DEFAULT '',
    `gradeAwarded` VARCHAR(191) NOT NULL DEFAULT '',
    `gpa` VARCHAR(191) NOT NULL DEFAULT '',
    `classification` VARCHAR(191) NOT NULL DEFAULT '',
    `relevantModules` TEXT NOT NULL,
    `dissertationTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `methodsExperience` TEXT NOT NULL,
    `publications` TEXT NOT NULL,
    `researchExperience` TEXT NOT NULL,
    `employmentHistory` TEXT NOT NULL,
    `englishTestStatus` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `englishTestType` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTestScore` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTestDate` DATETIME(3) NULL,
    `primaryDiscipline` VARCHAR(191) NOT NULL DEFAULT 'UNDECIDED',
    `existingResearchIdea` TEXT NOT NULL,
    `preferredMethods` VARCHAR(191) NOT NULL DEFAULT '',
    `researchSetting` TEXT NOT NULL,
    `studyMode` VARCHAR(191) NOT NULL DEFAULT 'UNDECIDED',
    `desiredStart` VARCHAR(191) NOT NULL DEFAULT '',
    `locationPreferences` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingRequirement` VARCHAR(191) NOT NULL DEFAULT 'UNDECIDED',
    `budgetRange` VARCHAR(191) NOT NULL DEFAULT '',
    `equipmentNeeds` TEXT NOT NULL,
    `currentStage` VARCHAR(191) NOT NULL DEFAULT 'TOPIC_DISCOVERY',
    `existingDocuments` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredContact` VARCHAR(191) NOT NULL DEFAULT 'EMAIL',
    `personalDeadlines` TEXT NOT NULL,
    `privacyAcceptedAt` DATETIME(3) NULL,
    `onboardingStep` INTEGER NOT NULL DEFAULT 1,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdProfile_userId_key`(`userId`),
    INDEX `PhdProfile_primaryDiscipline_idx`(`primaryDiscipline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProfileInterest` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdProfileInterest_profileId_kind_idx`(`profileId`, `kind`),
    UNIQUE INDEX `PhdProfileInterest_profileId_kind_value_key`(`profileId`, `kind`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProject` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `discipline` VARCHAR(191) NOT NULL DEFAULT 'UNDECIDED',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `stage` VARCHAR(191) NOT NULL DEFAULT 'TOPIC_DISCOVERY',
    `researchQuestion` TEXT NOT NULL,
    `selectedTopicId` VARCHAR(191) NULL,
    `adviserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdProject_userId_status_idx`(`userId`, `status`),
    INDEX `PhdProject_selectedTopicId_idx`(`selectedTopicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchPreference` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 2,
    `source` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdResearchPreference_projectId_category_idx`(`projectId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdTopicArea` (
    `code` VARCHAR(191) NOT NULL,
    `discipline` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subfield` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL,
    `keywords` TEXT NOT NULL,
    `problems` TEXT NOT NULL,
    `theories` TEXT NOT NULL,
    `methods` TEXT NOT NULL,
    `dataSources` TEXT NOT NULL,
    `risks` TEXT NOT NULL,
    `ethics` TEXT NOT NULL,
    `contributions` TEXT NOT NULL,
    `searchStrategy` TEXT NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdTopicCandidate` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `areaCode` VARCHAR(191) NOT NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `workingTitle` VARCHAR(191) NOT NULL,
    `plainLanguage` TEXT NOT NULL,
    `researchField` VARCHAR(191) NOT NULL,
    `researchSubfield` VARCHAR(191) NOT NULL,
    `problemStatement` TEXT NOT NULL,
    `initialEvidence` TEXT NOT NULL,
    `provisionalGap` TEXT NOT NULL,
    `mainQuestion` TEXT NOT NULL,
    `aim` TEXT NOT NULL,
    `theoryFramework` TEXT NOT NULL,
    `methodology` TEXT NOT NULL,
    `dataNeeds` TEXT NOT NULL,
    `feasibilityRisks` TEXT NOT NULL,
    `ethics` TEXT NOT NULL,
    `scholarlyContribution` TEXT NOT NULL,
    `practicalContribution` TEXT NOT NULL,
    `potentialMatches` TEXT NOT NULL,
    `preliminaryReading` TEXT NOT NULL,
    `confidence` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `evidenceQuality` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `unresolvedQuestions` TEXT NOT NULL,
    `noveltyStatus` VARCHAR(191) NOT NULL DEFAULT 'PROVISIONAL_UNVERIFIED',
    `provenance` VARCHAR(191) NOT NULL DEFAULT 'GENERATED',
    `isSelected` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdTopicCandidate_dedupeKey_key`(`dedupeKey`),
    INDEX `PhdTopicCandidate_projectId_areaCode_idx`(`projectId`, `areaCode`),
    INDEX `PhdTopicCandidate_projectId_isSelected_idx`(`projectId`, `isSelected`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'SUPPORTING',
    `order` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdResearchQuestion_topicId_order_idx`(`topicId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchObjective` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `measure` TEXT NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdResearchObjective_topicId_order_idx`(`topicId`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchMethodology` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `paradigm` VARCHAR(191) NOT NULL DEFAULT '',
    `design` TEXT NOT NULL,
    `methods` TEXT NOT NULL,
    `rationale` TEXT NOT NULL,
    `resources` TEXT NOT NULL,
    `risks` TEXT NOT NULL,
    `isSelected` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdResearchMethodology_topicId_idx`(`topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdTopicEvaluation` (
    `id` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `criterion` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `weight` INTEGER NOT NULL,
    `explanation` TEXT NOT NULL,
    `evidenceStatus` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `evaluatedBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdTopicEvaluation_topicId_idx`(`topicId`),
    UNIQUE INDEX `PhdTopicEvaluation_topicId_criterion_key`(`topicId`, `criterion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdLiteratureSource` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `authors` TEXT NOT NULL,
    `year` INTEGER NULL,
    `venue` VARCHAR(191) NOT NULL DEFAULT '',
    `publisher` VARCHAR(191) NOT NULL DEFAULT '',
    `doi` VARCHAR(191) NULL,
    `url` TEXT NULL,
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'JOURNAL_ARTICLE',
    `abstract` TEXT NOT NULL,
    `notes` TEXT NOT NULL,
    `researchQuestion` TEXT NOT NULL,
    `methods` TEXT NOT NULL,
    `findings` TEXT NOT NULL,
    `limitations` TEXT NOT NULL,
    `relevance` TEXT NOT NULL,
    `supportDirection` VARCHAR(191) NOT NULL DEFAULT 'SUPPORTS',
    `accessedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `provenance` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `documentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdLiteratureSource_dedupeKey_key`(`dedupeKey`),
    UNIQUE INDEX `PhdLiteratureSource_documentId_key`(`documentId`),
    INDEX `PhdLiteratureSource_projectId_verificationStatus_idx`(`projectId`, `verificationStatus`),
    INDEX `PhdLiteratureSource_projectId_year_idx`(`projectId`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdEvidenceClaim` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NULL,
    `claim` TEXT NOT NULL,
    `supportType` VARCHAR(191) NOT NULL DEFAULT 'VERIFIED_FACT',
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `confidence` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdEvidenceClaim_projectId_supportType_idx`(`projectId`, `supportType`),
    INDEX `PhdEvidenceClaim_sourceId_idx`(`sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchNote` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `tags` VARCHAR(191) NOT NULL DEFAULT '',
    `provenance` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdResearchNote_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdUniversity` (
    `id` VARCHAR(191) NOT NULL,
    `registerId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `officialDomain` VARCHAR(191) NOT NULL,
    `officialHomepage` TEXT NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'United Kingdom',
    `researchDegreesUrl` TEXT NULL,
    `researchDegreesPageTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `researchDegreesStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `sourceRetrievedAt` DATETIME(3) NULL,
    `targetListRank` INTEGER NULL,
    `registerProvenance` VARCHAR(191) NOT NULL DEFAULT 'SEEDED_TARGET_REGISTER',
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdUniversity_registerId_key`(`registerId`),
    UNIQUE INDEX `PhdUniversity_slug_key`(`slug`),
    UNIQUE INDEX `PhdUniversity_name_key`(`name`),
    UNIQUE INDEX `PhdUniversity_officialDomain_key`(`officialDomain`),
    UNIQUE INDEX `PhdUniversity_targetListRank_key`(`targetListRank`),
    INDEX `PhdUniversity_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSchool` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `schoolType` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `websiteUrl` TEXT NULL,
    `researchUrl` TEXT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `evidenceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdSchool_universityId_schoolType_idx`(`universityId`, `schoolType`),
    UNIQUE INDEX `PhdSchool_universityId_name_key`(`universityId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProgramme` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `award` VARCHAR(191) NOT NULL DEFAULT 'PhD',
    `discipline` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `officialUrl` TEXT NULL,
    `description` TEXT NOT NULL,
    `specialisms` TEXT NOT NULL,
    `fullTime` BOOLEAN NOT NULL DEFAULT true,
    `partTime` BOOLEAN NOT NULL DEFAULT false,
    `distanceLearning` BOOLEAN NOT NULL DEFAULT false,
    `applicationRequirements` TEXT NOT NULL,
    `proposalFormat` TEXT NOT NULL,
    `proposalWordLimit` INTEGER NULL,
    `requiredHeadings` TEXT NOT NULL,
    `referencingStyle` VARCHAR(191) NOT NULL DEFAULT '',
    `abstractRequired` BOOLEAN NULL,
    `submissionFormat` VARCHAR(191) NOT NULL DEFAULT '',
    `requiredDocuments` TEXT NOT NULL,
    `englishRequirements` TEXT NOT NULL,
    `intakes` TEXT NOT NULL,
    `applicationDeadline` VARCHAR(191) NOT NULL DEFAULT '',
    `feesUrl` TEXT NULL,
    `fundingUrl` TEXT NULL,
    `supervisorDirectoryUrl` TEXT NULL,
    `applicationInstructions` TEXT NOT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `evidenceId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdProgramme_universityId_discipline_idx`(`universityId`, `discipline`),
    UNIQUE INDEX `PhdProgramme_universityId_name_award_key`(`universityId`, `name`, `award`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchArea` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `url` TEXT NULL,
    `discipline` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdResearchArea_universityId_discipline_idx`(`universityId`, `discipline`),
    UNIQUE INDEX `PhdResearchArea_universityId_name_key`(`universityId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSupervisor` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `schoolId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `roleTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `profileUrl` VARCHAR(512) NOT NULL,
    `researchInterests` TEXT NOT NULL,
    `methods` TEXT NOT NULL,
    `facilities` TEXT NOT NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactSourceUrl` TEXT NULL,
    `availabilityStatus` VARCHAR(191) NOT NULL DEFAULT 'AVAILABILITY_UNCLEAR',
    `availabilityEvidence` TEXT NOT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `notes` TEXT NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdSupervisor_dedupeKey_key`(`dedupeKey`),
    INDEX `PhdSupervisor_universityId_availabilityStatus_idx`(`universityId`, `availabilityStatus`),
    INDEX `PhdSupervisor_fullName_idx`(`fullName`),
    UNIQUE INDEX `PhdSupervisor_universityId_profileUrl_key`(`universityId`, `profileUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSupervisorExpertise` (
    `id` VARCHAR(191) NOT NULL,
    `supervisorId` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'OFFICIAL_PROFILE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdSupervisorExpertise_keyword_idx`(`keyword`),
    UNIQUE INDEX `PhdSupervisorExpertise_supervisorId_keyword_key`(`supervisorId`, `keyword`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSupervisorPublication` (
    `id` VARCHAR(191) NOT NULL,
    `supervisorId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `venue` VARCHAR(191) NOT NULL DEFAULT '',
    `doi` VARCHAR(191) NULL,
    `url` TEXT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdSupervisorPublication_supervisorId_idx`(`supervisorId`),
    UNIQUE INDEX `PhdSupervisorPublication_supervisorId_title_year_key`(`supervisorId`, `title`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSupervisorMatch` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `supervisorId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NULL,
    `fitScore` INTEGER NOT NULL DEFAULT 0,
    `fitLabel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `keywordAlignment` INTEGER NOT NULL DEFAULT 0,
    `methodAlignment` INTEGER NOT NULL DEFAULT 0,
    `publicationAlignment` INTEGER NOT NULL DEFAULT 0,
    `disciplineAlignment` INTEGER NOT NULL DEFAULT 0,
    `rationale` TEXT NOT NULL,
    `mismatches` TEXT NOT NULL,
    `missingEvidence` TEXT NOT NULL,
    `availabilityAtMatch` VARCHAR(191) NOT NULL DEFAULT 'AVAILABILITY_UNCLEAR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdSupervisorMatch_projectId_fitScore_idx`(`projectId`, `fitScore`),
    UNIQUE INDEX `PhdSupervisorMatch_projectId_supervisorId_key`(`projectId`, `supervisorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSupervisorContact` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `supervisorId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `attachments` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFTED',
    `approvedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `repliedAt` DATETIME(3) NULL,
    `nextFollowUpAt` DATETIME(3) NULL,
    `responseSummary` TEXT NOT NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdSupervisorContact_projectId_status_idx`(`projectId`, `status`),
    INDEX `PhdSupervisorContact_supervisorId_status_idx`(`supervisorId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProposal` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NULL,
    `programmeId` VARCHAR(191) NULL,
    `topicId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `isGeneralDraft` BOOLEAN NOT NULL DEFAULT true,
    `wordLimit` INTEGER NULL,
    `requiredHeadings` TEXT NOT NULL,
    `referencingStyle` VARCHAR(191) NOT NULL DEFAULT 'NOT_SPECIFIED',
    `abstractRequired` BOOLEAN NOT NULL DEFAULT true,
    `ethicsRequired` BOOLEAN NOT NULL DEFAULT true,
    `fileFormat` VARCHAR(191) NOT NULL DEFAULT '',
    `requirementsVerificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `requirementsSourceUrl` TEXT NULL,
    `requirementsCheckedAt` DATETIME(3) NULL,
    `currentVersion` INTEGER NOT NULL DEFAULT 1,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdProposal_projectId_universityId_idx`(`projectId`, `universityId`),
    INDEX `PhdProposal_programmeId_idx`(`programmeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProposalSection` (
    `id` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `required` BOOLEAN NOT NULL DEFAULT true,
    `guidance` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdProposalSection_proposalId_sortOrder_idx`(`proposalId`, `sortOrder`),
    UNIQUE INDEX `PhdProposalSection_proposalId_sectionKey_key`(`proposalId`, `sectionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProposalVersion` (
    `id` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `wordCount` INTEGER NOT NULL DEFAULT 0,
    `changeSummary` TEXT NOT NULL,
    `snapshot` LONGTEXT NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdProposalVersion_proposalId_createdAt_idx`(`proposalId`, `createdAt`),
    UNIQUE INDEX `PhdProposalVersion_proposalId_version_key`(`proposalId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdProposalCitation` (
    `id` VARCHAR(191) NOT NULL,
    `proposalId` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NULL,
    `sectionKey` VARCHAR(191) NOT NULL DEFAULT '',
    `rawText` TEXT NOT NULL,
    `claimText` TEXT NOT NULL,
    `isValid` BOOLEAN NOT NULL DEFAULT false,
    `validationNote` TEXT NOT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdProposalCitation_proposalId_sectionKey_idx`(`proposalId`, `sectionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdTimeline` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'FULL_TIME',
    `startDate` DATETIME(3) NOT NULL,
    `totalMonths` INTEGER NOT NULL,
    `discipline` VARCHAR(191) NOT NULL DEFAULT 'UNDECIDED',
    `notes` TEXT NOT NULL,
    `generatedBy` VARCHAR(191) NOT NULL DEFAULT 'DETERMINISTIC_PLANNER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdTimeline_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdTimelineMilestone` (
    `id` VARCHAR(191) NOT NULL,
    `timelineId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'RESEARCH',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `dependsOnId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PLANNED',
    `isOfficialDeadline` BOOLEAN NOT NULL DEFAULT false,
    `sourceUrl` TEXT NULL,
    `notes` TEXT NOT NULL,

    INDEX `PhdTimelineMilestone_timelineId_sortOrder_idx`(`timelineId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdFundingOpportunity` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUrl` TEXT NOT NULL,
    `fundingType` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `eligibility` TEXT NOT NULL,
    `nationalityRestrictions` TEXT NOT NULL,
    `subjectRestrictions` TEXT NOT NULL,
    `tuitionCoverage` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `stipendAmountMinor` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT '',
    `duration` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationRequirements` TEXT NOT NULL,
    `closingDate` DATETIME(3) NULL,
    `closingTimezone` VARCHAR(191) NOT NULL DEFAULT '',
    `separateAdmissionRequired` BOOLEAN NULL,
    `supervisorContactRequired` BOOLEAN NULL,
    `fundingStartDate` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `notes` TEXT NOT NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdFundingOpportunity_dedupeKey_key`(`dedupeKey`),
    INDEX `PhdFundingOpportunity_universityId_closingDate_idx`(`universityId`, `closingDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdFundingEligibility` (
    `id` VARCHAR(191) NOT NULL,
    `opportunityId` VARCHAR(191) NOT NULL,
    `criterion` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `applicantStatus` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PhdFundingEligibility_opportunityId_criterion_key`(`opportunityId`, `criterion`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdDeadline` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `universityId` VARCHAR(191) NULL,
    `programmeId` VARCHAR(191) NULL,
    `fundingOpportunityId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'APPLICATION',
    `dueDate` DATETIME(3) NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DATE_NOT_PUBLISHED',
    `sourceUrl` TEXT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `reminderDays` INTEGER NOT NULL DEFAULT 7,
    `notes` TEXT NOT NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdDeadline_projectId_dueDate_idx`(`projectId`, `dueDate`),
    INDEX `PhdDeadline_status_dueDate_idx`(`status`, `dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdTuitionFee` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `programmeId` VARCHAR(191) NULL,
    `academicYear` VARCHAR(16) NOT NULL,
    `studentStatus` VARCHAR(32) NOT NULL,
    `feeBasis` VARCHAR(32) NOT NULL,
    `amountMinor` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GBP',
    `sourceUrl` TEXT NOT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `lastVerifiedAt` DATETIME(3) NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdTuitionFee_universityId_academicYear_idx`(`universityId`, `academicYear`),
    UNIQUE INDEX `PhdTuitionFee_universityId_programmeId_academicYear_studentS_key`(`universityId`, `programmeId`, `academicYear`, `studentStatus`, `feeBasis`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdApplication` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `programmeId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NULL,
    `proposalId` VARCHAR(191) NULL,
    `supervisorId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RESEARCHING',
    `fundingStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `openedAt` DATETIME(3) NULL,
    `closingDate` DATETIME(3) NULL,
    `submittedAt` DATETIME(3) NULL,
    `applicationReference` VARCHAR(191) NOT NULL DEFAULT '',
    `interviewAt` DATETIME(3) NULL,
    `offerStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE',
    `offerConditions` TEXT NOT NULL,
    `fundingDecision` VARCHAR(191) NOT NULL DEFAULT '',
    `nextAction` VARCHAR(191) NOT NULL DEFAULT '',
    `nextActionDueAt` DATETIME(3) NULL,
    `notes` TEXT NOT NULL,
    `sourceUrl` TEXT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdApplication_projectId_status_idx`(`projectId`, `status`),
    INDEX `PhdApplication_universityId_status_idx`(`universityId`, `status`),
    UNIQUE INDEX `PhdApplication_projectId_universityId_programmeId_key`(`projectId`, `universityId`, `programmeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdApplicationTask` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `dueAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `notes` TEXT NOT NULL,
    `documentRequirementId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdApplicationTask_applicationId_status_dueAt_idx`(`applicationId`, `status`, `dueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdDocument` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `checksum` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `uploadedById` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NULL,
    `requirementId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UPLOADED',
    `retentionUntil` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PhdDocument_storageKey_key`(`storageKey`),
    INDEX `PhdDocument_projectId_documentType_idx`(`projectId`, `documentType`),
    INDEX `PhdDocument_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdDocumentRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `programmeId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `mandatory` BOOLEAN NOT NULL DEFAULT false,
    `sourceUrl` TEXT NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdDocumentRequirement_programmeId_idx`(`programmeId`),
    UNIQUE INDEX `PhdDocumentRequirement_programmeId_documentType_key`(`programmeId`, `documentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdCommissionDocument` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `versionLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `sha256` VARCHAR(191) NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `pageCount` INTEGER NOT NULL DEFAULT 0,
    `effectiveFrom` DATETIME(3) NULL,
    `effectiveTo` DATETIME(3) NULL,
    `sourceNote` TEXT NOT NULL,
    `extractionStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `uploadedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdCommissionDocument_sha256_key`(`sha256`),
    UNIQUE INDEX `PhdCommissionDocument_storageKey_key`(`storageKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdCommissionPage` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `pageNumber` INTEGER NOT NULL,
    `text` LONGTEXT NOT NULL,
    `extractStatus` VARCHAR(191) NOT NULL DEFAULT 'EXTRACTED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdCommissionPage_documentId_idx`(`documentId`),
    UNIQUE INDEX `PhdCommissionPage_documentId_pageNumber_key`(`documentId`, `pageNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdCommissionRecord` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NULL,
    `universityId` VARCHAR(191) NULL,
    `universityNameRaw` VARCHAR(191) NOT NULL,
    `pageNumber` INTEGER NULL,
    `exactWording` TEXT NOT NULL,
    `commissionType` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `amountMinor` INTEGER NULL,
    `percentageBasisPoints` INTEGER NULL,
    `basisGrossNet` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `eligibleCategory` TEXT NOT NULL,
    `exclusions` TEXT NOT NULL,
    `paymentMilestone` TEXT NOT NULL,
    `effectivePeriod` VARCHAR(191) NOT NULL DEFAULT '',
    `clawbackTerms` TEXT NOT NULL,
    `extractionStatus` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'CONFIRMED_UNVERIFIED',
    `lastReviewedAt` DATETIME(3) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `notes` TEXT NOT NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdCommissionRecord_universityId_idx`(`universityId`),
    INDEX `PhdCommissionRecord_documentId_pageNumber_idx`(`documentId`, `pageNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdCommissionCondition` (
    `id` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `condition` TEXT NOT NULL,
    `pageNumber` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdCommissionCondition_recordId_category_idx`(`recordId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdCommissionAgreement` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NULL,
    `universityNameRaw` VARCHAR(191) NOT NULL,
    `phdCommissionStatus` VARCHAR(191) NOT NULL DEFAULT 'UNCONFIRMED',
    `recordId` VARCHAR(191) NULL,
    `documentId` VARCHAR(191) NULL,
    `sourcePage` INTEGER NULL,
    `exactWording` TEXT NOT NULL,
    `reason` TEXT NOT NULL,
    `reviewRequired` BOOLEAN NOT NULL DEFAULT true,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PhdCommissionAgreement_universityId_key`(`universityId`),
    UNIQUE INDEX `PhdCommissionAgreement_universityNameRaw_key`(`universityNameRaw`),
    INDEX `PhdCommissionAgreement_phdCommissionStatus_idx`(`phdCommissionStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdSourceEvidence` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL DEFAULT '',
    `claim` TEXT NOT NULL,
    `sourceUrl` TEXT NULL,
    `sourceAuthority` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `excerpt` TEXT NOT NULL,
    `retrievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_YET_VERIFIED',
    `reviewerId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `conflictNotes` TEXT NOT NULL,
    `nextVerificationAt` DATETIME(3) NULL,
    `universityId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PhdSourceEvidence_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `PhdSourceEvidence_verificationStatus_nextVerificationAt_idx`(`verificationStatus`, `nextVerificationAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdVerificationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `evidenceId` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `fromStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `toStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `actorId` VARCHAR(191) NOT NULL,
    `notes` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdVerificationEvent_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'REMINDER',
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `dueAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT 'IN_APP',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdNotification_userId_readAt_dueAt_idx`(`userId`, `readAt`, `dueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `projectId` VARCHAR(191) NOT NULL DEFAULT '',
    `details` TEXT NOT NULL,
    `ipHash` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `PhdAuditLog_actorId_createdAt_idx`(`actorId`, `createdAt`),
    INDEX `PhdAuditLog_projectId_createdAt_idx`(`projectId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdResearchJob` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `kind` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `dedupeKey` VARCHAR(191) NULL,
    `payload` TEXT NOT NULL,
    `result` TEXT NOT NULL,
    `error` TEXT NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhdResearchJob_dedupeKey_key`(`dedupeKey`),
    INDEX `PhdResearchJob_projectId_kind_status_idx`(`projectId`, `kind`, `status`),
    INDEX `PhdResearchJob_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhdExportRecord` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `format` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `bytes` INTEGER NOT NULL,
    `checksum` VARCHAR(191) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PhdExportRecord_projectId_createdAt_idx`(`projectId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PhdProfile` ADD CONSTRAINT `PhdProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProfileInterest` ADD CONSTRAINT `PhdProfileInterest_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `PhdProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProject` ADD CONSTRAINT `PhdProject_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProject` ADD CONSTRAINT `PhdProject_selectedTopicId_fkey` FOREIGN KEY (`selectedTopicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchPreference` ADD CONSTRAINT `PhdResearchPreference_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTopicCandidate` ADD CONSTRAINT `PhdTopicCandidate_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTopicCandidate` ADD CONSTRAINT `PhdTopicCandidate_areaCode_fkey` FOREIGN KEY (`areaCode`) REFERENCES `PhdTopicArea`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchQuestion` ADD CONSTRAINT `PhdResearchQuestion_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchObjective` ADD CONSTRAINT `PhdResearchObjective_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchMethodology` ADD CONSTRAINT `PhdResearchMethodology_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTopicEvaluation` ADD CONSTRAINT `PhdTopicEvaluation_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdLiteratureSource` ADD CONSTRAINT `PhdLiteratureSource_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdLiteratureSource` ADD CONSTRAINT `PhdLiteratureSource_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `PhdDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdEvidenceClaim` ADD CONSTRAINT `PhdEvidenceClaim_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdEvidenceClaim` ADD CONSTRAINT `PhdEvidenceClaim_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `PhdLiteratureSource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchNote` ADD CONSTRAINT `PhdResearchNote_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSchool` ADD CONSTRAINT `PhdSchool_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProgramme` ADD CONSTRAINT `PhdProgramme_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProgramme` ADD CONSTRAINT `PhdProgramme_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `PhdSchool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchArea` ADD CONSTRAINT `PhdResearchArea_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisor` ADD CONSTRAINT `PhdSupervisor_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisor` ADD CONSTRAINT `PhdSupervisor_schoolId_fkey` FOREIGN KEY (`schoolId`) REFERENCES `PhdSchool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorExpertise` ADD CONSTRAINT `PhdSupervisorExpertise_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `PhdSupervisor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorPublication` ADD CONSTRAINT `PhdSupervisorPublication_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `PhdSupervisor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorMatch` ADD CONSTRAINT `PhdSupervisorMatch_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorMatch` ADD CONSTRAINT `PhdSupervisorMatch_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `PhdSupervisor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorMatch` ADD CONSTRAINT `PhdSupervisorMatch_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorContact` ADD CONSTRAINT `PhdSupervisorContact_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSupervisorContact` ADD CONSTRAINT `PhdSupervisorContact_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `PhdSupervisor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposal` ADD CONSTRAINT `PhdProposal_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposal` ADD CONSTRAINT `PhdProposal_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposal` ADD CONSTRAINT `PhdProposal_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `PhdProgramme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposalSection` ADD CONSTRAINT `PhdProposalSection_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `PhdProposal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposalVersion` ADD CONSTRAINT `PhdProposalVersion_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `PhdProposal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposalCitation` ADD CONSTRAINT `PhdProposalCitation_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `PhdProposal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdProposalCitation` ADD CONSTRAINT `PhdProposalCitation_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `PhdLiteratureSource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTimeline` ADD CONSTRAINT `PhdTimeline_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTimelineMilestone` ADD CONSTRAINT `PhdTimelineMilestone_timelineId_fkey` FOREIGN KEY (`timelineId`) REFERENCES `PhdTimeline`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdFundingOpportunity` ADD CONSTRAINT `PhdFundingOpportunity_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdFundingEligibility` ADD CONSTRAINT `PhdFundingEligibility_opportunityId_fkey` FOREIGN KEY (`opportunityId`) REFERENCES `PhdFundingOpportunity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDeadline` ADD CONSTRAINT `PhdDeadline_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDeadline` ADD CONSTRAINT `PhdDeadline_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDeadline` ADD CONSTRAINT `PhdDeadline_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `PhdProgramme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDeadline` ADD CONSTRAINT `PhdDeadline_fundingOpportunityId_fkey` FOREIGN KEY (`fundingOpportunityId`) REFERENCES `PhdFundingOpportunity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDeadline` ADD CONSTRAINT `PhdDeadline_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `PhdApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTuitionFee` ADD CONSTRAINT `PhdTuitionFee_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdTuitionFee` ADD CONSTRAINT `PhdTuitionFee_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `PhdProgramme`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplication` ADD CONSTRAINT `PhdApplication_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplication` ADD CONSTRAINT `PhdApplication_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplication` ADD CONSTRAINT `PhdApplication_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `PhdProgramme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplication` ADD CONSTRAINT `PhdApplication_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `PhdTopicCandidate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplication` ADD CONSTRAINT `PhdApplication_proposalId_fkey` FOREIGN KEY (`proposalId`) REFERENCES `PhdProposal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplication` ADD CONSTRAINT `PhdApplication_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `PhdSupervisor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdApplicationTask` ADD CONSTRAINT `PhdApplicationTask_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `PhdApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDocument` ADD CONSTRAINT `PhdDocument_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDocument` ADD CONSTRAINT `PhdDocument_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDocument` ADD CONSTRAINT `PhdDocument_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `PhdApplication`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDocument` ADD CONSTRAINT `PhdDocument_requirementId_fkey` FOREIGN KEY (`requirementId`) REFERENCES `PhdDocumentRequirement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdDocumentRequirement` ADD CONSTRAINT `PhdDocumentRequirement_programmeId_fkey` FOREIGN KEY (`programmeId`) REFERENCES `PhdProgramme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionPage` ADD CONSTRAINT `PhdCommissionPage_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `PhdCommissionDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionRecord` ADD CONSTRAINT `PhdCommissionRecord_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `PhdCommissionDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionRecord` ADD CONSTRAINT `PhdCommissionRecord_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionCondition` ADD CONSTRAINT `PhdCommissionCondition_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `PhdCommissionRecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionAgreement` ADD CONSTRAINT `PhdCommissionAgreement_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionAgreement` ADD CONSTRAINT `PhdCommissionAgreement_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `PhdCommissionRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdCommissionAgreement` ADD CONSTRAINT `PhdCommissionAgreement_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `PhdCommissionDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdSourceEvidence` ADD CONSTRAINT `PhdSourceEvidence_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `PhdUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdVerificationEvent` ADD CONSTRAINT `PhdVerificationEvent_evidenceId_fkey` FOREIGN KEY (`evidenceId`) REFERENCES `PhdSourceEvidence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdNotification` ADD CONSTRAINT `PhdNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdNotification` ADD CONSTRAINT `PhdNotification_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhdResearchJob` ADD CONSTRAINT `PhdResearchJob_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `PhdProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

