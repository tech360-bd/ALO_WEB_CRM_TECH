-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) NOT NULL DEFAULT 'VIEWER',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `passwordHash` VARCHAR(255) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_role_idx`(`role`),
    INDEX `User_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(30) NOT NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `whatsapp` VARCHAR(50) NULL,
    `organization` VARCHAR(255) NULL,
    `role` VARCHAR(100) NULL,
    `country` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `preferredChannel` VARCHAR(20) NULL,
    `tags` VARCHAR(500) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `source` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Contact_email_key`(`email`),
    INDEX `Contact_status_idx`(`status`),
    INDEX `Contact_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NULL,
    `country` VARCHAR(100) NULL,
    `website` VARCHAR(2048) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Organization_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inquiry` (
    `id` VARCHAR(30) NOT NULL,
    `reference` VARCHAR(30) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `contactId` VARCHAR(30) NOT NULL,
    `createdById` VARCHAR(30) NULL,
    `currentChallenge` TEXT NULL,
    `desiredOutcome` TEXT NULL,
    `timeline` VARCHAR(100) NULL,
    `scope` TEXT NULL,
    `existingSystem` TEXT NULL,
    `preferredTime` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `utmSource` VARCHAR(100) NULL,
    `utmMedium` VARCHAR(100) NULL,
    `utmCampaign` VARCHAR(100) NULL,
    `referralSource` VARCHAR(255) NULL,
    `privacyConsent` BOOLEAN NOT NULL DEFAULT false,
    `commsConsent` BOOLEAN NOT NULL DEFAULT false,
    `marketingConsent` BOOLEAN NOT NULL DEFAULT false,
    `studentDataConsent` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Inquiry_reference_key`(`reference`),
    INDEX `Inquiry_contactId_idx`(`contactId`),
    INDEX `Inquiry_status_idx`(`status`),
    INDEX `Inquiry_createdAt_idx`(`createdAt`),
    INDEX `Inquiry_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Opportunity` (
    `id` VARCHAR(30) NOT NULL,
    `contactId` VARCHAR(30) NOT NULL,
    `inquiryId` VARCHAR(30) NULL,
    `title` VARCHAR(255) NOT NULL,
    `value` INTEGER NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `stage` VARCHAR(30) NOT NULL DEFAULT 'new',
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
    `closeDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Opportunity_inquiryId_key`(`inquiryId`),
    INDEX `Opportunity_contactId_idx`(`contactId`),
    INDEX `Opportunity_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Partnership` (
    `id` VARCHAR(30) NOT NULL,
    `organizationId` VARCHAR(30) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NULL,
    `stage` VARCHAR(40) NOT NULL DEFAULT 'new-institution',
    `alAminnRole` VARCHAR(255) NULL,
    `problemSolved` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'planned',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Partnership_organizationId_idx`(`organizationId`),
    INDEX `Partnership_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentReferral` (
    `id` VARCHAR(30) NOT NULL,
    `contactId` VARCHAR(30) NOT NULL,
    `inquiryId` VARCHAR(30) NULL,
    `studentName` VARCHAR(255) NOT NULL,
    `interestCountry` VARCHAR(100) NULL,
    `interestProgram` VARCHAR(255) NULL,
    `consent` BOOLEAN NOT NULL DEFAULT false,
    `stage` VARCHAR(30) NOT NULL DEFAULT 'new-referral',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentReferral_inquiryId_key`(`inquiryId`),
    INDEX `StudentReferral_contactId_idx`(`contactId`),
    INDEX `StudentReferral_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `dueDate` DATETIME(3) NULL,
    `priority` VARCHAR(20) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `assigneeId` VARCHAR(30) NULL,
    `contactId` VARCHAR(30) NULL,
    `relatedType` VARCHAR(30) NULL,
    `relatedId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_assigneeId_idx`(`assigneeId`),
    INDEX `Task_status_idx`(`status`),
    INDEX `Task_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Note` (
    `id` VARCHAR(30) NOT NULL,
    `body` TEXT NOT NULL,
    `contactId` VARCHAR(30) NULL,
    `authorId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Note_contactId_idx`(`contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsletterSubscriber` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `interest` VARCHAR(30) NULL,
    `consent` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `token` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsletterSubscriber_email_key`(`email`),
    UNIQUE INDEX `NewsletterSubscriber_token_key`(`token`),
    INDEX `NewsletterSubscriber_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `subtitle` VARCHAR(500) NULL,
    `category` VARCHAR(50) NOT NULL,
    `shortDescription` VARCHAR(500) NOT NULL,
    `fullDescription` LONGTEXT NOT NULL,
    `businessProblem` LONGTEXT NULL,
    `approvedRole` VARCHAR(255) NULL,
    `responsibilities` LONGTEXT NULL,
    `solution` LONGTEXT NULL,
    `architecture` LONGTEXT NULL,
    `technologies` VARCHAR(500) NULL,
    `workflows` LONGTEXT NULL,
    `outputs` LONGTEXT NULL,
    `outcomes` LONGTEXT NULL,
    `evidenceStatus` VARCHAR(20) NOT NULL DEFAULT 'unverified',
    `confidentiality` VARCHAR(30) NOT NULL DEFAULT 'public',
    `status` VARCHAR(20) NOT NULL DEFAULT 'planned',
    `approvedUrl` VARCHAR(2048) NULL,
    `logo` VARCHAR(2048) NULL,
    `coverMedia` VARCHAR(2048) NULL,
    `gallery` VARCHAR(1000) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `visibility` VARCHAR(20) NOT NULL DEFAULT 'public',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    INDEX `Project_category_idx`(`category`),
    INDEX `Project_status_idx`(`status`),
    INDEX `Project_visibility_idx`(`visibility`),
    INDEX `Project_featured_idx`(`featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Article` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT NOT NULL,
    `body` LONGTEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `tags` VARCHAR(500) NULL,
    `author` VARCHAR(255) NOT NULL DEFAULT 'Al Aminn',
    `readingMinutes` INTEGER NOT NULL DEFAULT 5,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `coverMedia` VARCHAR(2048) NULL,

    UNIQUE INDEX `Article_slug_key`(`slug`),
    INDEX `Article_category_idx`(`category`),
    INDEX `Article_status_idx`(`status`),
    INDEX `Article_featured_idx`(`featured`),
    INDEX `Article_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `fileUrl` VARCHAR(2048) NULL,
    `readTime` INTEGER NOT NULL DEFAULT 5,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Resource_slug_key`(`slug`),
    INDEX `Resource_category_idx`(`category`),
    INDEX `Resource_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImpactRecord` (
    `id` VARCHAR(30) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `challenge` TEXT NOT NULL,
    `role` TEXT NOT NULL,
    `action` TEXT NOT NULL,
    `outcome` TEXT NOT NULL,
    `evidenceStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `confidentiality` VARCHAR(30) NOT NULL DEFAULT 'summary-only',
    `projectId` VARCHAR(30) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ImpactRecord_category_idx`(`category`),
    INDEX `ImpactRecord_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CaseStudy` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `context` LONGTEXT NOT NULL,
    `challenge` LONGTEXT NOT NULL,
    `role` TEXT NOT NULL,
    `intervention` LONGTEXT NOT NULL,
    `systemBuilt` LONGTEXT NOT NULL,
    `outcome` LONGTEXT NOT NULL,
    `evidenceStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `confidentiality` VARCHAR(30) NOT NULL DEFAULT 'summary-only',
    `readTime` INTEGER NOT NULL DEFAULT 8,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CaseStudy_slug_key`(`slug`),
    INDEX `CaseStudy_category_idx`(`category`),
    INDEX `CaseStudy_featured_idx`(`featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiTask` (
    `id` VARCHAR(30) NOT NULL,
    `requesterId` VARCHAR(30) NOT NULL,
    `workflow` VARCHAR(80) NOT NULL,
    `project` VARCHAR(255) NULL,
    `objective` TEXT NOT NULL,
    `prompt` LONGTEXT NOT NULL,
    `sensitivity` VARCHAR(20) NOT NULL DEFAULT 'internal',
    `outputFormat` VARCHAR(30) NOT NULL DEFAULT 'markdown',
    `approvalRequired` BOOLEAN NOT NULL DEFAULT true,
    `reviewerId` VARCHAR(30) NULL,
    `deadline` DATETIME(3) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
    `result` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    INDEX `AiTask_requesterId_idx`(`requesterId`),
    INDEX `AiTask_status_idx`(`status`),
    INDEX `AiTask_workflow_idx`(`workflow`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiApproval` (
    `id` VARCHAR(30) NOT NULL,
    `taskId` VARCHAR(30) NOT NULL,
    `reviewerId` VARCHAR(30) NULL,
    `decision` VARCHAR(20) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiApproval_taskId_idx`(`taskId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `actorId` VARCHAR(30) NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource` VARCHAR(50) NULL,
    `resourceId` VARCHAR(30) NULL,
    `meta` TEXT NULL,
    `ipHash` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actorId_idx`(`actorId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemHealth` (
    `id` VARCHAR(30) NOT NULL,
    `component` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `message` TEXT NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemHealth_component_idx`(`component`),
    INDEX `SystemHealth_checkedAt_idx`(`checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MeetingRequest` (
    `id` VARCHAR(30) NOT NULL,
    `reference` VARCHAR(30) NOT NULL,
    `meetingType` VARCHAR(30) NOT NULL,
    `requestedDate` DATETIME(3) NOT NULL,
    `requestedTime` VARCHAR(10) NOT NULL,
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Dhaka',
    `contactName` VARCHAR(255) NOT NULL,
    `contactEmail` VARCHAR(255) NOT NULL,
    `organization` VARCHAR(255) NULL,
    `topic` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'new',
    `ipHash` VARCHAR(64) NULL,
    `utmSource` VARCHAR(100) NULL,
    `utmMedium` VARCHAR(100) NULL,
    `utmCampaign` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MeetingRequest_reference_key`(`reference`),
    INDEX `MeetingRequest_status_idx`(`status`),
    INDEX `MeetingRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticsEvent` (
    `id` VARCHAR(30) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `eventName` VARCHAR(80) NOT NULL,
    `page` VARCHAR(2048) NULL,
    `referrer` VARCHAR(2048) NULL,
    `utmSource` VARCHAR(100) NULL,
    `utmMedium` VARCHAR(100) NULL,
    `utmCampaign` VARCHAR(100) NULL,
    `utmContent` VARCHAR(100) NULL,
    `utmTerm` VARCHAR(100) NULL,
    `sessionId` VARCHAR(64) NULL,
    `ipHash` VARCHAR(64) NULL,
    `meta` TEXT NULL,

    INDEX `AnalyticsEvent_eventName_createdAt_idx`(`eventName`, `createdAt`),
    INDEX `AnalyticsEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileUrl` VARCHAR(2048) NOT NULL,
    `mimeType` VARCHAR(100) NULL,
    `size` INTEGER NULL,
    `category` VARCHAR(50) NULL,
    `description` TEXT NULL,
    `uploadedById` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Document_category_idx`(`category`),
    INDEX `Document_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `type` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_read_idx`(`read`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` VARCHAR(30) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Setting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MediaAsset` (
    `id` VARCHAR(30) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `altText` VARCHAR(500) NULL,
    `mimeType` VARCHAR(100) NULL,
    `size` INTEGER NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `category` VARCHAR(50) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MediaAsset_category_idx`(`category`),
    INDEX `MediaAsset_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyCountry` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `officialName` VARCHAR(255) NULL,
    `region` VARCHAR(100) NULL,
    `overview` LONGTEXT NULL,
    `educationSystem` LONGTEXT NULL,
    `studyLevels` VARCHAR(500) NULL,
    `popularSubjects` VARCHAR(500) NULL,
    `tuitionFeeRange` VARCHAR(255) NULL,
    `livingCostRange` VARCHAR(255) NULL,
    `majorStudentCities` VARCHAR(500) NULL,
    `admissionRequirements` LONGTEXT NULL,
    `englishRequirements` LONGTEXT NULL,
    `availableIntakes` TEXT NULL,
    `applicationDeadlines` TEXT NULL,
    `scholarshipsAvailable` BOOLEAN NOT NULL DEFAULT true,
    `researchOpportunities` BOOLEAN NOT NULL DEFAULT true,
    `studentVisaOverview` LONGTEXT NULL,
    `financialEvidence` LONGTEXT NULL,
    `workRights` LONGTEXT NULL,
    `postStudyOpportunities` LONGTEXT NULL,
    `accommodation` LONGTEXT NULL,
    `healthcare` LONGTEXT NULL,
    `transport` LONGTEXT NULL,
    `studentSafety` LONGTEXT NULL,
    `culturalInfo` LONGTEXT NULL,
    `applicationProcess` LONGTEXT NULL,
    `requiredDocuments` LONGTEXT NULL,
    `faq` LONGTEXT NULL,
    `officialSources` LONGTEXT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `flagEmoji` VARCHAR(20) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyCountry_slug_key`(`slug`),
    INDEX `HigherStudyCountry_region_idx`(`region`),
    INDEX `HigherStudyCountry_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyCity` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `countryId` VARCHAR(30) NOT NULL,
    `overview` TEXT NULL,
    `livingCost` TEXT NULL,
    `transport` TEXT NULL,
    `accommodation` TEXT NULL,
    `studentLife` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyCity_slug_key`(`slug`),
    INDEX `HigherStudyCity_countryId_idx`(`countryId`),
    INDEX `HigherStudyCity_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyUniversity` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `officialName` VARCHAR(255) NOT NULL,
    `alternativeNames` VARCHAR(500) NULL,
    `overview` LONGTEXT NULL,
    `establishedYear` INTEGER NULL,
    `institutionType` VARCHAR(50) NULL,
    `countryId` VARCHAR(30) NOT NULL,
    `cityId` VARCHAR(30) NULL,
    `campusLocations` TEXT NULL,
    `officialWebsite` VARCHAR(2048) NULL,
    `contactEmail` VARCHAR(255) NULL,
    `contactPhone` VARCHAR(50) NULL,
    `availableIntakes` VARCHAR(500) NULL,
    `studyLevels` VARCHAR(500) NULL,
    `undergraduateCount` INTEGER NULL,
    `postgraduateCount` INTEGER NULL,
    `hasMBA` BOOLEAN NOT NULL DEFAULT false,
    `hasMRes` BOOLEAN NOT NULL DEFAULT false,
    `hasMPhil` BOOLEAN NOT NULL DEFAULT false,
    `hasPhD` BOOLEAN NOT NULL DEFAULT false,
    `hasProfessionalDoctorate` BOOLEAN NOT NULL DEFAULT false,
    `researchDepartments` VARCHAR(500) NULL,
    `researchStrengths` LONGTEXT NULL,
    `tuitionFeeRange` VARCHAR(255) NULL,
    `depositInfo` TEXT NULL,
    `academicEntryRequirements` LONGTEXT NULL,
    `countrySpecificRequirements` LONGTEXT NULL,
    `ieltsRequirement` VARCHAR(100) NULL,
    `ieltsUkviRequirement` VARCHAR(100) NULL,
    `pteRequirement` VARCHAR(100) NULL,
    `toeflRequirement` VARCHAR(100) NULL,
    `duolingoRequirement` VARCHAR(100) NULL,
    `languageCertRequirement` VARCHAR(100) NULL,
    `oxfordElltRequirement` VARCHAR(100) NULL,
    `englishWaiverPolicy` TEXT NULL,
    `workExperienceRequired` BOOLEAN NOT NULL DEFAULT false,
    `portfolioRequired` BOOLEAN NOT NULL DEFAULT false,
    `interviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `applicationDeadlines` TEXT NULL,
    `accommodationOptions` LONGTEXT NULL,
    `estimatedLivingCosts` TEXT NULL,
    `internationalStudentServices` LONGTEXT NULL,
    `disabilitySupport` TEXT NULL,
    `careerSupport` LONGTEXT NULL,
    `graduateOutcomes` LONGTEXT NULL,
    `graduateRouteGuidance` TEXT NULL,
    `applicationGuidance` LONGTEXT NULL,
    `officialLinks` LONGTEXT NULL,
    `rankingsJson` LONGTEXT NULL,
    `logoUrl` VARCHAR(2048) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyUniversity_slug_key`(`slug`),
    INDEX `HigherStudyUniversity_countryId_idx`(`countryId`),
    INDEX `HigherStudyUniversity_cityId_idx`(`cityId`),
    INDEX `HigherStudyUniversity_featured_idx`(`featured`),
    INDEX `HigherStudyUniversity_verificationStatus_idx`(`verificationStatus`),
    INDEX `HigherStudyUniversity_publicationStatus_idx`(`publicationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudySubject` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `iconUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudySubject_slug_key`(`slug`),
    INDEX `HigherStudySubject_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyIntake` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `applicationDeadline` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyIntake_slug_key`(`slug`),
    INDEX `HigherStudyIntake_status_idx`(`status`),
    INDEX `HigherStudyIntake_applicationDeadline_idx`(`applicationDeadline`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyCourse` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `universityId` VARCHAR(30) NOT NULL,
    `countryId` VARCHAR(30) NULL,
    `subjectId` VARCHAR(30) NULL,
    `studyLevel` VARCHAR(50) NOT NULL,
    `qualification` VARCHAR(100) NULL,
    `specialisation` VARCHAR(255) NULL,
    `overview` LONGTEXT NULL,
    `modules` LONGTEXT NULL,
    `duration` VARCHAR(100) NULL,
    `studyMode` VARCHAR(50) NULL,
    `tuitionFee` INTEGER NULL,
    `tuitionCurrency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `otherCosts` TEXT NULL,
    `scholarshipAvailable` BOOLEAN NOT NULL DEFAULT false,
    `academicEntryRequirements` LONGTEXT NULL,
    `countrySpecificRequirements` LONGTEXT NULL,
    `englishRequirements` LONGTEXT NULL,
    `workExperienceRequired` BOOLEAN NOT NULL DEFAULT false,
    `portfolioRequired` BOOLEAN NOT NULL DEFAULT false,
    `interviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `careerOutcomes` LONGTEXT NULL,
    `placementInfo` TEXT NULL,
    `researchComponent` TEXT NULL,
    `applicationDeadline` VARCHAR(100) NULL,
    `requiredDocuments` TEXT NULL,
    `intakeId` VARCHAR(30) NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyCourse_slug_key`(`slug`),
    INDEX `HigherStudyCourse_universityId_idx`(`universityId`),
    INDEX `HigherStudyCourse_countryId_idx`(`countryId`),
    INDEX `HigherStudyCourse_subjectId_idx`(`subjectId`),
    INDEX `HigherStudyCourse_studyLevel_idx`(`studyLevel`),
    INDEX `HigherStudyCourse_intakeId_idx`(`intakeId`),
    INDEX `HigherStudyCourse_featured_idx`(`featured`),
    INDEX `HigherStudyCourse_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyScholarship` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `provider` VARCHAR(50) NULL,
    `countryId` VARCHAR(30) NULL,
    `universityId` VARCHAR(30) NULL,
    `eligibleStudyLevels` VARCHAR(500) NULL,
    `eligibleSubjects` VARCHAR(500) NULL,
    `eligibleNationalities` VARCHAR(500) NULL,
    `fundingType` VARCHAR(50) NULL,
    `fundingAmount` VARCHAR(255) NULL,
    `tuitionCoverage` BOOLEAN NOT NULL DEFAULT false,
    `livingCostCoverage` BOOLEAN NOT NULL DEFAULT false,
    `travelSupport` BOOLEAN NOT NULL DEFAULT false,
    `healthInsurance` BOOLEAN NOT NULL DEFAULT false,
    `otherBenefits` TEXT NULL,
    `eligibilityCriteria` LONGTEXT NULL,
    `academicRequirement` LONGTEXT NULL,
    `englishRequirement` LONGTEXT NULL,
    `workExperienceRequired` BOOLEAN NOT NULL DEFAULT false,
    `requiredDocuments` TEXT NULL,
    `openingDate` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `applicationProcess` LONGTEXT NULL,
    `selectionProcess` TEXT NULL,
    `restrictions` TEXT NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyScholarship_slug_key`(`slug`),
    INDEX `HigherStudyScholarship_countryId_idx`(`countryId`),
    INDEX `HigherStudyScholarship_universityId_idx`(`universityId`),
    INDEX `HigherStudyScholarship_fundingType_idx`(`fundingType`),
    INDEX `HigherStudyScholarship_deadline_idx`(`deadline`),
    INDEX `HigherStudyScholarship_featured_idx`(`featured`),
    INDEX `HigherStudyScholarship_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyResearchArea` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyResearchArea_slug_key`(`slug`),
    INDEX `HigherStudyResearchArea_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyResearchProject` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `universityId` VARCHAR(30) NOT NULL,
    `department` VARCHAR(255) NULL,
    `researchGroupId` VARCHAR(30) NULL,
    `researchAreaId` VARCHAR(30) NULL,
    `supervisorId` VARCHAR(30) NULL,
    `coSupervisorId` VARCHAR(30) NULL,
    `projectSummary` LONGTEXT NULL,
    `researchObjectives` LONGTEXT NULL,
    `methodologySummary` LONGTEXT NULL,
    `candidateProfile` LONGTEXT NULL,
    `academicRequirements` LONGTEXT NULL,
    `englishRequirements` LONGTEXT NULL,
    `fundingStatus` VARCHAR(30) NULL,
    `tuitionCoverage` BOOLEAN NOT NULL DEFAULT false,
    `stipend` VARCHAR(255) NULL,
    `additionalFunding` TEXT NULL,
    `duration` VARCHAR(100) NULL,
    `startDate` DATETIME(3) NULL,
    `applicationDeadline` DATETIME(3) NULL,
    `requiredDocuments` TEXT NULL,
    `applicationProcess` LONGTEXT NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudyResearchProject_slug_key`(`slug`),
    INDEX `HigherStudyResearchProject_universityId_idx`(`universityId`),
    INDEX `HigherStudyResearchProject_researchAreaId_idx`(`researchAreaId`),
    INDEX `HigherStudyResearchProject_supervisorId_idx`(`supervisorId`),
    INDEX `HigherStudyResearchProject_fundingStatus_idx`(`fundingStatus`),
    INDEX `HigherStudyResearchProject_applicationDeadline_idx`(`applicationDeadline`),
    INDEX `HigherStudyResearchProject_featured_idx`(`featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudySupervisor` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `academicTitle` VARCHAR(100) NULL,
    `universityId` VARCHAR(30) NOT NULL,
    `department` VARCHAR(255) NULL,
    `publicProfileUrl` VARCHAR(2048) NULL,
    `researchAreaId` VARCHAR(30) NULL,
    `researchInterests` VARCHAR(500) NULL,
    `selectedPublications` LONGTEXT NULL,
    `currentProjects` LONGTEXT NULL,
    `acceptingStudents` BOOLEAN NOT NULL DEFAULT false,
    `applicationGuidance` LONGTEXT NULL,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HigherStudySupervisor_slug_key`(`slug`),
    INDEX `HigherStudySupervisor_universityId_idx`(`universityId`),
    INDEX `HigherStudySupervisor_researchAreaId_idx`(`researchAreaId`),
    INDEX `HigherStudySupervisor_acceptingStudents_idx`(`acceptingStudents`),
    INDEX `HigherStudySupervisor_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyResource` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(50) NULL,
    `summary` TEXT NULL,
    `content` LONGTEXT NULL,
    `author` VARCHAR(255) NULL,
    `reviewer` VARCHAR(255) NULL,
    `publishedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `readingTimeMinutes` INTEGER NULL,
    `tableOfContents` LONGTEXT NULL,
    `relatedUniversitySlugs` VARCHAR(500) NULL,
    `relatedCourseSlugs` VARCHAR(500) NULL,
    `relatedScholarshipSlugs` VARCHAR(500) NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HigherStudyResource_slug_key`(`slug`),
    INDEX `HigherStudyResource_category_idx`(`category`),
    INDEX `HigherStudyResource_featured_idx`(`featured`),
    INDEX `HigherStudyResource_verificationStatus_idx`(`verificationStatus`),
    INDEX `HigherStudyResource_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyStudentStory` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `studentName` VARCHAR(255) NOT NULL,
    `universityName` VARCHAR(255) NULL,
    `courseName` VARCHAR(255) NULL,
    `country` VARCHAR(100) NULL,
    `intake` VARCHAR(50) NULL,
    `story` LONGTEXT NULL,
    `advice` LONGTEXT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `publishedAt` DATETIME(3) NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HigherStudyStudentStory_slug_key`(`slug`),
    INDEX `HigherStudyStudentStory_featured_idx`(`featured`),
    INDEX `HigherStudyStudentStory_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyEvent` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` LONGTEXT NULL,
    `eventDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `location` VARCHAR(255) NULL,
    `organiser` VARCHAR(255) NULL,
    `registrationUrl` VARCHAR(2048) NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'upcoming',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HigherStudyEvent_slug_key`(`slug`),
    INDEX `HigherStudyEvent_eventDate_idx`(`eventDate`),
    INDEX `HigherStudyEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudySavedItem` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `sessionId` VARCHAR(64) NULL,
    `entityType` VARCHAR(30) NOT NULL,
    `entitySlug` VARCHAR(255) NOT NULL,
    `entityName` VARCHAR(255) NOT NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HigherStudySavedItem_userId_entityType_idx`(`userId`, `entityType`),
    INDEX `HigherStudySavedItem_sessionId_entityType_idx`(`sessionId`, `entityType`),
    UNIQUE INDEX `HigherStudySavedItem_userId_entityType_entitySlug_key`(`userId`, `entityType`, `entitySlug`),
    UNIQUE INDEX `HigherStudySavedItem_sessionId_entityType_entitySlug_key`(`sessionId`, `entityType`, `entitySlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyComparison` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `sessionId` VARCHAR(64) NULL,
    `entityType` VARCHAR(30) NOT NULL,
    `entitySlugs` VARCHAR(1000) NOT NULL,
    `name` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HigherStudyComparison_userId_entityType_idx`(`userId`, `entityType`),
    INDEX `HigherStudyComparison_sessionId_entityType_idx`(`sessionId`, `entityType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyReferral` (
    `id` VARCHAR(30) NOT NULL,
    `referralCode` VARCHAR(100) NOT NULL,
    `source` VARCHAR(100) NOT NULL DEFAULT 'ALAMINN_HIGHER_STUDY',
    `referralType` VARCHAR(50) NOT NULL,
    `targetUrl` VARCHAR(2048) NOT NULL,
    `countrySlug` VARCHAR(255) NULL,
    `universitySlug` VARCHAR(255) NULL,
    `courseSlug` VARCHAR(255) NULL,
    `scholarshipSlug` VARCHAR(255) NULL,
    `researchSlug` VARCHAR(255) NULL,
    `supervisorSlug` VARCHAR(255) NULL,
    `studyLevel` VARCHAR(50) NULL,
    `intake` VARCHAR(50) NULL,
    `campaignCode` VARCHAR(100) NULL,
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `consentVersion` VARCHAR(50) NULL,
    `consentTimestamp` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'created',
    `transferredAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `expiresAt` DATETIME(3) NULL,
    `ipHash` VARCHAR(64) NULL,
    `deviceCategory` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HigherStudyReferral_referralCode_key`(`referralCode`),
    INDEX `HigherStudyReferral_status_idx`(`status`),
    INDEX `HigherStudyReferral_createdAt_idx`(`createdAt`),
    INDEX `HigherStudyReferral_referralType_idx`(`referralType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyAlert` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `sessionId` VARCHAR(64) NULL,
    `email` VARCHAR(255) NULL,
    `whatsapp` VARCHAR(50) NULL,
    `entityType` VARCHAR(30) NOT NULL,
    `entitySlug` VARCHAR(255) NOT NULL,
    `entityName` VARCHAR(255) NOT NULL,
    `deadlineDate` DATETIME(3) NOT NULL,
    `alertChannel` VARCHAR(20) NOT NULL DEFAULT 'email',
    `alertSent` BOOLEAN NOT NULL DEFAULT false,
    `alertSentAt` DATETIME(3) NULL,
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `consentTimestamp` DATETIME(3) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HigherStudyAlert_userId_status_idx`(`userId`, `status`),
    INDEX `HigherStudyAlert_sessionId_status_idx`(`sessionId`, `status`),
    INDEX `HigherStudyAlert_deadlineDate_idx`(`deadlineDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyAuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `actorUserId` VARCHAR(30) NULL,
    `action` VARCHAR(50) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(30) NOT NULL,
    `entitySlug` VARCHAR(255) NULL,
    `beforeData` LONGTEXT NULL,
    `afterData` LONGTEXT NULL,
    `ipHash` VARCHAR(64) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HigherStudyAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `HigherStudyAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `HigherStudyAuditLog_createdAt_idx`(`createdAt`),
    INDEX `HigherStudyAuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HigherStudyImportJob` (
    `id` VARCHAR(30) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `fileType` VARCHAR(20) NOT NULL DEFAULT 'csv',
    `entityType` VARCHAR(30) NOT NULL,
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `processedRows` INTEGER NOT NULL DEFAULT 0,
    `successRows` INTEGER NOT NULL DEFAULT 0,
    `errorRows` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `dryRun` BOOLEAN NOT NULL DEFAULT false,
    `errors` LONGTEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HigherStudyImportJob_status_idx`(`status`),
    INDEX `HigherStudyImportJob_entityType_idx`(`entityType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningCourse` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT NULL,
    `description` LONGTEXT NULL,
    `level` VARCHAR(30) NOT NULL DEFAULT 'intermediate',
    `durationWeeks` INTEGER NULL,
    `hoursPerWeek` INTEGER NULL,
    `priceUsd` INTEGER NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `publicationStatus` VARCHAR(20) NOT NULL DEFAULT 'published',
    `lastVerifiedAt` DATETIME(3) NULL,
    `lastVerifiedBy` VARCHAR(30) NULL,
    `officialSourceUrl` VARCHAR(2048) NULL,
    `createdByUserId` VARCHAR(30) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `metaTitle` VARCHAR(255) NULL,
    `metaDescription` VARCHAR(500) NULL,
    `keywords` JSON NULL,
    `tags` JSON NULL,
    `heroImageUrl` VARCHAR(2048) NULL,
    `introVideoUrl` VARCHAR(2048) NULL,
    `syllabus` JSON NULL,
    `prerequisites` JSON NULL,
    `targetAudience` JSON NULL,
    `learningOutcomes` JSON NULL,
    `certificationType` VARCHAR(100) NULL,
    `passScore` INTEGER NULL,
    `enrollmentCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `EnglishLearningCourse_slug_key`(`slug`),
    INDEX `EnglishLearningCourse_level_idx`(`level`),
    INDEX `EnglishLearningCourse_isFeatured_idx`(`isFeatured`),
    INDEX `EnglishLearningCourse_isPublished_idx`(`isPublished`),
    INDEX `EnglishLearningCourse_verificationStatus_idx`(`verificationStatus`),
    INDEX `EnglishLearningCourse_publicationStatus_idx`(`publicationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningLesson` (
    `id` VARCHAR(30) NOT NULL,
    `courseId` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT NULL,
    `content` LONGTEXT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `durationMinutes` INTEGER NULL,
    `lessonType` VARCHAR(30) NOT NULL DEFAULT 'video',
    `videoUrl` VARCHAR(2048) NULL,
    `transcript` LONGTEXT NULL,
    `isFreePreview` BOOLEAN NOT NULL DEFAULT false,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EnglishLearningLesson_slug_key`(`slug`),
    INDEX `EnglishLearningLesson_courseId_idx`(`courseId`),
    INDEX `EnglishLearningLesson_lessonType_idx`(`lessonType`),
    INDEX `EnglishLearningLesson_isFreePreview_idx`(`isFreePreview`),
    INDEX `EnglishLearningLesson_isPublished_idx`(`isPublished`),
    INDEX `EnglishLearningLesson_orderIndex_idx`(`orderIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningPracticeTest` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `testType` VARCHAR(50) NOT NULL DEFAULT 'ielts-reading',
    `level` VARCHAR(30) NOT NULL DEFAULT 'intermediate',
    `durationMinutes` INTEGER NULL,
    `totalQuestions` INTEGER NOT NULL DEFAULT 0,
    `passingScore` INTEGER NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EnglishLearningPracticeTest_slug_key`(`slug`),
    INDEX `EnglishLearningPracticeTest_testType_idx`(`testType`),
    INDEX `EnglishLearningPracticeTest_level_idx`(`level`),
    INDEX `EnglishLearningPracticeTest_isPublished_idx`(`isPublished`),
    INDEX `EnglishLearningPracticeTest_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningQuestion` (
    `id` VARCHAR(30) NOT NULL,
    `testId` VARCHAR(30) NOT NULL,
    `questionType` VARCHAR(30) NOT NULL DEFAULT 'multiple-choice',
    `questionText` LONGTEXT NOT NULL,
    `options` JSON NULL,
    `correctAnswer` TEXT NULL,
    `explanation` LONGTEXT NULL,
    `points` INTEGER NOT NULL DEFAULT 1,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `skillArea` VARCHAR(30) NOT NULL DEFAULT 'reading',

    INDEX `EnglishLearningQuestion_testId_idx`(`testId`),
    INDEX `EnglishLearningQuestion_questionType_idx`(`questionType`),
    INDEX `EnglishLearningQuestion_skillArea_idx`(`skillArea`),
    INDEX `EnglishLearningQuestion_orderIndex_idx`(`orderIndex`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningTutor` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `bio` LONGTEXT NULL,
    `avatarUrl` VARCHAR(2048) NULL,
    `specialties` JSON NULL,
    `qualifications` JSON NULL,
    `yearsExperience` INTEGER NULL,
    `hourlyRateUsd` INTEGER NULL,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `reviewCount` INTEGER NOT NULL DEFAULT 0,
    `isAvailable` BOOLEAN NOT NULL DEFAULT true,
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `verificationStatus` VARCHAR(20) NOT NULL DEFAULT 'verified',
    `lastVerifiedAt` DATETIME(3) NULL,
    `officialProfileUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EnglishLearningTutor_slug_key`(`slug`),
    INDEX `EnglishLearningTutor_isAvailable_idx`(`isAvailable`),
    INDEX `EnglishLearningTutor_isPublished_idx`(`isPublished`),
    INDEX `EnglishLearningTutor_verificationStatus_idx`(`verificationStatus`),
    INDEX `EnglishLearningTutor_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningResource` (
    `id` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT NULL,
    `description` LONGTEXT NULL,
    `resourceType` VARCHAR(30) NOT NULL DEFAULT 'article',
    `url` VARCHAR(2048) NULL,
    `durationMinutes` INTEGER NULL,
    `readingTimeMinutes` INTEGER NULL,
    `level` VARCHAR(30) NOT NULL DEFAULT 'intermediate',
    `isPublished` BOOLEAN NOT NULL DEFAULT true,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `authorName` VARCHAR(255) NULL,
    `sourceName` VARCHAR(255) NULL,

    UNIQUE INDEX `EnglishLearningResource_slug_key`(`slug`),
    INDEX `EnglishLearningResource_resourceType_idx`(`resourceType`),
    INDEX `EnglishLearningResource_level_idx`(`level`),
    INDEX `EnglishLearningResource_isPublished_idx`(`isPublished`),
    INDEX `EnglishLearningResource_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningEnrollment` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `sessionId` VARCHAR(64) NOT NULL,
    `courseId` VARCHAR(30) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'enrolled',
    `progressPercent` INTEGER NOT NULL DEFAULT 0,
    `lastAccessedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EnglishLearningEnrollment_userId_idx`(`userId`),
    INDEX `EnglishLearningEnrollment_sessionId_idx`(`sessionId`),
    INDEX `EnglishLearningEnrollment_courseId_idx`(`courseId`),
    INDEX `EnglishLearningEnrollment_status_idx`(`status`),
    UNIQUE INDEX `EnglishLearningEnrollment_sessionId_courseId_key`(`sessionId`, `courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningProgress` (
    `id` VARCHAR(30) NOT NULL,
    `enrollmentId` VARCHAR(30) NOT NULL,
    `lessonId` VARCHAR(30) NULL,
    `testId` VARCHAR(30) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'not-started',
    `scorePercent` INTEGER NULL,
    `timeSpentMinutes` INTEGER NOT NULL DEFAULT 0,
    `lastAttemptAt` DATETIME(3) NULL,
    `attemptsCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EnglishLearningProgress_enrollmentId_idx`(`enrollmentId`),
    INDEX `EnglishLearningProgress_lessonId_idx`(`lessonId`),
    INDEX `EnglishLearningProgress_testId_idx`(`testId`),
    INDEX `EnglishLearningProgress_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningReferral` (
    `id` VARCHAR(30) NOT NULL,
    `referralCode` VARCHAR(100) NOT NULL,
    `referralType` VARCHAR(50) NOT NULL DEFAULT 'course-package',
    `sourceEntityId` VARCHAR(30) NULL,
    `sourceEntityType` VARCHAR(30) NULL,
    `targetUrl` VARCHAR(2048) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'created',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `ipHash` VARCHAR(64) NULL,
    `userAgent` VARCHAR(500) NULL,
    `notes` JSON NULL,

    UNIQUE INDEX `EnglishLearningReferral_referralCode_key`(`referralCode`),
    INDEX `EnglishLearningReferral_status_idx`(`status`),
    INDEX `EnglishLearningReferral_referralType_idx`(`referralType`),
    INDEX `EnglishLearningReferral_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningAuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `actorUserId` VARCHAR(30) NULL,
    `action` VARCHAR(50) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(30) NOT NULL,
    `beforeData` JSON NULL,
    `afterData` JSON NULL,
    `ipHash` VARCHAR(64) NULL,
    `userAgent` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EnglishLearningAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `EnglishLearningAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `EnglishLearningAuditLog_createdAt_idx`(`createdAt`),
    INDEX `EnglishLearningAuditLog_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishLearningSetting` (
    `id` VARCHAR(30) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `category` VARCHAR(50) NOT NULL DEFAULT 'general',
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EnglishLearningSetting_key_key`(`key`),
    INDEX `EnglishLearningSetting_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Inquiry` ADD CONSTRAINT `Inquiry_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inquiry` ADD CONSTRAINT `Inquiry_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Opportunity` ADD CONSTRAINT `Opportunity_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `Inquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Partnership` ADD CONSTRAINT `Partnership_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentReferral` ADD CONSTRAINT `StudentReferral_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentReferral` ADD CONSTRAINT `StudentReferral_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `Inquiry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Note` ADD CONSTRAINT `Note_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiTask` ADD CONSTRAINT `AiTask_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiApproval` ADD CONSTRAINT `AiApproval_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `AiTask`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiApproval` ADD CONSTRAINT `AiApproval_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyCity` ADD CONSTRAINT `HigherStudyCity_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `HigherStudyCountry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyUniversity` ADD CONSTRAINT `HigherStudyUniversity_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `HigherStudyCountry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyUniversity` ADD CONSTRAINT `HigherStudyUniversity_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `HigherStudyCity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyCourse` ADD CONSTRAINT `HigherStudyCourse_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `HigherStudyUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyCourse` ADD CONSTRAINT `HigherStudyCourse_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `HigherStudyCountry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyCourse` ADD CONSTRAINT `HigherStudyCourse_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `HigherStudySubject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyCourse` ADD CONSTRAINT `HigherStudyCourse_intakeId_fkey` FOREIGN KEY (`intakeId`) REFERENCES `HigherStudyIntake`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyScholarship` ADD CONSTRAINT `HigherStudyScholarship_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `HigherStudyCountry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyScholarship` ADD CONSTRAINT `HigherStudyScholarship_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `HigherStudyUniversity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyResearchProject` ADD CONSTRAINT `HigherStudyResearchProject_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `HigherStudyUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyResearchProject` ADD CONSTRAINT `HigherStudyResearchProject_researchAreaId_fkey` FOREIGN KEY (`researchAreaId`) REFERENCES `HigherStudyResearchArea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudyResearchProject` ADD CONSTRAINT `HigherStudyResearchProject_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `HigherStudySupervisor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudySupervisor` ADD CONSTRAINT `HigherStudySupervisor_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `HigherStudyUniversity`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HigherStudySupervisor` ADD CONSTRAINT `HigherStudySupervisor_researchAreaId_fkey` FOREIGN KEY (`researchAreaId`) REFERENCES `HigherStudyResearchArea`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnglishLearningLesson` ADD CONSTRAINT `EnglishLearningLesson_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `EnglishLearningCourse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnglishLearningQuestion` ADD CONSTRAINT `EnglishLearningQuestion_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `EnglishLearningPracticeTest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnglishLearningEnrollment` ADD CONSTRAINT `EnglishLearningEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `EnglishLearningCourse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnglishLearningProgress` ADD CONSTRAINT `EnglishLearningProgress_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `EnglishLearningEnrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnglishLearningProgress` ADD CONSTRAINT `EnglishLearningProgress_lessonId_fkey` FOREIGN KEY (`lessonId`) REFERENCES `EnglishLearningLesson`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnglishLearningProgress` ADD CONSTRAINT `EnglishLearningProgress_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `EnglishLearningPracticeTest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

