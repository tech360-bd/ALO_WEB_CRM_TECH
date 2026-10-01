-- ============================================================================
-- ALO Education — canonical database baseline (re-baselined 2026-10-01)
--
-- This migration is GENERATED from prisma/schema.prisma via:
--   prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
--
-- WHY A RE-BASELINE WAS NECESSARY
-- ===============================
-- The legacy migration chain (preserved verbatim in
-- prisma/legacy-migrations-20261001/ for forensic history) could NEVER be
-- applied to a fresh database:
--   * its first migration ALTERed EmployeeHR/EmployeeAttendance/
--     EmployeeLeaveBalance/EmployeeDocument before any migration created
--     EmployeeHR or EmployeeLeaveBalance;
--   * it contained 13 ALTER TABLE ... ADD COLUMN statements for columns that
--     earlier migrations had already created (e.g. EmployeeAttendance.clockIn,
--     User.phone, EmployeePayroll.employeeId);
--   * 76 models present in schema.prisma had no CREATE TABLE in any migration
--     (WhatsApp, Employee*, EnglishPrep*, Application*, Course catalog, Video*
--     and more), and 404 scalar columns were likewise never created.
-- The legacy chain was backfilled from partially-synchronized snapshots and
-- `prisma db push` states; no database was ever verified to have been built by
-- `prisma migrate deploy` through it (production deployment is externally
-- BLOCKED and never ran these migrations; see docs/REPOSITORY-BLOCKERS-2026-10-01.md).
--
-- BASELINING RULES FOR EXISTING DATABASES (if one is ever confirmed)
-- =================================================================
-- A database whose schema was maintained with `prisma db push` (schema-sync)
-- and never recorded these migrations must be baselined before using
-- `prisma migrate deploy`:
--   1. Take and verify a backup (scripts/backup-mysql.sh).
--   2. Verify schema parity:
--        prisma migrate diff --from-url <DATABASE_URL> \
--          --to-schema-datamodel prisma/schema.prisma --script
--      Any output must be reviewed and reconciled FIRST.
--   3. Mark this baseline as applied:
--        prisma migrate resolve --applied 0_init
--      (then also 20261001000001_hrm_holiday_baseline if the holiday rows
--      already exist).
--   4. Re-run `prisma migrate status` and confirm "Database schema is up to
--      date".
-- NEVER run `prisma migrate reset` against a database that contains data.
--
-- This file is the single source of truth for fresh installs. It must never be
-- edited by hand; schema changes belong in NEW migrations generated from
-- prisma/schema.prisma (see docs/MIGRATION-SAFETY-REPORT.md).
-- ============================================================================

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'student',
    `permissions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `actingAsRole` VARCHAR(191) NULL,
    `actingAsUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `mustChangePwd` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `partnerId` VARCHAR(191) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeploymentSequence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeploymentSequence_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `goal` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `strategy` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `banglaCaption` VARCHAR(191) NOT NULL DEFAULT '',
    `englishCaption` VARCHAR(191) NOT NULL DEFAULT '',
    `mixedCaption` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsappMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `messengerReply` VARCHAR(191) NOT NULL DEFAULT '',
    `emailCopy` VARCHAR(191) NOT NULL DEFAULT '',
    `smsCopy` VARCHAR(191) NOT NULL DEFAULT '',
    `posterPrompt` VARCHAR(191) NOT NULL DEFAULT '',
    `videoScript` VARCHAR(191) NOT NULL DEFAULT '',
    `voiceScript` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `thumbnailConcept` VARCHAR(191) NOT NULL DEFAULT '',
    `hashtags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `cta` VARCHAR(191) NOT NULL DEFAULT '',
    `landingPage` VARCHAR(191) NOT NULL DEFAULT '',
    `followUpSequence` VARCHAR(191) NOT NULL DEFAULT '[]',
    `commentReplies` VARCHAR(191) NOT NULL DEFAULT '[]',
    `dmQualification` VARCHAR(191) NOT NULL DEFAULT '',
    `brandCheck` BOOLEAN NOT NULL DEFAULT false,
    `metaPolicyCheck` BOOLEAN NOT NULL DEFAULT false,
    `safetyCheck` BOOLEAN NOT NULL DEFAULT false,
    `visaClaimCheck` BOOLEAN NOT NULL DEFAULT false,
    `leadsGenerated` INTEGER NOT NULL DEFAULT 0,
    `hotLeads` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `costPerLead` DOUBLE NOT NULL DEFAULT 0,
    `roi` DOUBLE NOT NULL DEFAULT 0,
    `topContent` VARCHAR(191) NOT NULL DEFAULT '[]',
    `weakContent` VARCHAR(191) NOT NULL DEFAULT '[]',
    `countryInterest` VARCHAR(191) NOT NULL DEFAULT '{}',
    `courseInterest` VARCHAR(191) NOT NULL DEFAULT '{}',
    `counselorConversion` VARCHAR(191) NOT NULL DEFAULT '{}',
    `targetCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `targetCourse` VARCHAR(191) NOT NULL DEFAULT '',
    `budget` DOUBLE NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingContentIdea` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `course` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarship` VARCHAR(191) NOT NULL DEFAULT '',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `audienceType` VARCHAR(191) NOT NULL DEFAULT '',
    `funnelStage` VARCHAR(191) NOT NULL DEFAULT 'awareness',
    `ideaType` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `trending` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingGeneratedContent` (
    `id` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL DEFAULT 'social_post',
    `topic` VARCHAR(191) NOT NULL DEFAULT '',
    `keywords` VARCHAR(191) NOT NULL DEFAULT '[]',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `tone` VARCHAR(191) NOT NULL DEFAULT 'professional',
    `cta` VARCHAR(191) NOT NULL DEFAULT '',
    `includeImage` BOOLEAN NOT NULL DEFAULT false,
    `includeVideo` BOOLEAN NOT NULL DEFAULT false,
    `variations` INTEGER NOT NULL DEFAULT 1,
    `approvalRequired` BOOLEAN NOT NULL DEFAULT true,
    `targetCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `targetCourse` VARCHAR(191) NOT NULL DEFAULT '',
    `targetStudentType` VARCHAR(191) NOT NULL DEFAULT '',
    `campaignId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `body` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `publishedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedById` VARCHAR(191) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingAsset` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'image',
    `url` VARCHAR(191) NOT NULL DEFAULT '',
    `thumbnail` VARCHAR(191) NOT NULL DEFAULT '',
    `platform` VARCHAR(191) NOT NULL DEFAULT '',
    `campaignId` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'generated',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'social',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `variables` VARCHAR(191) NOT NULL DEFAULT '[]',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingVideo` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `script` VARCHAR(191) NOT NULL DEFAULT '',
    `banglaVoice` VARCHAR(191) NOT NULL DEFAULT '',
    `englishVoice` VARCHAR(191) NOT NULL DEFAULT '',
    `mixedVoice` VARCHAR(191) NOT NULL DEFAULT '',
    `scenePlan` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `thumbnail` VARCHAR(191) NOT NULL DEFAULT '',
    `brandOverlay` BOOLEAN NOT NULL DEFAULT true,
    `aspectRatio` VARCHAR(191) NOT NULL DEFAULT '16:9',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingCalendar` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `campaignId` VARCHAR(191) NULL,
    `contentId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `scheduledAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `failReason` VARCHAR(191) NOT NULL DEFAULT '',
    `reminderSent` BOOLEAN NOT NULL DEFAULT false,
    `autoReminder` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingApproval` (
    `id` VARCHAR(191) NOT NULL,
    `itemType` VARCHAR(191) NOT NULL,
    `itemId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `requestedById` VARCHAR(191) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `rejectionNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingSocialMessage` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'comment',
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `externalId` VARCHAR(191) NOT NULL DEFAULT '',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `senderId` VARCHAR(191) NOT NULL DEFAULT '',
    `senderAvatar` VARCHAR(191) NOT NULL DEFAULT '',
    `message` VARCHAR(191) NOT NULL DEFAULT '',
    `messageRaw` VARCHAR(191) NOT NULL DEFAULT '',
    `intent` VARCHAR(191) NOT NULL DEFAULT '',
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `contactId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `suggestedReply` VARCHAR(191) NOT NULL DEFAULT '',
    `replySent` VARCHAR(191) NOT NULL DEFAULT '',
    `repliedAt` DATETIME(3) NULL,
    `convertedToLead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingDMThread` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'messenger',
    `externalThreadId` VARCHAR(191) NOT NULL DEFAULT '',
    `contactName` VARCHAR(191) NOT NULL DEFAULT '',
    `contactPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `contactId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `qualifyingQuestions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `responses` VARCHAR(191) NOT NULL DEFAULT '{}',
    `qualified` BOOLEAN NOT NULL DEFAULT false,
    `sentPortalLink` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingComment` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `postId` VARCHAR(191) NOT NULL DEFAULT '',
    `externalCommentId` VARCHAR(191) NOT NULL DEFAULT '',
    `authorName` VARCHAR(191) NOT NULL DEFAULT '',
    `authorId` VARCHAR(191) NOT NULL DEFAULT '',
    `text` VARCHAR(191) NOT NULL DEFAULT '',
    `intent` VARCHAR(191) NOT NULL DEFAULT '',
    `isLead` BOOLEAN NOT NULL DEFAULT false,
    `convertedToLead` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NULL,
    `contactId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `replyText` VARCHAR(191) NOT NULL DEFAULT '',
    `repliedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MarketingComment_platform_status_idx`(`platform`, `status`),
    INDEX `MarketingComment_leadId_idx`(`leadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingLead` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `destination` VARCHAR(191) NOT NULL DEFAULT '',
    `level` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `ieltsScore` DOUBLE NOT NULL DEFAULT 0,
    `pteScore` DOUBLE NOT NULL DEFAULT 0,
    `budget` VARCHAR(191) NOT NULL DEFAULT '',
    `consent` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceDetail` VARCHAR(191) NOT NULL DEFAULT '',
    `campaignId` VARCHAR(191) NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `hotLead` BOOLEAN NOT NULL DEFAULT false,
    `counselorId` VARCHAR(191) NULL,
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedAt` DATETIME(3) NULL,
    `followUpDueAt` DATETIME(3) NULL,
    `followUpDone` BOOLEAN NOT NULL DEFAULT false,
    `convertedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingLeadScore` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `factors` VARCHAR(191) NOT NULL DEFAULT '{}',
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingCampaignSource` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT '',
    `leads` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `cost` DOUBLE NOT NULL DEFAULT 0,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingReport` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'daily',
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `data` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingAgentJob` (
    `id` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `agentType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'idle',
    `input` VARCHAR(191) NOT NULL DEFAULT '{}',
    `output` VARCHAR(191) NOT NULL DEFAULT '',
    `error` VARCHAR(191) NOT NULL DEFAULT '',
    `duration` INTEGER NOT NULL DEFAULT 0,
    `ragEnabled` BOOLEAN NOT NULL DEFAULT true,
    `memoryUsed` BOOLEAN NOT NULL DEFAULT true,
    `protectedMode` BOOLEAN NOT NULL DEFAULT true,
    `permissionRequired` BOOLEAN NOT NULL DEFAULT false,
    `approvalId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingAgentMemory` (
    `id` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userName` VARCHAR(191) NOT NULL DEFAULT '',
    `role` VARCHAR(191) NOT NULL DEFAULT '',
    `actingAsRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL DEFAULT '',
    `resourceId` VARCHAR(191) NOT NULL DEFAULT '',
    `details` VARCHAR(191) NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingRagSource` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'document',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `filePath` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `chunkCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingRagChunk` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `embedding` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingImprovementProposal` (
    `id` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `impact` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'proposed',
    `implementedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialConnectedAccount` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL DEFAULT '',
    `avatar` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'connected',
    `lastSyncAt` DATETIME(3) NULL,
    `tokenRef` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `error` VARCHAR(191) NOT NULL DEFAULT '',
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `password` VARCHAR(191) NOT NULL DEFAULT '',
    `userType` VARCHAR(191) NOT NULL DEFAULT 'ALO_FULL_STUDENT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `profileComplete` INTEGER NOT NULL DEFAULT 0,
    `journeyStage` VARCHAR(191) NOT NULL DEFAULT 'lead_created',
    `currentCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `currentCity` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorId` VARCHAR(191) NULL,
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `otpCode` VARCHAR(191) NOT NULL DEFAULT '',
    `otpExpiresAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `suspended` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `leadId` VARCHAR(191) NULL,

    UNIQUE INDEX `Student_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentProfileSection` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'incomplete',
    `data` VARCHAR(191) NOT NULL DEFAULT '{}',
    `completedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentEducation` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NOT NULL DEFAULT '',
    `degree` VARCHAR(191) NOT NULL DEFAULT '',
    `field` VARCHAR(191) NOT NULL DEFAULT '',
    `gpa` VARCHAR(191) NOT NULL DEFAULT '',
    `startYear` VARCHAR(191) NOT NULL DEFAULT '',
    `endYear` VARCHAR(191) NOT NULL DEFAULT '',
    `transcriptUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `certificateUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentPassport` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `passportNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `fullName` VARCHAR(191) NOT NULL DEFAULT '',
    `nationality` VARCHAR(191) NOT NULL DEFAULT '',
    `dateOfBirth` VARCHAR(191) NOT NULL DEFAULT '',
    `expiryDate` VARCHAR(191) NOT NULL DEFAULT '',
    `issueDate` VARCHAR(191) NOT NULL DEFAULT '',
    `passportUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentEnglishTest` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `testType` VARCHAR(191) NOT NULL,
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `readingScore` DOUBLE NOT NULL DEFAULT 0,
    `writingScore` DOUBLE NOT NULL DEFAULT 0,
    `listeningScore` DOUBLE NOT NULL DEFAULT 0,
    `speakingScore` DOUBLE NOT NULL DEFAULT 0,
    `testDate` VARCHAR(191) NOT NULL DEFAULT '',
    `certificateUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentWorkExperience` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL DEFAULT '',
    `position` VARCHAR(191) NOT NULL DEFAULT '',
    `startDate` VARCHAR(191) NOT NULL DEFAULT '',
    `endDate` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `letterUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentRecommendation` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `refereeName` VARCHAR(191) NOT NULL DEFAULT '',
    `refereePosition` VARCHAR(191) NOT NULL DEFAULT '',
    `refereeEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `refereeOrg` VARCHAR(191) NOT NULL DEFAULT '',
    `letterUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentVisaHistory` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `visaType` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT '',
    `refusalReason` VARCHAR(191) NOT NULL DEFAULT '',
    `appliedDate` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentFunding` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `fundingType` VARCHAR(191) NOT NULL DEFAULT 'self',
    `sponsorName` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorRelation` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorIncome` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorBank` VARCHAR(191) NOT NULL DEFAULT '',
    `bankStatementUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorDocUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentAdmissionPreference` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `preferredCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredCourse` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredIntake` VARCHAR(191) NOT NULL DEFAULT '',
    `budgetRange` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipNeed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(191) NOT NULL,
    `applicationCode` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NULL DEFAULT '',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationOfficer` VARCHAR(191) NOT NULL DEFAULT '',
    `appTeamOfficerId` VARCHAR(191) NULL DEFAULT '',
    `visaOfficerId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `campusId` VARCHAR(191) NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `intakeId` VARCHAR(191) NULL DEFAULT '',
    `level` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationSource` VARCHAR(191) NOT NULL DEFAULT 'DIRECT_ALO_APPLICATION',
    `sourceVisibility` VARCHAR(191) NOT NULL DEFAULT 'public_safe',
    `isB2b` BOOLEAN NOT NULL DEFAULT false,
    `isB2bConfidential` BOOLEAN NOT NULL DEFAULT false,
    `b2bType` VARCHAR(191) NULL DEFAULT '',
    `b2bProviderId` VARCHAR(191) NULL DEFAULT '',
    `stage` VARCHAR(191) NOT NULL DEFAULT 'APPLICATION_DRAFT',
    `safeStatus` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `reviewStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `documentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `offerStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `casI20CoeStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `visaHandoverStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_READY',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `deadlineDate` DATETIME(3) NULL,
    `applicationFeeStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `depositStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `slaStatus` VARCHAR(191) NOT NULL DEFAULT 'ON_TRACK',
    `createdBy` VARCHAR(191) NULL DEFAULT '',
    `updatedBy` VARCHAR(191) NULL DEFAULT '',
    `notes` TEXT NOT NULL DEFAULT '',
    `internalNotes` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Application_applicationCode_key`(`applicationCode`),
    INDEX `Application_studentId_idx`(`studentId`),
    INDEX `Application_partnerId_idx`(`partnerId`),
    INDEX `Application_counselorId_idx`(`counselorId`),
    INDEX `Application_applicationOfficer_idx`(`applicationOfficer`),
    INDEX `Application_universityId_idx`(`universityId`),
    INDEX `Application_courseId_idx`(`courseId`),
    INDEX `Application_applicationSource_idx`(`applicationSource`),
    INDEX `Application_isB2b_idx`(`isB2b`),
    INDEX `Application_b2bProviderId_idx`(`b2bProviderId`),
    INDEX `Application_stage_idx`(`stage`),
    INDEX `Application_safeStatus_idx`(`safeStatus`),
    INDEX `Application_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationStageHistory` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `actor` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentDocument` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_uploaded',
    `version` INTEGER NOT NULL DEFAULT 1,
    `previousVersionId` VARCHAR(191) NOT NULL DEFAULT '',
    `rejectionReason` TEXT NOT NULL DEFAULT '',
    `reviewerNote` TEXT NOT NULL DEFAULT '',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentDocument_studentId_idx`(`studentId`),
    INDEX `StudentDocument_caseId_idx`(`caseId`),
    INDEX `StudentDocument_status_idx`(`status`),
    INDEX `StudentDocument_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentMessage` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `senderType` VARCHAR(191) NOT NULL DEFAULT 'student',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `message` VARCHAR(191) NOT NULL DEFAULT '',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'portal',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimelineEvent` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `actor` VARCHAR(191) NOT NULL DEFAULT 'system',
    `actionUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `leadId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT '',
    `meta` VARCHAR(191) NOT NULL DEFAULT '{}',
    `userId` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Appointment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'counseling',
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `scheduledAt` DATETIME(3) NOT NULL,
    `meetLink` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedCourse` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseName` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `tuitionFee` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseComparison` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `comparisonData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScholarshipMatch` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipName` VARCHAR(191) NOT NULL DEFAULT '',
    `coverage` VARCHAR(191) NOT NULL DEFAULT '',
    `eligibility` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SopDraft` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `reviewRequested` BOOLEAN NOT NULL DEFAULT false,
    `reviewerNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CvReview` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `cvUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `feedback` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnglishTest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `duration` INTEGER NOT NULL DEFAULT 120,
    `sections` VARCHAR(191) NOT NULL DEFAULT '[]',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockTest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `testType` VARCHAR(191) NOT NULL,
    `isFree` BOOLEAN NOT NULL DEFAULT false,
    `price` DOUBLE NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 120,
    `sections` VARCHAR(191) NOT NULL DEFAULT '[]',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestSession` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `mockTestId` VARCHAR(191) NULL,
    `testType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `section` VARCHAR(191) NOT NULL,
    `questionNum` INTEGER NOT NULL,
    `answer` VARCHAR(191) NOT NULL DEFAULT '',
    `isCorrect` BOOLEAN NOT NULL DEFAULT false,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestResult` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `listeningScore` DOUBLE NOT NULL DEFAULT 0,
    `readingScore` DOUBLE NOT NULL DEFAULT 0,
    `writingScore` DOUBLE NOT NULL DEFAULT 0,
    `speakingScore` DOUBLE NOT NULL DEFAULT 0,
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `bandEstimate` VARCHAR(191) NOT NULL DEFAULT '',
    `weakAreas` VARCHAR(191) NOT NULL DEFAULT '[]',
    `strengths` VARCHAR(191) NOT NULL DEFAULT '[]',
    `aiFeedback` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TestResult_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiExamFeedback` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `taskAchievement` VARCHAR(191) NOT NULL DEFAULT '',
    `coherence` VARCHAR(191) NOT NULL DEFAULT '',
    `lexicalResource` VARCHAR(191) NOT NULL DEFAULT '',
    `grammar` VARCHAR(191) NOT NULL DEFAULT '',
    `improvementPlan` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AiExamFeedback_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiInterviewSession` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL DEFAULT '',
    `interviewType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `readinessScore` DOUBLE NOT NULL DEFAULT 0,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'needs_practice',
    `transcript` LONGTEXT NOT NULL DEFAULT '[]',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `audioUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `videoUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiInterviewSession_studentId_idx`(`studentId`),
    INDEX `AiInterviewSession_caseId_idx`(`caseId`),
    INDEX `AiInterviewSession_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiInterviewAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL DEFAULT '',
    `followUp` TEXT NOT NULL DEFAULT '',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `feedback` TEXT NOT NULL DEFAULT '',
    `audioUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `videoUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `transcript` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiInterviewAnswer_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiInterviewResult` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `communicationClarity` DOUBLE NOT NULL DEFAULT 0,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `courseKnowledge` DOUBLE NOT NULL DEFAULT 0,
    `universityKnowledge` DOUBLE NOT NULL DEFAULT 0,
    `countryKnowledge` DOUBLE NOT NULL DEFAULT 0,
    `financialExplanation` DOUBLE NOT NULL DEFAULT 0,
    `sponsorExplanation` DOUBLE NOT NULL DEFAULT 0,
    `studyGapExplanation` DOUBLE NOT NULL DEFAULT 0,
    `futurePlanClarity` DOUBLE NOT NULL DEFAULT 0,
    `refusalExplanation` DOUBLE NOT NULL DEFAULT 0,
    `documentReadiness` DOUBLE NOT NULL DEFAULT 0,
    `visaRisk` DOUBLE NOT NULL DEFAULT 0,
    `overallReadiness` DOUBLE NOT NULL DEFAULT 0,
    `verdict` VARCHAR(191) NOT NULL DEFAULT 'needs_practice',
    `finalFeedback` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiInterviewResult_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockTestCredit` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `totalCredits` INTEGER NOT NULL DEFAULT 3,
    `usedCredits` INTEGER NOT NULL DEFAULT 0,
    `source` VARCHAR(191) NOT NULL DEFAULT 'free',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockTestPayment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL DEFAULT '',
    `packageName` VARCHAR(191) NOT NULL DEFAULT '',
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `creditsAdded` INTEGER NOT NULL DEFAULT 0,
    `transactionId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MockTestPackage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `credits` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaChecklistItem` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `caseId` VARCHAR(191) NOT NULL DEFAULT '',
    `item` VARCHAR(191) NOT NULL,
    `documentName` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `isRequired` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `deadline` DATETIME(3) NULL,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewerNote` VARCHAR(191) NOT NULL DEFAULT '',
    `studentVisible` BOOLEAN NOT NULL DEFAULT true,
    `counselorVisible` BOOLEAN NOT NULL DEFAULT true,
    `archivedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaChecklistItem_studentId_idx`(`studentId`),
    INDEX `VisaChecklistItem_caseId_idx`(`caseId`),
    INDEX `VisaChecklistItem_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaReadinessReport` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `visaCaseId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `documentsReady` INTEGER NOT NULL DEFAULT 0,
    `documentsTotal` INTEGER NOT NULL DEFAULT 0,
    `interviewReady` BOOLEAN NOT NULL DEFAULT false,
    `riskFactors` VARCHAR(191) NOT NULL DEFAULT '[]',
    `recommendation` VARCHAR(191) NOT NULL DEFAULT '',
    `breakdown` VARCHAR(191) NOT NULL DEFAULT '{}',
    `whatIsStrong` VARCHAR(191) NOT NULL DEFAULT '[]',
    `whatIsWeak` VARCHAR(191) NOT NULL DEFAULT '[]',
    `missing` VARCHAR(191) NOT NULL DEFAULT '[]',
    `nextAction` VARCHAR(191) NOT NULL DEFAULT '',
    `responsible` VARCHAR(191) NOT NULL DEFAULT '',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaReadinessReport_visaCaseId_idx`(`visaCaseId`),
    INDEX `VisaReadinessReport_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportBatch` (
    `id` VARCHAR(191) NOT NULL,
    `sourceCrmName` VARCHAR(191) NOT NULL DEFAULT 'Old CRM',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `totalRows` INTEGER NOT NULL DEFAULT 0,
    `newCount` INTEGER NOT NULL DEFAULT 0,
    `matchedCount` INTEGER NOT NULL DEFAULT 0,
    `duplicateCount` INTEGER NOT NULL DEFAULT 0,
    `errorCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending_review',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportStagingStudent` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `oldCrmId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentName` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsapp` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `passportNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `dateOfBirth` VARCHAR(191) NOT NULL DEFAULT '',
    `countryInterest` VARCHAR(191) NOT NULL DEFAULT '',
    `courseInterest` VARCHAR(191) NOT NULL DEFAULT '',
    `universityInterest` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationStatus` VARCHAR(191) NOT NULL DEFAULT 'new',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `documentsJson` VARCHAR(191) NOT NULL DEFAULT '[]',
    `notesJson` VARCHAR(191) NOT NULL DEFAULT '[]',
    `communicationJson` VARCHAR(191) NOT NULL DEFAULT '[]',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `visaStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `createdDate` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedDate` VARCHAR(191) NOT NULL DEFAULT '',
    `matchedStudentId` VARCHAR(191) NOT NULL DEFAULT '',
    `duplicateRiskLevel` VARCHAR(191) NOT NULL DEFAULT 'none',
    `status` VARCHAR(191) NOT NULL DEFAULT 'staging',
    `errorDetails` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityUpdateRequest` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `entityType` VARCHAR(191) NOT NULL DEFAULT 'course',
    `entityName` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` VARCHAR(191) NOT NULL DEFAULT '',
    `newValue` VARCHAR(191) NOT NULL DEFAULT '',
    `evidenceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `aiConfidence` DOUBLE NOT NULL DEFAULT 0.9,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending_approval',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaCase` (
    `id` VARCHAR(191) NOT NULL,
    `caseCode` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL,
    `studentName` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `destinationCountry` VARCHAR(191) NOT NULL DEFAULT 'UK',
    `university` VARCHAR(191) NOT NULL DEFAULT '',
    `course` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `currentStage` VARCHAR(191) NOT NULL DEFAULT 'not_started',
    `readinessScore` DOUBLE NOT NULL DEFAULT 0,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'low',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationOfficerId` VARCHAR(191) NOT NULL DEFAULT '',
    `visaOfficerId` VARCHAR(191) NOT NULL DEFAULT '',
    `visaOfficerName` VARCHAR(191) NOT NULL DEFAULT '',
    `isUrgent` BOOLEAN NOT NULL DEFAULT false,
    `nextAction` VARCHAR(191) NOT NULL DEFAULT '',
    `responsible` VARCHAR(191) NOT NULL DEFAULT '',
    `deadline` DATETIME(3) NULL,
    `whatIsStrong` VARCHAR(191) NOT NULL DEFAULT '[]',
    `whatIsWeak` VARCHAR(191) NOT NULL DEFAULT '[]',
    `missing` VARCHAR(191) NOT NULL DEFAULT '[]',
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaCase_studentId_idx`(`studentId`),
    INDEX `VisaCase_visaOfficerId_idx`(`visaOfficerId`),
    INDEX `VisaCase_counselorId_idx`(`counselorId`),
    INDEX `VisaCase_currentStage_idx`(`currentStage`),
    INDEX `VisaCase_riskLevel_idx`(`riskLevel`),
    INDEX `VisaCase_readinessScore_idx`(`readinessScore`),
    INDEX `VisaCase_destinationCountry_idx`(`destinationCountry`),
    INDEX `VisaCase_university_idx`(`university`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaInterview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `interviewType` VARCHAR(191) NOT NULL DEFAULT 'embassy_mock',
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'standard',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `scheduledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `verdict` VARCHAR(191) NOT NULL DEFAULT 'needs_practice',
    `readiness` VARCHAR(191) NOT NULL DEFAULT 'HUMAN_REVIEW_REQUIRED',
    `officerNotes` VARCHAR(191) NOT NULL DEFAULT '',
    `studentFeedback` VARCHAR(191) NOT NULL DEFAULT '',
    `finalAssessment` VARCHAR(191) NOT NULL DEFAULT '',
    `strengths` VARCHAR(191) NOT NULL DEFAULT '',
    `weaknesses` VARCHAR(191) NOT NULL DEFAULT '',
    `improvements` VARCHAR(191) NOT NULL DEFAULT '',
    `documentsRequired` VARCHAR(191) NOT NULL DEFAULT '',
    `secondInterview` BOOLEAN NOT NULL DEFAULT false,
    `escalation` BOOLEAN NOT NULL DEFAULT false,
    `officerId` VARCHAR(191) NOT NULL DEFAULT '',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaInterview_caseId_idx`(`caseId`),
    INDEX `VisaInterview_studentId_idx`(`studentId`),
    INDEX `VisaInterview_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaInterviewQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `interviewId` VARCHAR(191) NOT NULL DEFAULT '',
    `caseId` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `questionType` VARCHAR(191) NOT NULL DEFAULT 'open_ended',
    `researchLabel` VARCHAR(191) NOT NULL DEFAULT 'Practice',
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'standard',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `followUps` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaInterviewQuestion_interviewId_idx`(`interviewId`),
    INDEX `VisaInterviewQuestion_caseId_idx`(`caseId`),
    INDEX `VisaInterviewQuestion_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaInterviewAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `interviewId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL DEFAULT '',
    `question` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL DEFAULT '',
    `followUp` VARCHAR(191) NOT NULL DEFAULT '',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `feedback` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `aiAnalysis` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaInterviewAnswer_interviewId_idx`(`interviewId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaMockResult` (
    `id` VARCHAR(191) NOT NULL,
    `interviewId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT 'UK',
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'standard',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `verdict` VARCHAR(191) NOT NULL DEFAULT 'needs_practice',
    `feedback` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `VisaMockResult_interviewId_key`(`interviewId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaOfficerNote` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `officerId` VARCHAR(191) NOT NULL,
    `officerName` VARCHAR(191) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'internal_only',
    `commentType` VARCHAR(191) NOT NULL DEFAULT 'officer_note',
    `riskFlag` VARCHAR(191) NOT NULL DEFAULT 'none',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaOfficerNote_caseId_idx`(`caseId`),
    INDEX `VisaOfficerNote_studentId_idx`(`studentId`),
    INDEX `VisaOfficerNote_visibility_idx`(`visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaRiskAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `fundingRisk` VARCHAR(191) NOT NULL DEFAULT 'low',
    `studyGapRisk` VARCHAR(191) NOT NULL DEFAULT 'low',
    `refusalRisk` VARCHAR(191) NOT NULL DEFAULT 'low',
    `sensitiveRisk` VARCHAR(191) NOT NULL DEFAULT 'low',
    `overallRiskLevel` VARCHAR(191) NOT NULL DEFAULT 'low',
    `officerVerdict` VARCHAR(191) NOT NULL DEFAULT 'review_pending',
    `humanReviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaRiskAssessment_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaFundingReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `fundingStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `sponsor` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorRelation` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorOccupation` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorIncome` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceOfFund` VARCHAR(191) NOT NULL DEFAULT '',
    `hasBankStatement` BOOLEAN NOT NULL DEFAULT false,
    `hasSolvencyCert` BOOLEAN NOT NULL DEFAULT false,
    `sourceOfFundExplanation` TEXT NOT NULL DEFAULT '',
    `riskWarning` VARCHAR(191) NOT NULL DEFAULT 'none',
    `tuitionDeposit` VARCHAR(191) NOT NULL DEFAULT '',
    `livingCostPlan` TEXT NOT NULL DEFAULT '',
    `dependents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sponsorDocuments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaFundingReview_caseId_key`(`caseId`),
    INDEX `VisaFundingReview_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaStudyGapReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `hasStudyGap` BOOLEAN NOT NULL DEFAULT false,
    `gapDurationMonths` INTEGER NOT NULL DEFAULT 0,
    `gapFrom` VARCHAR(191) NOT NULL DEFAULT '',
    `gapTo` VARCHAR(191) NOT NULL DEFAULT '',
    `gapPurpose` TEXT NOT NULL DEFAULT '',
    `workExpDuringGap` TEXT NOT NULL DEFAULT '',
    `explanationClarity` VARCHAR(191) NOT NULL DEFAULT 'clear',
    `riskFlag` VARCHAR(191) NOT NULL DEFAULT 'low',
    `supportingDocuments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `employmentDetails` TEXT NOT NULL DEFAULT '',
    `trainingDetails` TEXT NOT NULL DEFAULT '',
    `familyReason` TEXT NOT NULL DEFAULT '',
    `medicalReason` TEXT NOT NULL DEFAULT '',
    `visaReason` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaStudyGapReview_caseId_key`(`caseId`),
    INDEX `VisaStudyGapReview_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaRefusalReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `hasVisaRefusal` BOOLEAN NOT NULL DEFAULT false,
    `refusalCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `visaType` VARCHAR(191) NOT NULL DEFAULT '',
    `refusalDate` VARCHAR(191) NOT NULL DEFAULT '',
    `refusalReason` TEXT NOT NULL DEFAULT '',
    `refusalLetterUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `previousApplication` TEXT NOT NULL DEFAULT '',
    `improvementPlan` TEXT NOT NULL DEFAULT '',
    `newExplanation` TEXT NOT NULL DEFAULT '',
    `officerNote` TEXT NOT NULL DEFAULT '',
    `previousRefusalCount` INTEGER NOT NULL DEFAULT 0,
    `humanReviewStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaRefusalReview_caseId_key`(`caseId`),
    INDEX `VisaRefusalReview_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaSensitiveReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `seriousMedicalCondition` BOOLEAN NOT NULL DEFAULT false,
    `medicalExplanation` TEXT NOT NULL DEFAULT '',
    `medicalDocumentUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `criminalOffense` BOOLEAN NOT NULL DEFAULT false,
    `criminalExplanation` TEXT NOT NULL DEFAULT '',
    `criminalDocumentUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officerInternalNote` TEXT NOT NULL DEFAULT '',
    `studentSafeNote` TEXT NOT NULL DEFAULT '',
    `humanReviewRequired` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaSensitiveReview_caseId_key`(`caseId`),
    INDEX `VisaSensitiveReview_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaStudentFeedback` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `supportiveText` VARCHAR(191) NOT NULL,
    `nextSteps` VARCHAR(191) NOT NULL DEFAULT '',
    `missingDocs` VARCHAR(191) NOT NULL DEFAULT '[]',
    `practiceTips` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `isSentToStudent` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaTask` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `taskType` VARCHAR(191) NOT NULL DEFAULT 'document_request',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT '',
    `assignedTo` VARCHAR(191) NOT NULL DEFAULT '',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `dueDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `archivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaTask_caseId_idx`(`caseId`),
    INDEX `VisaTask_studentId_idx`(`studentId`),
    INDEX `VisaTask_status_idx`(`status`),
    INDEX `VisaTask_assignedTo_idx`(`assignedTo`),
    INDEX `VisaTask_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaReport` (
    `id` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL DEFAULT 'daily_interview',
    `generatedBy` VARCHAR(191) NOT NULL,
    `generatedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `filters` VARCHAR(191) NOT NULL DEFAULT '{}',
    `data` LONGTEXT NOT NULL DEFAULT '{}',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `format` VARCHAR(191) NOT NULL DEFAULT 'json',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ready',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaReport_reportType_idx`(`reportType`),
    INDEX `VisaReport_generatedBy_idx`(`generatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiStudentMemory` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InboundMessage` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `senderPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `senderEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `message` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `intent` VARCHAR(191) NOT NULL DEFAULT '',
    `aiResponse` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'processed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorType` VARCHAR(191) NOT NULL DEFAULT 'student',
    `actorName` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL DEFAULT '',
    `resourceId` VARCHAR(191) NOT NULL DEFAULT '',
    `details` VARCHAR(191) NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'info',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloStudent` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `studentType` VARCHAR(191) NOT NULL DEFAULT 'alo_full',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `password` VARCHAR(191) NOT NULL DEFAULT '',
    `dateOfBirth` VARCHAR(191) NOT NULL DEFAULT '',
    `gender` VARCHAR(191) NOT NULL DEFAULT '',
    `nationality` VARCHAR(191) NOT NULL DEFAULT 'Bangladeshi',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `profileCompletion` INTEGER NOT NULL DEFAULT 0,
    `passportNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `passportExpiry` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTestType` VARCHAR(191) NOT NULL DEFAULT 'IELTS',
    `englishTestScore` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTestDate` VARCHAR(191) NOT NULL DEFAULT '',
    `highestEducation` VARCHAR(191) NOT NULL DEFAULT '',
    `institution` VARCHAR(191) NOT NULL DEFAULT '',
    `gpa` VARCHAR(191) NOT NULL DEFAULT '',
    `graduationYear` VARCHAR(191) NOT NULL DEFAULT '',
    `workExperience` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingSource` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredCourse` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredIntake` VARCHAR(191) NOT NULL DEFAULT '',
    `englishCredits` INTEGER NOT NULL DEFAULT 3,
    `englishCreditsUsed` INTEGER NOT NULL DEFAULT 1,
    `aiInterviewScore` VARCHAR(191) NOT NULL DEFAULT '',
    `visaReadinessScore` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AloStudent_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloDocument` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_uploaded',
    `uploadedAt` DATETIME(3) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloApplication` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `level` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `stage` VARCHAR(191) NOT NULL DEFAULT 'research',
    `stageProgress` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `appliedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloMessage` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `senderType` VARCHAR(191) NOT NULL DEFAULT 'student',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloAppointment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'counseling',
    `date` VARCHAR(191) NOT NULL DEFAULT '',
    `time` VARCHAR(191) NOT NULL DEFAULT '',
    `duration` VARCHAR(191) NOT NULL DEFAULT '30 minutes',
    `status` VARCHAR(191) NOT NULL DEFAULT 'upcoming',
    `counselor` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloPayment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `dueDate` VARCHAR(191) NOT NULL DEFAULT '',
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloSop` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `university` VARCHAR(191) NOT NULL DEFAULT '',
    `course` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AloEnglishTest` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `testType` VARCHAR(191) NOT NULL DEFAULT 'mock',
    `listeningScore` VARCHAR(191) NOT NULL DEFAULT '',
    `readingScore` VARCHAR(191) NOT NULL DEFAULT '',
    `writingScore` VARCHAR(191) NOT NULL DEFAULT '',
    `speakingScore` VARCHAR(191) NOT NULL DEFAULT '',
    `overallScore` VARCHAR(191) NOT NULL DEFAULT '',
    `bandScore` VARCHAR(191) NOT NULL DEFAULT '',
    `takenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `duration` INTEGER NOT NULL DEFAULT 0,
    `answers` VARCHAR(191) NOT NULL DEFAULT '{}',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmUniversity` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `universityCode` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `logo` VARCHAR(191) NOT NULL DEFAULT '',
    `logoSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `website` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `ranking` INTEGER NOT NULL DEFAULT 0,
    `worldRanking` INTEGER NOT NULL DEFAULT 0,
    `rankingSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `rankingProvider` VARCHAR(191) NOT NULL DEFAULT '',
    `rankingYear` INTEGER NOT NULL DEFAULT 0,
    `rankingValue` VARCHAR(191) NOT NULL DEFAULT '',
    `rankingBand` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `state` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `campusName` VARCHAR(191) NOT NULL DEFAULT '',
    `campuses` VARCHAR(191) NOT NULL DEFAULT '[]',
    `type` VARCHAR(191) NOT NULL DEFAULT 'Public',
    `founded` INTEGER NOT NULL DEFAULT 0,
    `students` VARCHAR(191) NOT NULL DEFAULT '',
    `intlStudents` VARCHAR(191) NOT NULL DEFAULT '',
    `ieltsMin` DOUBLE NOT NULL DEFAULT 0,
    `tuitionRange` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarships` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `overview` TEXT NOT NULL DEFAULT '',
    `publicDescription` TEXT NOT NULL DEFAULT '',
    `partnerDescription` TEXT NOT NULL DEFAULT '',
    `internationalStudentUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialInternationalAdmissionsUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialCourseSearchUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialTuitionFeeUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialScholarshipUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `contactEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `admissionNotes` TEXT NOT NULL DEFAULT '',
    `heroImageSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `mediaUsagePermissionStatus` VARCHAR(191) NOT NULL DEFAULT 'not_requested',
    `internationalStudentSupportSummary` VARCHAR(191) NULL DEFAULT '',
    `sourceUrls` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `lastVerifiedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `lastApprovedUpdateAt` VARCHAR(191) NOT NULL DEFAULT '',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `aliases` VARCHAR(191) NOT NULL DEFAULT '[]',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'needs_official_source',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmUniversity_universityId_key`(`universityId`),
    INDEX `CrmUniversity_countryId_idx`(`countryId`),
    INDEX `CrmUniversity_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCourse` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseCode` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL,
    `campusId` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `studyLevelId` VARCHAR(191) NOT NULL DEFAULT '',
    `studyAreaId` VARCHAR(191) NOT NULL DEFAULT '',
    `disciplineId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseTitle` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL DEFAULT '',
    `qualification` VARCHAR(191) NOT NULL DEFAULT '',
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `programLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `subjectArea` VARCHAR(191) NOT NULL DEFAULT '',
    `disciplineArea` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `campus` VARCHAR(191) NOT NULL DEFAULT '',
    `deliveryMode` VARCHAR(191) NOT NULL DEFAULT '',
    `degreeType` VARCHAR(191) NOT NULL DEFAULT '',
    `attendanceMode` VARCHAR(191) NOT NULL DEFAULT '',
    `placementOption` BOOLEAN NOT NULL DEFAULT false,
    `workPlacementAvailable` BOOLEAN NOT NULL DEFAULT false,
    `internshipAvailable` BOOLEAN NOT NULL DEFAULT false,
    `coOpAvailable` BOOLEAN NOT NULL DEFAULT false,
    `sandwichYearOption` BOOLEAN NOT NULL DEFAULT false,
    `pathwayStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `onlineOption` BOOLEAN NOT NULL DEFAULT false,
    `partTimeOption` BOOLEAN NOT NULL DEFAULT false,
    `internationalEligibility` VARCHAR(191) NOT NULL DEFAULT 'not_verified',
    `officialUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialApplicationUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `durationMonths` INTEGER NOT NULL DEFAULT 0,
    `tuitionFee` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'GBP',
    `applicationFee` DOUBLE NOT NULL DEFAULT 0,
    `depositAmount` DOUBLE NOT NULL DEFAULT 0,
    `averageScholarship` DOUBLE NOT NULL DEFAULT 0,
    `minScholarship` DOUBLE NOT NULL DEFAULT 0,
    `maxScholarship` DOUBLE NOT NULL DEFAULT 0,
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `rankingNote` TEXT NOT NULL DEFAULT '',
    `careerOutcomes` TEXT NOT NULL DEFAULT '',
    `highDemand` BOOLEAN NOT NULL DEFAULT false,
    `fastOffer` BOOLEAN NOT NULL DEFAULT false,
    `highAcceptance` BOOLEAN NOT NULL DEFAULT false,
    `lowDeposit` BOOLEAN NOT NULL DEFAULT false,
    `noInterview` BOOLEAN NOT NULL DEFAULT false,
    `moiAccepted` BOOLEAN NOT NULL DEFAULT false,
    `universityOwnEnglishTest` BOOLEAN NOT NULL DEFAULT false,
    `applicationFeeWaiver` BOOLEAN NOT NULL DEFAULT false,
    `openProgram` BOOLEAN NOT NULL DEFAULT false,
    `publicTags` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public',
    `lastVerifiedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `lastApprovedUpdateAt` VARCHAR(191) NOT NULL DEFAULT '',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'needs_official_source',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmCourse_courseId_key`(`courseId`),
    INDEX `CrmCourse_universityId_idx`(`universityId`),
    INDEX `CrmCourse_campusId_idx`(`campusId`),
    INDEX `CrmCourse_countryId_idx`(`countryId`),
    INDEX `CrmCourse_studyLevelId_idx`(`studyLevelId`),
    INDEX `CrmCourse_studyAreaId_idx`(`studyAreaId`),
    INDEX `CrmCourse_disciplineId_idx`(`disciplineId`),
    INDEX `CrmCourse_courseTitle_idx`(`courseTitle`),
    INDEX `CrmCourse_subjectArea_idx`(`subjectArea`),
    INDEX `CrmCourse_studyLevel_idx`(`studyLevel`),
    INDEX `CrmCourse_status_idx`(`status`),
    INDEX `CrmCourse_visibility_idx`(`visibility`),
    INDEX `CrmCourse_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCourseIntakeFee` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `intakeYear` INTEGER NOT NULL,
    `intakeMonth` VARCHAR(191) NOT NULL,
    `intakeName` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationDeadline` VARCHAR(191) NOT NULL DEFAULT '',
    `appFeeCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `appFeeAmount` DOUBLE NOT NULL DEFAULT 0,
    `tuitionCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `yearlyTuition` DOUBLE NOT NULL DEFAULT 0,
    `totalTuition` DOUBLE NOT NULL DEFAULT 0,
    `tuitionPeriod` VARCHAR(191) NOT NULL DEFAULT '',
    `depositCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `depositAmount` DOUBLE NOT NULL DEFAULT 0,
    `feeSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `intakeSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmCourseIntakeFee_courseId_idx`(`courseId`),
    INDEX `CrmCourseIntakeFee_universityId_idx`(`universityId`),
    INDEX `CrmCourseIntakeFee_intakeYear_intakeMonth_idx`(`intakeYear`, `intakeMonth`),
    INDEX `CrmCourseIntakeFee_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCourseRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `academicReq` VARCHAR(191) NOT NULL DEFAULT '',
    `acceptedQualifications` VARCHAR(191) NOT NULL DEFAULT '',
    `gradingSystem` VARCHAR(191) NOT NULL DEFAULT '',
    `minScore` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTest` VARCHAR(191) NOT NULL DEFAULT '',
    `componentScores` VARCHAR(191) NOT NULL DEFAULT '{}',
    `ieltsOverall` DOUBLE NOT NULL DEFAULT 0,
    `ieltsMinBand` DOUBLE NOT NULL DEFAULT 0,
    `pteOverall` DOUBLE NOT NULL DEFAULT 0,
    `pteMinBand` DOUBLE NOT NULL DEFAULT 0,
    `toeflOverall` DOUBLE NOT NULL DEFAULT 0,
    `detOverall` DOUBLE NOT NULL DEFAULT 0,
    `workExperience` VARCHAR(191) NOT NULL DEFAULT '',
    `moiAccepted` BOOLEAN NOT NULL DEFAULT false,
    `ownEnglishTest` BOOLEAN NOT NULL DEFAULT false,
    `portfolioRequired` BOOLEAN NOT NULL DEFAULT false,
    `interviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `prerequisiteSubjects` VARCHAR(191) NOT NULL DEFAULT '',
    `countrySpecificRequirement` VARCHAR(191) NOT NULL DEFAULT '',
    `officialRequirementUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmCourseRequirement_courseId_idx`(`courseId`),
    INDEX `CrmCourseRequirement_universityId_idx`(`universityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmScholarship` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipName` VARCHAR(191) NOT NULL DEFAULT '',
    `provider` VARCHAR(191) NOT NULL DEFAULT '',
    `eligibleCountries` VARCHAR(191) NOT NULL DEFAULT '[]',
    `eligibleLevels` VARCHAR(191) NOT NULL DEFAULT '[]',
    `scholarshipAmount` DOUBLE NOT NULL DEFAULT 0,
    `scholarshipCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `awardPercentage` DOUBLE NOT NULL DEFAULT 0,
    `coverageType` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationMethod` VARCHAR(191) NOT NULL DEFAULT '',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `officialScholarshipUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `academicYear` VARCHAR(191) NOT NULL DEFAULT '',
    `expiryStatus` VARCHAR(191) NOT NULL DEFAULT 'unknown',
    `lastCheckedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmScholarship_courseId_idx`(`courseId`),
    INDEX `CrmScholarship_universityId_idx`(`universityId`),
    INDEX `CrmScholarship_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `CrmOfficialSourceCheck` (
    `id` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceType` VARCHAR(191) NOT NULL,
    `requestedUrl` VARCHAR(191) NOT NULL,
    `finalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `httpStatus` INTEGER NOT NULL DEFAULT 0,
    `redirectStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `pageTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `expectedEntity` VARCHAR(191) NOT NULL DEFAULT '',
    `entityMatchStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_CHECKED',
    `soft404` BOOLEAN NOT NULL DEFAULT false,
    `contentHash` VARCHAR(191) NOT NULL DEFAULT '',
    `checkedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
    `parserVersion` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmOfficialSourceCheck_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `CrmOfficialSourceCheck_universityId_idx`(`universityId`),
    INDEX `CrmOfficialSourceCheck_courseId_idx`(`courseId`),
    INDEX `CrmOfficialSourceCheck_sourceType_idx`(`sourceType`),
    INDEX `CrmOfficialSourceCheck_verificationStatus_idx`(`verificationStatus`),
    INDEX `CrmOfficialSourceCheck_contentHash_idx`(`contentHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCommission` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `intakeYear` INTEGER NOT NULL DEFAULT 0,
    `intakeMonth` VARCHAR(191) NOT NULL DEFAULT '',
    `internalExpected` DOUBLE NOT NULL DEFAULT 0,
    `internalIncreased` DOUBLE NOT NULL DEFAULT 0,
    `partnerCommission` DOUBLE NOT NULL DEFAULT 0,
    `internalNotes` VARCHAR(191) NOT NULL DEFAULT '',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmCommission_courseId_idx`(`courseId`),
    INDEX `CrmCommission_universityId_idx`(`universityId`),
    INDEX `CrmCommission_intakeYear_intakeMonth_idx`(`intakeYear`, `intakeMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmImportBatch` (
    `id` VARCHAR(191) NOT NULL,
    `importType` VARCHAR(191) NOT NULL DEFAULT 'course_combined',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `uploadedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `rowsReceived` INTEGER NOT NULL DEFAULT 0,
    `rowsImported` INTEGER NOT NULL DEFAULT 0,
    `rowsFailed` INTEGER NOT NULL DEFAULT 0,
    `rowsDuplicate` INTEGER NOT NULL DEFAULT 0,
    `rowsWarning` INTEGER NOT NULL DEFAULT 0,
    `rowsBlocked` INTEGER NOT NULL DEFAULT 0,
    `rollbackAvailable` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `errorCsvPath` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmImportError` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `rowNumber` INTEGER NOT NULL,
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `field` VARCHAR(191) NOT NULL DEFAULT '',
    `errorMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `severity` VARCHAR(191) NOT NULL DEFAULT 'error',
    `rowData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CrmImportError_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmSourceLog` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'unverified',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `targetCollection` VARCHAR(191) NOT NULL DEFAULT '',
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `beforeData` LONGTEXT NOT NULL DEFAULT '{}',
    `afterData` LONGTEXT NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsapp` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `designation` VARCHAR(191) NOT NULL DEFAULT '',
    `role` VARCHAR(191) NOT NULL DEFAULT 'counselor',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `destinationFocus` VARCHAR(191) NOT NULL DEFAULT '[]',
    `partnerGroups` VARCHAR(191) NOT NULL DEFAULT '[]',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLoginAt` DATETIME(3) NULL,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `privacyModeOn` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Employee_userId_key`(`userId`),
    UNIQUE INDEX `Employee_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeHRProfile` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `officialEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `officialPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT '',
    `designation` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `joiningDate` VARCHAR(191) NOT NULL DEFAULT '',
    `managerId` VARCHAR(191) NOT NULL DEFAULT '',
    `managerName` VARCHAR(191) NOT NULL DEFAULT '',
    `bloodGroup` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyContact` VARCHAR(191) NOT NULL DEFAULT '',
    `presentAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `permanentAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `nidNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `bankName` VARCHAR(191) NOT NULL DEFAULT '',
    `bankAccount` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeHRProfile_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `clockIn` VARCHAR(191) NOT NULL DEFAULT '',
    `clockOut` VARCHAR(191) NOT NULL DEFAULT '',
    `checkIn` VARCHAR(191) NOT NULL DEFAULT '',
    `checkOut` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'present',
    `workingHours` DOUBLE NOT NULL DEFAULT 8,
    `hoursWorked` DOUBLE NOT NULL DEFAULT 0,
    `idleTime` DOUBLE NOT NULL DEFAULT 0,
    `lateMinutes` INTEGER NOT NULL DEFAULT 0,
    `isLate` BOOLEAN NOT NULL DEFAULT false,
    `isHoliday` BOOLEAN NOT NULL DEFAULT false,
    `leaveId` VARCHAR(191) NOT NULL DEFAULT '',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `device` VARCHAR(191) NOT NULL DEFAULT '',
    `isManual` BOOLEAN NOT NULL DEFAULT false,
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeeAttendance_employeeId_idx`(`employeeId`),
    INDEX `EmployeeAttendance_date_idx`(`date`),
    INDEX `EmployeeAttendance_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeSalary` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `housingAllow` DOUBLE NOT NULL DEFAULT 0,
    `transportAllow` DOUBLE NOT NULL DEFAULT 0,
    `medicalAllow` DOUBLE NOT NULL DEFAULT 0,
    `otherAllow` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `taxDeduction` DOUBLE NOT NULL DEFAULT 0,
    `pfDeduction` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `effectiveFrom` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeCommission` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `period` VARCHAR(191) NOT NULL DEFAULT '',
    `paidAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeBonus` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `period` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'approved',
    `paidAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeIncrement` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `previousAmount` DOUBLE NOT NULL DEFAULT 0,
    `newAmount` DOUBLE NOT NULL DEFAULT 0,
    `incrementType` VARCHAR(191) NOT NULL DEFAULT '',
    `effectiveFrom` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePerformance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL DEFAULT '',
    `targetLeads` INTEGER NOT NULL DEFAULT 0,
    `achievedLeads` INTEGER NOT NULL DEFAULT 0,
    `targetConversion` DOUBLE NOT NULL DEFAULT 0,
    `achievedConversion` DOUBLE NOT NULL DEFAULT 0,
    `targetRevenue` DOUBLE NOT NULL DEFAULT 0,
    `achievedRevenue` DOUBLE NOT NULL DEFAULT 0,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `feedback` VARCHAR(191) NOT NULL DEFAULT '',
    `managerRating` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `feature` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL DEFAULT 'view',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Role_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermission_roleId_idx`(`roleId`),
    INDEX `RolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `RolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerLead` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentName` VARCHAR(191) NOT NULL DEFAULT '',
    `studentEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `studentPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `destinationCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerName` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerRef` VARCHAR(191) NOT NULL DEFAULT '',
    `source` VARCHAR(191) NOT NULL DEFAULT 'partner',
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `assignedCounselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedCounselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `commissionExpected` DOUBLE NOT NULL DEFAULT 0,
    `commissionReceived` DOUBLE NOT NULL DEFAULT 0,
    `commissionStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartnerLead_partnerId_idx`(`partnerId`),
    INDEX `PartnerLead_status_idx`(`status`),
    INDEX `PartnerLead_studentEmail_idx`(`studentEmail`),
    INDEX `PartnerLead_studentPhone_idx`(`studentPhone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationThread` (
    `id` VARCHAR(191) NOT NULL,
    `threadCode` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `visaFileId` VARCHAR(191) NOT NULL DEFAULT '',
    `campaignId` VARCHAR(191) NOT NULL DEFAULT '',
    `taskId` VARCHAR(191) NOT NULL DEFAULT '',
    `b2bProviderId` VARCHAR(191) NOT NULL DEFAULT '',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `subject` VARCHAR(191) NOT NULL DEFAULT '',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public_safe',
    `intent` VARCHAR(191) NOT NULL DEFAULT 'general',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `assignedToId` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedToName` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastMessagePreview` VARCHAR(191) NOT NULL DEFAULT '',
    `unreadCount` INTEGER NOT NULL DEFAULT 0,
    `isAiHandled` BOOLEAN NOT NULL DEFAULT false,
    `needsHumanTakeover` BOOLEAN NOT NULL DEFAULT false,
    `slaStatus` VARCHAR(191) NOT NULL DEFAULT 'none',
    `slaDueAt` DATETIME(3) NULL,
    `slaTriggeredAt` DATETIME(3) NULL,
    `escalatedToId` VARCHAR(191) NOT NULL DEFAULT '',
    `escalatedToName` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CommunicationThread_studentId_idx`(`studentId`),
    INDEX `CommunicationThread_leadId_idx`(`leadId`),
    INDEX `CommunicationThread_partnerId_idx`(`partnerId`),
    INDEX `CommunicationThread_applicationId_idx`(`applicationId`),
    INDEX `CommunicationThread_assignedToId_idx`(`assignedToId`),
    INDEX `CommunicationThread_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationThreadParticipant` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `participantId` VARCHAR(191) NOT NULL,
    `participantType` VARCHAR(191) NOT NULL DEFAULT 'user',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationThreadParticipant_threadId_idx`(`threadId`),
    INDEX `CommunicationThreadParticipant_participantId_idx`(`participantId`),
    UNIQUE INDEX `CommunicationThreadParticipant_threadId_participantId_key`(`threadId`, `participantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationMessage` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `communicationCode` VARCHAR(191) NOT NULL DEFAULT '',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `direction` VARCHAR(191) NOT NULL DEFAULT 'inbound',
    `source` VARCHAR(191) NOT NULL DEFAULT 'portal',
    `senderUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `senderContact` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientName` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientContact` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `visaFileId` VARCHAR(191) NOT NULL DEFAULT '',
    `campaignId` VARCHAR(191) NOT NULL DEFAULT '',
    `taskId` VARCHAR(191) NOT NULL DEFAULT '',
    `b2bProviderId` VARCHAR(191) NOT NULL DEFAULT '',
    `messageSubject` VARCHAR(191) NOT NULL DEFAULT '',
    `messageBody` VARCHAR(191) NOT NULL DEFAULT '',
    `messageHtml` VARCHAR(191) NOT NULL DEFAULT '',
    `attachmentPath` VARCHAR(191) NOT NULL DEFAULT '',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public_safe',
    `intent` VARCHAR(191) NOT NULL DEFAULT 'general',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `status` VARCHAR(191) NOT NULL DEFAULT 'unread',
    `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `slaDueAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `repliedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedTo` VARCHAR(191) NOT NULL DEFAULT '',
    `senderType` VARCHAR(191) NOT NULL DEFAULT 'student',
    `senderId` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'text',
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `isAiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `aiApprovedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isInternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationMessage_threadId_idx`(`threadId`),
    INDEX `CommunicationMessage_studentId_idx`(`studentId`),
    INDEX `CommunicationMessage_leadId_idx`(`leadId`),
    INDEX `CommunicationMessage_partnerId_idx`(`partnerId`),
    INDEX `CommunicationMessage_applicationId_idx`(`applicationId`),
    INDEX `CommunicationMessage_senderId_idx`(`senderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `templateCode` VARCHAR(191) NOT NULL DEFAULT '',
    `templateName` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `body` VARCHAR(191) NOT NULL DEFAULT '',
    `variables` VARCHAR(191) NOT NULL DEFAULT '[]',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public_safe',
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationLog` (
    `id` VARCHAR(191) NOT NULL,
    `communicationId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `oldStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `newStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `details` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationPreference` (
    `id` VARCHAR(191) NOT NULL,
    `ownerType` VARCHAR(191) NOT NULL DEFAULT 'student',
    `ownerId` VARCHAR(191) NOT NULL,
    `whatsappAllowed` BOOLEAN NOT NULL DEFAULT true,
    `smsAllowed` BOOLEAN NOT NULL DEFAULT true,
    `emailAllowed` BOOLEAN NOT NULL DEFAULT true,
    `phoneAllowed` BOOLEAN NOT NULL DEFAULT true,
    `marketingAllowed` BOOLEAN NOT NULL DEFAULT true,
    `transactionalAllowed` BOOLEAN NOT NULL DEFAULT true,
    `optOutAt` DATETIME(3) NULL,
    `consentSource` VARCHAR(191) NOT NULL DEFAULT 'web_form',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationSlaRule` (
    `id` VARCHAR(191) NOT NULL,
    `ruleName` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `intent` VARCHAR(191) NOT NULL DEFAULT 'general',
    `roleId` VARCHAR(191) NOT NULL DEFAULT '',
    `firstResponseMinutes` INTEGER NOT NULL DEFAULT 30,
    `escalation1Minutes` INTEGER NOT NULL DEFAULT 20,
    `escalation2Minutes` INTEGER NOT NULL DEFAULT 10,
    `officeHoursOnly` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationEscalation` (
    `id` VARCHAR(191) NOT NULL,
    `communicationId` VARCHAR(191) NOT NULL,
    `fromUserId` VARCHAR(191) NOT NULL,
    `toUserId` VARCHAR(191) NOT NULL,
    `escalationLevel` INTEGER NOT NULL DEFAULT 1,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OtpLog` (
    `id` VARCHAR(191) NOT NULL,
    `ownerType` VARCHAR(191) NOT NULL DEFAULT 'student',
    `ownerId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `otpHash` VARCHAR(191) NOT NULL DEFAULT '',
    `purpose` VARCHAR(191) NOT NULL DEFAULT 'verification',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CallLog` (
    `id` VARCHAR(191) NOT NULL,
    `callCode` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `callType` VARCHAR(191) NOT NULL DEFAULT 'inbound',
    `callOutcome` VARCHAR(191) NOT NULL DEFAULT 'connected',
    `durationSeconds` INTEGER NOT NULL DEFAULT 0,
    `recordingUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `nextFollowupAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Broadcast` (
    `id` VARCHAR(191) NOT NULL,
    `broadcastCode` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `audienceType` VARCHAR(191) NOT NULL DEFAULT 'leads',
    `audienceFilterJson` VARCHAR(191) NOT NULL DEFAULT '{}',
    `messageBody` VARCHAR(191) NOT NULL DEFAULT '',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `scheduledAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BroadcastRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `broadcastId` VARCHAR(191) NOT NULL,
    `ownerType` VARCHAR(191) NOT NULL DEFAULT 'lead',
    `ownerId` VARCHAR(191) NOT NULL,
    `recipientContact` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'queued',
    `sentAt` DATETIME(3) NULL,
    `failedReason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialInbox` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `externalMessageId` VARCHAR(191) NOT NULL DEFAULT '',
    `externalCommentId` VARCHAR(191) NOT NULL DEFAULT '',
    `pageId` VARCHAR(191) NOT NULL DEFAULT '',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `senderProfileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `messageText` VARCHAR(191) NOT NULL DEFAULT '',
    `attachmentUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `intent` VARCHAR(191) NOT NULL DEFAULT 'course_inquiry',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedTo` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiReplyDraft` (
    `id` VARCHAR(191) NOT NULL,
    `communicationId` VARCHAR(191) NOT NULL,
    `promptContext` VARCHAR(191) NOT NULL DEFAULT '',
    `draftBody` VARCHAR(191) NOT NULL DEFAULT '',
    `riskFlags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiReplyLog` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `originalMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `aiSuggestedReply` VARCHAR(191) NOT NULL DEFAULT '',
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `approvedById` VARCHAR(191) NOT NULL DEFAULT '',
    `sentAsIs` BOOLEAN NOT NULL DEFAULT false,
    `editedBeforeSend` BOOLEAN NOT NULL DEFAULT false,
    `finalContent` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternalComment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `authorId` VARCHAR(191) NOT NULL DEFAULT '',
    `authorName` VARCHAR(191) NOT NULL DEFAULT '',
    `authorRole` VARCHAR(191) NOT NULL DEFAULT 'counselor',
    `commentType` VARCHAR(191) NOT NULL DEFAULT 'counselor_note',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'internal_only',
    `editHistory` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentVisibleComment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `authorId` VARCHAR(191) NOT NULL DEFAULT '',
    `authorName` VARCHAR(191) NOT NULL DEFAULT '',
    `authorRole` VARCHAR(191) NOT NULL DEFAULT 'counselor',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `isAiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerEmailUpdate` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerName` VARCHAR(191) NOT NULL DEFAULT '',
    `subject` VARCHAR(191) NOT NULL DEFAULT '',
    `body` VARCHAR(191) NOT NULL DEFAULT '',
    `parsedStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `studentFacingMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `isStudentFacing` BOOLEAN NOT NULL DEFAULT false,
    `internalNote` VARCHAR(191) NOT NULL DEFAULT '',
    `matchedByEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `matchedByPassport` VARCHAR(191) NOT NULL DEFAULT '',
    `matchedByAppId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CvDraft` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `reviewRequested` BOOLEAN NOT NULL DEFAULT false,
    `reviewerId` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewerNote` VARCHAR(191) NOT NULL DEFAULT '',
    `studentReviewRequested` BOOLEAN NOT NULL DEFAULT false,
    `studentReviewCompleted` BOOLEAN NOT NULL DEFAULT false,
    `exportedPdfUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `exportedDocxUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiGeneratedDocument` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL DEFAULT 'sop',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `aiModel` VARCHAR(191) NOT NULL DEFAULT '',
    `originalityScore` DOUBLE NOT NULL DEFAULT 0,
    `plagiarismWarning` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewChecklist` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CounselorTask` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'follow_up',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `dueDate` VARCHAR(191) NOT NULL DEFAULT '',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlaEvent` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `eventType` VARCHAR(191) NOT NULL DEFAULT 'warning',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'whatsapp',
    `firstMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `responseAt` DATETIME(3) NULL,
    `escalatedAt` DATETIME(3) NULL,
    `escalatedToId` VARCHAR(191) NOT NULL DEFAULT '',
    `escalatedToRole` VARCHAR(191) NOT NULL DEFAULT '',
    `resolvedAt` DATETIME(3) NULL,
    `resolution` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentAudit` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorName` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `previousStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `newStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeeklyReport` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL DEFAULT 'counselor',
    `periodStart` VARCHAR(191) NOT NULL DEFAULT '',
    `periodEnd` VARCHAR(191) NOT NULL DEFAULT '',
    `data` VARCHAR(191) NOT NULL DEFAULT '{}',
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SensitiveDataRevealLog` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `dataType` VARCHAR(191) NOT NULL DEFAULT 'salary',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `revealMethod` VARCHAR(191) NOT NULL DEFAULT 'pin',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalRole` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PortalRole_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalPermission` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `feature` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PortalPermission_module_feature_action_key`(`module`, `feature`, `action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalRolePermission` (
    `id` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT true,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',

    INDEX `PortalRolePermission_roleId_idx`(`roleId`),
    INDEX `PortalRolePermission_permissionId_idx`(`permissionId`),
    UNIQUE INDEX `PortalRolePermission_roleId_permissionId_key`(`roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalUserRole` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `PortalUserRole_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalUser` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `passwordHash` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `avatar` VARCHAR(191) NOT NULL DEFAULT '',
    `userType` VARCHAR(191) NOT NULL DEFAULT 'STUDENT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `firstLoginRequired` BOOLEAN NOT NULL DEFAULT false,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `phoneVerified` BOOLEAN NOT NULL DEFAULT false,
    `lastLoginAt` DATETIME(3) NULL,
    `lastLoginIp` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PortalUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PortalSession_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `success` BOOLEAN NOT NULL DEFAULT false,
    `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OtpCode` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `code` VARCHAR(191) NOT NULL DEFAULT '',
    `codeHash` VARCHAR(191) NOT NULL DEFAULT '',
    `used` BOOLEAN NOT NULL DEFAULT false,
    `type` VARCHAR(191) NOT NULL DEFAULT 'login',
    `purpose` VARCHAR(191) NOT NULL DEFAULT 'login',
    `expiresAt` DATETIME(3) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OtpCode_userId_idx`(`userId`),
    INDEX `OtpCode_email_idx`(`email`),
    INDEX `OtpCode_phone_idx`(`phone`),
    INDEX `OtpCode_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PasswordResetToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL DEFAULT '',
    `tokenHash` VARCHAR(191) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordResetToken_tokenHash_key`(`tokenHash`),
    INDEX `PasswordResetToken_userId_idx`(`userId`),
    INDEX `PasswordResetToken_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` LONGTEXT NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PortalAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `PortalAuditLog_action_idx`(`action`),
    INDEX `PortalAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalStudentProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL DEFAULT '',
    `guardianName` VARCHAR(191) NOT NULL DEFAULT '',
    `guardianPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `dateOfBirth` VARCHAR(191) NOT NULL DEFAULT '',
    `gender` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `passportStatus` VARCHAR(191) NOT NULL DEFAULT 'not_uploaded',
    `passportNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `passportExpiry` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredIntake` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredSubject` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `budget` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTestType` VARCHAR(191) NOT NULL DEFAULT '',
    `englishScore` DOUBLE NOT NULL DEFAULT 0,
    `studyGap` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorRelation` VARCHAR(191) NOT NULL DEFAULT '',
    `currentEducation` VARCHAR(191) NOT NULL DEFAULT '',
    `sscResult` VARCHAR(191) NOT NULL DEFAULT '',
    `hscResult` VARCHAR(191) NOT NULL DEFAULT '',
    `bachelorResult` VARCHAR(191) NOT NULL DEFAULT '',
    `masterResult` VARCHAR(191) NOT NULL DEFAULT '',
    `workExperience` VARCHAR(191) NOT NULL DEFAULT '',
    `profileCompletion` INTEGER NOT NULL DEFAULT 0,
    `journeyStage` VARCHAR(191) NOT NULL DEFAULT 'lead_created',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerName` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsappVerified` BOOLEAN NOT NULL DEFAULT false,
    `givenName` VARCHAR(191) NOT NULL DEFAULT '',
    `familyName` VARCHAR(191) NOT NULL DEFAULT '',
    `nationality` VARCHAR(191) NOT NULL DEFAULT 'Bangladeshi',
    `maritalStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `presentAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `permanentAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `altEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `altPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyName` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyRelation` VARCHAR(191) NOT NULL DEFAULT '',
    `fundingStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `sponsorType` VARCHAR(191) NOT NULL DEFAULT '',
    `fundSource` VARCHAR(191) NOT NULL DEFAULT '',
    `applicantStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `noOfDependents` INTEGER NOT NULL DEFAULT 0,
    `passportIssuePlace` VARCHAR(191) NOT NULL DEFAULT '',
    `passportIssueDate` VARCHAR(191) NOT NULL DEFAULT '',
    `passportIssueCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `cityOfBirth` VARCHAR(191) NOT NULL DEFAULT '',
    `countryOfBirth` VARCHAR(191) NOT NULL DEFAULT '',
    `hasPassport` VARCHAR(191) NOT NULL DEFAULT 'no',
    `englishTestStatus` VARCHAR(191) NOT NULL DEFAULT 'no',
    `englishTestDate` VARCHAR(191) NOT NULL DEFAULT '',
    `englishExpDate` VARCHAR(191) NOT NULL DEFAULT '',
    `englishCertId` VARCHAR(191) NOT NULL DEFAULT '',
    `englishListening` DOUBLE NOT NULL DEFAULT 0,
    `englishSpeaking` DOUBLE NOT NULL DEFAULT 0,
    `englishWriting` DOUBLE NOT NULL DEFAULT 0,
    `englishReading` DOUBLE NOT NULL DEFAULT 0,
    `hasWorkExp` VARCHAR(191) NOT NULL DEFAULT 'no',
    `hasReferral` VARCHAR(191) NOT NULL DEFAULT 'no',
    `hasVisa` VARCHAR(191) NOT NULL DEFAULT 'no',
    `hasVisaRefusal` VARCHAR(191) NOT NULL DEFAULT 'no',
    `hasMedical` VARCHAR(191) NOT NULL DEFAULT 'no',
    `hasCriminal` VARCHAR(191) NOT NULL DEFAULT 'no',
    `instituteType` VARCHAR(191) NOT NULL DEFAULT '',
    `instituteName` VARCHAR(191) NOT NULL DEFAULT '',
    `programTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `enrollmentChoice` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationPathway` VARCHAR(191) NOT NULL DEFAULT '',
    `pathwayProvider` VARCHAR(191) NOT NULL DEFAULT '',
    `visaType` VARCHAR(191) NOT NULL DEFAULT '',
    `leadReference` VARCHAR(191) NOT NULL DEFAULT '',
    `welcomeEmailSent` BOOLEAN NOT NULL DEFAULT false,
    `eligibilityScore` INTEGER NOT NULL DEFAULT 0,
    `visaReadiness` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PortalStudentProfile_userId_key`(`userId`),
    UNIQUE INDEX `PortalStudentProfile_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `designation` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT '',
    `joinDate` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyContact` VARCHAR(191) NOT NULL DEFAULT '',
    `salary` VARCHAR(191) NOT NULL DEFAULT '',
    `bankName` VARCHAR(191) NOT NULL DEFAULT '',
    `bankAccount` VARCHAR(191) NOT NULL DEFAULT '',
    `bankRouting` VARCHAR(191) NOT NULL DEFAULT '',
    `bloodGroup` VARCHAR(191) NOT NULL DEFAULT '',
    `nidNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeProfile_userId_key`(`userId`),
    UNIQUE INDEX `EmployeeProfile_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeActivationToken` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeActivationToken_tokenHash_idx`(`tokenHash`),
    INDEX `EmployeeActivationToken_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL DEFAULT '',
    `contactPerson` VARCHAR(191) NOT NULL DEFAULT '',
    `businessType` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `totalLeads` INTEGER NOT NULL DEFAULT 0,
    `activeStudents` INTEGER NOT NULL DEFAULT 0,
    `commissionPending` DOUBLE NOT NULL DEFAULT 0,
    `commissionPaid` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerProfile_userId_key`(`userId`),
    UNIQUE INDEX `PartnerProfile_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalStudentApplication` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `university` VARCHAR(191) NOT NULL DEFAULT '',
    `course` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `stage` VARCHAR(191) NOT NULL DEFAULT 'research',
    `nextAction` VARCHAR(191) NOT NULL DEFAULT '',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalStudentDocument` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'other',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileSize` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `uploadedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalTimelineEvent` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL DEFAULT 'portal',
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'info',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `senderName` VARCHAR(191) NOT NULL DEFAULT '',
    `senderType` VARCHAR(191) NOT NULL DEFAULT 'system',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'student_visible',
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentEducationRecord` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `academicLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `groupSubject` VARCHAR(191) NOT NULL DEFAULT '',
    `institution` VARCHAR(191) NOT NULL DEFAULT '',
    `resultType` VARCHAR(191) NOT NULL DEFAULT '',
    `resultScore` VARCHAR(191) NOT NULL DEFAULT '',
    `duration` VARCHAR(191) NOT NULL DEFAULT '',
    `startYear` VARCHAR(191) NOT NULL DEFAULT '',
    `startMonth` VARCHAR(191) NOT NULL DEFAULT '',
    `endYear` VARCHAR(191) NOT NULL DEFAULT '',
    `endMonth` VARCHAR(191) NOT NULL DEFAULT '',
    `countryOfStudy` VARCHAR(191) NOT NULL DEFAULT '',
    `cityOfStudy` VARCHAR(191) NOT NULL DEFAULT '',
    `boardName` VARCHAR(191) NOT NULL DEFAULT '',
    `primaryLanguage` VARCHAR(191) NOT NULL DEFAULT '',
    `studyGap` VARCHAR(191) NOT NULL DEFAULT 'no',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentWorkExpRecord` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL DEFAULT '',
    `designation` VARCHAR(191) NOT NULL DEFAULT '',
    `startDate` VARCHAR(191) NOT NULL DEFAULT '',
    `endDate` VARCHAR(191) NOT NULL DEFAULT '',
    `currentlyWorking` BOOLEAN NOT NULL DEFAULT false,
    `salaryMode` VARCHAR(191) NOT NULL DEFAULT '',
    `jobRole` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentEnglishTestRecord` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `testName` VARCHAR(191) NOT NULL DEFAULT '',
    `testDate` VARCHAR(191) NOT NULL DEFAULT '',
    `expirationDate` VARCHAR(191) NOT NULL DEFAULT '',
    `certId` VARCHAR(191) NOT NULL DEFAULT '',
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `listening` DOUBLE NOT NULL DEFAULT 0,
    `speaking` DOUBLE NOT NULL DEFAULT 0,
    `writing` DOUBLE NOT NULL DEFAULT 0,
    `reading` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentVisaRefusal` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NOT NULL,
    `appliedCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `visaType` VARCHAR(191) NOT NULL DEFAULT '',
    `rejectionDate` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentReferral` (
    `id` VARCHAR(191) NOT NULL,
    `studentProfileId` VARCHAR(191) NULL,
    `referrerId` VARCHAR(191) NOT NULL DEFAULT '',
    `referralCode` VARCHAR(191) NOT NULL DEFAULT '',
    `referredName` VARCHAR(191) NOT NULL DEFAULT '',
    `referredEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `referredPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `destinationCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `reward` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `rewardAmount` DOUBLE NOT NULL DEFAULT 0,
    `rewardStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentReferral_studentProfileId_idx`(`studentProfileId`),
    INDEX `StudentReferral_referrerId_idx`(`referrerId`),
    INDEX `StudentReferral_referredEmail_idx`(`referredEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalNotification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentProfileId` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL DEFAULT '',
    `type` VARCHAR(191) NOT NULL DEFAULT 'info',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PortalNotification_userId_idx`(`userId`),
    INDEX `PortalNotification_studentProfileId_idx`(`studentProfileId`),
    INDEX `PortalNotification_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Country` (
    `id` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL DEFAULT '',
    `code` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `flag` VARCHAR(191) NOT NULL DEFAULT '',
    `currency` VARCHAR(191) NOT NULL DEFAULT '',
    `capital` VARCHAR(191) NOT NULL DEFAULT '',
    `heroTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `heroSubtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `overview` TEXT NOT NULL DEFAULT '',
    `description` TEXT NOT NULL DEFAULT '',
    `visaOverview` TEXT NOT NULL DEFAULT '',
    `visaType` VARCHAR(191) NOT NULL DEFAULT '',
    `workRights` TEXT NOT NULL DEFAULT '',
    `costOfLiving` TEXT NOT NULL DEFAULT '',
    `livingCost` VARCHAR(191) NOT NULL DEFAULT '',
    `whyStudySummary` TEXT NOT NULL DEFAULT '',
    `popularIntakes` VARCHAR(191) NOT NULL DEFAULT '[]',
    `studyLevels` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#0057B8',
    `popularCities` VARCHAR(191) NOT NULL DEFAULT '[]',
    `universityCount` INTEGER NOT NULL DEFAULT 0,
    `courseCount` INTEGER NOT NULL DEFAULT 0,
    `scholarshipCount` INTEGER NOT NULL DEFAULT 0,
    `tuitionRange` VARCHAR(191) NOT NULL DEFAULT '',
    `heroImage` VARCHAR(191) NOT NULL DEFAULT '',
    `heroCity` VARCHAR(191) NOT NULL DEFAULT '',
    `heroIntake` VARCHAR(191) NOT NULL DEFAULT '',
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` TEXT NOT NULL DEFAULT '',
    `canonicalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `ogTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `ogDescription` TEXT NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Country_slug_key`(`slug`),
    INDEX `Country_countryCode_idx`(`countryCode`),
    INDEX `Country_slug_idx`(`slug`),
    INDEX `Country_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryQuickFact` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `factKey` VARCHAR(191) NOT NULL,
    `factLabel` VARCHAR(191) NOT NULL,
    `factValue` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryCity` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `cityName` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `costLevel` VARCHAR(191) NOT NULL DEFAULT 'Medium',
    `studentVibe` VARCHAR(191) NOT NULL DEFAULT '',
    `popularUniversities` VARCHAR(191) NOT NULL DEFAULT '[]',
    `transportSummary` VARCHAR(191) NOT NULL DEFAULT '',
    `jobOpportunitySummary` VARCHAR(191) NOT NULL DEFAULT '',
    `livingCostEstimate` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryEducationPathway` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `fromLevel` VARCHAR(191) NOT NULL,
    `toPathway` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryStudyReason` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '',
    `heading` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `ctaLabel` VARCHAR(191) NOT NULL DEFAULT 'Explore Courses',
    `ctaUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryEntryRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `studyLevel` VARCHAR(191) NOT NULL,
    `academicRequirement` VARCHAR(191) NOT NULL,
    `englishRequirement` VARCHAR(191) NOT NULL,
    `documentsRequired` VARCHAR(191) NOT NULL DEFAULT '[]',
    `remarks` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryEnglishTest` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `testName` VARCHAR(191) NOT NULL,
    `acceptedSummary` VARCHAR(191) NOT NULL,
    `minimumNote` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryVisaStep` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `stepNumber` INTEGER NOT NULL,
    `stepTitle` VARCHAR(191) NOT NULL,
    `stepDescription` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryWorkRight` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `termTimeRule` VARCHAR(191) NOT NULL,
    `vacationRule` VARCHAR(191) NOT NULL,
    `courseLevelCondition` VARCHAR(191) NOT NULL,
    `postStudyRouteSummary` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryFaq` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountrySource` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL,
    `dataSection` VARCHAR(191) NOT NULL,
    `sourceName` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT 'ALO Compliance Team',
    `lastVerifiedAt` DATETIME(3) NULL,
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebsiteEnglishTest` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortDescription` VARCHAR(191) NOT NULL DEFAULT '',
    `bestFor` VARCHAR(191) NOT NULL DEFAULT '',
    `acceptedDest` VARCHAR(191) NOT NULL DEFAULT '',
    `resultTime` VARCHAR(191) NOT NULL DEFAULT '',
    `scoreRange` VARCHAR(191) NOT NULL DEFAULT '',
    `format` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WebsiteEnglishTest_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeService` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HomeService_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SuccessStory` (
    `id` VARCHAR(191) NOT NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `homeDistrict` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `university` VARCHAR(191) NOT NULL DEFAULT '',
    `course` VARCHAR(191) NOT NULL DEFAULT '',
    `outcome` VARCHAR(191) NOT NULL DEFAULT '',
    `testimonial` VARCHAR(191) NOT NULL DEFAULT '',
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `consentStatus` VARCHAR(191) NOT NULL DEFAULT 'not_verified',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `specialty` VARCHAR(191) NOT NULL DEFAULT '',
    `bio` VARCHAR(191) NOT NULL DEFAULT '',
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomepageFaq` (
    `id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadForm` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredSubject` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `budget` VARCHAR(191) NOT NULL DEFAULT '',
    `englishTest` VARCHAR(191) NOT NULL DEFAULT '',
    `englishScore` VARCHAR(191) NOT NULL DEFAULT '',
    `message` VARCHAR(191) NOT NULL DEFAULT '',
    `source` VARCHAR(191) NOT NULL DEFAULT 'homepage',
    `sourceSection` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `assignedCounselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SearchLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `countryId` VARCHAR(191) NULL,
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `subject` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `budget` VARCHAR(191) NOT NULL DEFAULT '',
    `source` VARCHAR(191) NOT NULL DEFAULT 'homepage',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerPackage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `price` DOUBLE NOT NULL DEFAULT 0,
    `billingCycle` VARCHAR(191) NOT NULL DEFAULT 'monthly',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `maxUsers` INTEGER NOT NULL DEFAULT 1,
    `maxImages` INTEGER NOT NULL DEFAULT 0,
    `maxVideos` INTEGER NOT NULL DEFAULT 0,
    `videoMaxLength` INTEGER NOT NULL DEFAULT 0,
    `maxLeads` INTEGER NOT NULL DEFAULT 0,
    `features` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerPackage_name_key`(`name`),
    UNIQUE INDEX `PartnerPackage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerQuota` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL DEFAULT '',
    `maxUsers` INTEGER NOT NULL DEFAULT 1,
    `maxImages` INTEGER NOT NULL DEFAULT 0,
    `maxVideos` INTEGER NOT NULL DEFAULT 0,
    `videoMaxLength` INTEGER NOT NULL DEFAULT 0,
    `maxLeads` INTEGER NOT NULL DEFAULT 0,
    `usedUsers` INTEGER NOT NULL DEFAULT 0,
    `usedImages` INTEGER NOT NULL DEFAULT 0,
    `usedVideos` INTEGER NOT NULL DEFAULT 0,
    `usedLeads` INTEGER NOT NULL DEFAULT 0,
    `resetAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerQuota_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeEducation` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `degree` VARCHAR(191) NOT NULL DEFAULT '',
    `institution` VARCHAR(191) NOT NULL DEFAULT '',
    `passingYear` VARCHAR(191) NOT NULL DEFAULT '',
    `result` VARCHAR(191) NOT NULL DEFAULT '',
    `certificatePath` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeEmergencyContact` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `relation` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDocument` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `filePath` VARCHAR(191) NOT NULL DEFAULT '',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileSize` INTEGER NOT NULL DEFAULT 0,
    `fileHash` VARCHAR(191) NOT NULL DEFAULT '',
    `mimeType` VARCHAR(191) NOT NULL DEFAULT '',
    `isMandatory` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `version` INTEGER NOT NULL DEFAULT 1,
    `expiryDate` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewerId` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewNote` VARCHAR(191) NOT NULL DEFAULT '',
    `uploadedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeeDocument_employeeId_idx`(`employeeId`),
    INDEX `EmployeeDocument_documentType_idx`(`documentType`),
    INDEX `EmployeeDocument_isMandatory_idx`(`isMandatory`),
    INDEX `EmployeeDocument_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerPackageAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureAccessRule` (
    `id` VARCHAR(191) NOT NULL,
    `ownerType` VARCHAR(191) NOT NULL DEFAULT 'partner',
    `ownerId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `limitValue` INTEGER NOT NULL DEFAULT 0,
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExtraQuotaRequest` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `requestType` VARCHAR(191) NOT NULL DEFAULT 'user_seats',
    `currentLimit` INTEGER NOT NULL DEFAULT 0,
    `requestedLimit` INTEGER NOT NULL DEFAULT 0,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerUserSeatRequest` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `requestedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `currentLimit` INTEGER NOT NULL DEFAULT 3,
    `requestedExtraSeats` INTEGER NOT NULL DEFAULT 1,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerMarketingQuota` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `monthlyImageLimit` INTEGER NOT NULL DEFAULT 15,
    `monthlyVideoLimit` INTEGER NOT NULL DEFAULT 10,
    `videoDurationLimitSeconds` INTEGER NOT NULL DEFAULT 30,
    `autoPublishAllowed` BOOLEAN NOT NULL DEFAULT false,
    `requiresAloApproval` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerMarketingQuota_partnerId_key`(`partnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerMarketingUsage` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `monthYear` VARCHAR(191) NOT NULL DEFAULT '',
    `imagesUsed` INTEGER NOT NULL DEFAULT 0,
    `videosUsed` INTEGER NOT NULL DEFAULT 0,
    `ideasSubmitted` INTEGER NOT NULL DEFAULT 0,
    `postsScheduled` INTEGER NOT NULL DEFAULT 0,
    `postsPublished` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartnerMarketingUsage_partnerId_idx`(`partnerId`),
    UNIQUE INDEX `PartnerMarketingUsage_partnerId_monthYear_key`(`partnerId`, `monthYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnerMarketingRequest` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `requestedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `idea` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `targetAudience` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaText` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredStyle` VARCHAR(191) NOT NULL DEFAULT 'professional',
    `caption` VARCHAR(191) NOT NULL DEFAULT '',
    `hashtags` VARCHAR(191) NOT NULL DEFAULT '',
    `imagePrompt` VARCHAR(191) NOT NULL DEFAULT '',
    `videoPrompt` VARCHAR(191) NOT NULL DEFAULT '',
    `videoScript` VARCHAR(191) NOT NULL DEFAULT '',
    `assetId` VARCHAR(191) NOT NULL DEFAULT '',
    `generatedContent` VARCHAR(191) NOT NULL DEFAULT '',
    `generatedImageUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `generatedVideoUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `videoDuration` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'idea_submitted',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `requiresAloApproval` BOOLEAN NOT NULL DEFAULT true,
    `autoPublishAllowed` BOOLEAN NOT NULL DEFAULT false,
    `publishedUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `publishedAt` DATETIME(3) NULL,
    `scheduledAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentBenefitEntitlement` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `benefitType` VARCHAR(191) NOT NULL DEFAULT '',
    `limitCount` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentMockTestVoucher` (
    `id` VARCHAR(191) NOT NULL,
    `voucherCode` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `testType` VARCHAR(191) NOT NULL DEFAULT 'ENGLISH_MOCK_TEST',
    `usageLimit` INTEGER NOT NULL DEFAULT 1,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'available',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentMockTestVoucher_voucherCode_key`(`voucherCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeHeroSlide` (
    `id` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `countryCode` VARCHAR(191) NOT NULL DEFAULT '',
    `headline` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `imageUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `imageAlt` VARCHAR(191) NOT NULL DEFAULT '',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#0057B8',
    `popularCity` VARCHAR(191) NOT NULL DEFAULT '',
    `popularIntake` VARCHAR(191) NOT NULL DEFAULT '',
    `universityCountLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `courseCountLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaPrimaryLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaPrimaryUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaSecondaryLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaSecondaryUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `licenseNote` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HomeSection` (
    `id` VARCHAR(191) NOT NULL,
    `sectionKey` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HomeSection_sectionKey_key`(`sectionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PermissionPackage` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `permissions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `isSystem` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PermissionPackage_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'disconnected',
    `connectedAccount` VARCHAR(191) NULL,
    `businessAccountId` VARCHAR(191) NULL,
    `accessToken` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `tokenExpiresAt` DATETIME(3) NULL,
    `webhookStatus` VARCHAR(191) NOT NULL DEFAULT 'inactive',
    `webhookSecret` VARCHAR(191) NULL,
    `apiVersion` VARCHAR(191) NOT NULL DEFAULT 'v19.0',
    `healthStatus` VARCHAR(191) NOT NULL DEFAULT 'healthy',
    `lastSyncAt` DATETIME(3) NULL,
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialAccount` (
    `id` VARCHAR(191) NOT NULL,
    `integrationId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `assetName` VARCHAR(191) NOT NULL,
    `assetType` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UccConversation` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `channelAccountId` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `participantName` VARCHAR(191) NOT NULL,
    `participantPhone` VARCHAR(191) NULL,
    `participantEmail` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `assignedToUserId` VARCHAR(191) NULL,
    `assignedRole` VARCHAR(191) NULL,
    `destinationCountry` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `lastMessageText` VARCHAR(191) NULL,
    `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unreadCount` INTEGER NOT NULL DEFAULT 0,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UccMessage` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NOT NULL,
    `senderRole` VARCHAR(191) NOT NULL DEFAULT 'user',
    `channel` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `status` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `aiApproved` BOOLEAN NOT NULL DEFAULT true,
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UccAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `detectedDocType` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `ocrExtractedData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UccRoutingRule` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NULL,
    `destinationCountry` VARCHAR(191) NULL,
    `officeId` VARCHAR(191) NULL,
    `assignedUserId` VARCHAR(191) NULL,
    `assignedRole` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UccOfficeHours` (
    `id` VARCHAR(191) NOT NULL,
    `dayOfWeek` INTEGER NOT NULL,
    `startTime` VARCHAR(191) NOT NULL DEFAULT '09:00',
    `endTime` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `isWorkDay` BOOLEAN NOT NULL DEFAULT true,
    `afterHoursAiAuto` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UccWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'processed',
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeCommunicationProfile` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `employeeName` VARCHAR(191) NOT NULL,
    `officialEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `officialPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsappAccess` BOOLEAN NOT NULL DEFAULT false,
    `whatsappNumberId` VARCHAR(191) NOT NULL DEFAULT '',
    `facebookAccess` BOOLEAN NOT NULL DEFAULT false,
    `instagramAccess` BOOLEAN NOT NULL DEFAULT false,
    `emailAccess` BOOLEAN NOT NULL DEFAULT false,
    `assignedPages` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assignedDepartments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assignedBranch` VARCHAR(191) NOT NULL DEFAULT '',
    `communicationSig` VARCHAR(191) NOT NULL DEFAULT '',
    `channelPermissions` VARCHAR(191) NOT NULL DEFAULT '{}',
    `workingHoursStart` VARCHAR(191) NOT NULL DEFAULT '10:00',
    `workingHoursEnd` VARCHAR(191) NOT NULL DEFAULT '18:00',
    `onLeave` BOOLEAN NOT NULL DEFAULT false,
    `supervisorId` VARCHAR(191) NOT NULL DEFAULT '',
    `languageCapability` VARCHAR(191) NOT NULL DEFAULT '["en","bn"]',
    `countrySpecialization` VARCHAR(191) NOT NULL DEFAULT '[]',
    `escalationLevel` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `offboardedAt` DATETIME(3) NULL,
    `offboardedById` VARCHAR(191) NOT NULL DEFAULT '',
    `offboardingNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `threecxExtension` VARCHAR(191) NULL,

    UNIQUE INDEX `EmployeeCommunicationProfile_employeeId_key`(`employeeId`),
    UNIQUE INDEX `EmployeeCommunicationProfile_threecxExtension_key`(`threecxExtension`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OcrJob` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL DEFAULT 'unknown',
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `fileHash` VARCHAR(191) NOT NULL DEFAULT '',
    `ocrEngine` VARCHAR(191) NOT NULL DEFAULT 'tesseract',
    `modelVersion` VARCHAR(191) NOT NULL DEFAULT 'v1',
    `status` VARCHAR(191) NOT NULL DEFAULT 'queued',
    `confidenceScore` DOUBLE NOT NULL DEFAULT 0,
    `rawText` VARCHAR(191) NOT NULL DEFAULT '',
    `errorMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `humanReviewedBy` VARCHAR(191) NULL,
    `humanReviewedAt` DATETIME(3) NULL,
    `studentId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `attachmentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OcrFieldExtraction` (
    `id` VARCHAR(191) NOT NULL,
    `ocrJobId` VARCHAR(191) NOT NULL,
    `fieldKey` VARCHAR(191) NOT NULL,
    `fieldLabel` VARCHAR(191) NOT NULL,
    `extractedValue` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `pageNumber` INTEGER NOT NULL DEFAULT 1,
    `sourceText` VARCHAR(191) NOT NULL DEFAULT '',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedAt` DATETIME(3) NULL,
    `correctedValue` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormFillSuggestion` (
    `id` VARCHAR(191) NOT NULL,
    `ocrJobId` VARCHAR(191) NOT NULL,
    `targetEntity` VARCHAR(191) NOT NULL,
    `targetEntityId` VARCHAR(191) NOT NULL,
    `formField` VARCHAR(191) NOT NULL,
    `formFieldLabel` VARCHAR(191) NOT NULL,
    `suggestedValue` VARCHAR(191) NOT NULL,
    `currentValue` VARCHAR(191) NOT NULL DEFAULT '',
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `sourceDocument` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceField` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedBy` VARCHAR(191) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `isHighRisk` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalRequest` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `requestedById` VARCHAR(191) NOT NULL,
    `requestedByName` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NULL,
    `assignedToName` VARCHAR(191) NOT NULL DEFAULT '',
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `payload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `deadline` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `rejectedById` VARCHAR(191) NULL,
    `rejectedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `rejectedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IntegrationAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `actorName` VARCHAR(191) NOT NULL,
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL DEFAULT '',
    `resourceId` VARCHAR(191) NOT NULL DEFAULT '',
    `provider` VARCHAR(191) NOT NULL DEFAULT '',
    `channel` VARCHAR(191) NOT NULL DEFAULT '',
    `previousState` VARCHAR(191) NOT NULL DEFAULT '{}',
    `newState` VARCHAR(191) NOT NULL DEFAULT '{}',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `requestId` VARCHAR(191) NOT NULL DEFAULT '',
    `approvalRef` VARCHAR(191) NOT NULL DEFAULT '',
    `result` VARCHAR(191) NOT NULL DEFAULT 'success',
    `errorMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationConsent` (
    `id` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `contactType` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `consentGivenAt` DATETIME(3) NULL,
    `consentText` VARCHAR(191) NOT NULL DEFAULT '',
    `optedOutAt` DATETIME(3) NULL,
    `optOutReason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderErrorLog` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `integrationId` VARCHAR(191) NOT NULL DEFAULT '',
    `errorCode` VARCHAR(191) NOT NULL,
    `errorMessage` VARCHAR(191) NOT NULL,
    `requestPath` VARCHAR(191) NOT NULL DEFAULT '',
    `responseStatus` INTEGER NOT NULL DEFAULT 0,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentApproval` (
    `id` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT '',
    `campaignId` VARCHAR(191) NOT NULL DEFAULT '',
    `mediaUrls` VARCHAR(191) NOT NULL DEFAULT '[]',
    `scheduledFor` DATETIME(3) NULL,
    `submittedById` VARCHAR(191) NOT NULL,
    `submittedByName` VARCHAR(191) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewNotes` VARCHAR(191) NOT NULL DEFAULT '',
    `publishedAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
    `providerPostId` VARCHAR(191) NOT NULL DEFAULT '',
    `auditHistory` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppOfficialNumber` (
    `id` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `normalizedPhone` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL DEFAULT '',
    `ownerType` VARCHAR(191) NOT NULL DEFAULT 'ALO_MAIN',
    `employeeOwnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `employeeOwnerName` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `metaPhoneNumberId` VARCHAR(191) NOT NULL DEFAULT '',
    `metaBusinessAccountId` VARCHAR(191) NOT NULL DEFAULT '',
    `connectionStatus` VARCHAR(191) NOT NULL DEFAULT 'disconnected',
    `activeStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    `isDefaultSender` BOOLEAN NOT NULL DEFAULT false,
    `isComplaintSender` BOOLEAN NOT NULL DEFAULT false,
    `isFollowUpSender` BOOLEAN NOT NULL DEFAULT false,
    `isSupport247` BOOLEAN NOT NULL DEFAULT false,
    `purpose` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppOfficialNumber_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `WhatsAppOfficialNumber_normalizedPhone_key`(`normalizedPhone`),
    INDEX `WhatsAppOfficialNumber_ownerType_idx`(`ownerType`),
    INDEX `WhatsAppOfficialNumber_branch_idx`(`branch`),
    INDEX `WhatsAppOfficialNumber_connectionStatus_idx`(`connectionStatus`),
    INDEX `WhatsAppOfficialNumber_activeStatus_idx`(`activeStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppNumberAssignmentAudit` (
    `id` VARCHAR(191) NOT NULL,
    `numberId` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `changedById` VARCHAR(191) NOT NULL DEFAULT '',
    `changedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `changedByRole` VARCHAR(191) NOT NULL DEFAULT '',
    `previousOwnerType` VARCHAR(191) NOT NULL DEFAULT '',
    `newOwnerType` VARCHAR(191) NOT NULL DEFAULT '',
    `previousEmployee` VARCHAR(191) NOT NULL DEFAULT '',
    `newEmployee` VARCHAR(191) NOT NULL DEFAULT '',
    `previousBranch` VARCHAR(191) NOT NULL DEFAULT '',
    `newBranch` VARCHAR(191) NOT NULL DEFAULT '',
    `previousValue` VARCHAR(191) NOT NULL DEFAULT '{}',
    `newValue` VARCHAR(191) NOT NULL DEFAULT '{}',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WhatsAppNumberAssignmentAudit_numberId_idx`(`numberId`),
    INDEX `WhatsAppNumberAssignmentAudit_changedById_idx`(`changedById`),
    INDEX `WhatsAppNumberAssignmentAudit_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppContact` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `normalizedPhone` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NOT NULL DEFAULT '',
    `profileName` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `partnerId` VARCHAR(191) NOT NULL DEFAULT '',
    `firstContactAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastContactAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `source` VARCHAR(191) NOT NULL DEFAULT 'WHATSAPP',
    `isBlocked` BOOLEAN NOT NULL DEFAULT false,
    `isOptedOut` BOOLEAN NOT NULL DEFAULT false,
    `optedOutAt` DATETIME(3) NULL,
    `optOutReason` VARCHAR(191) NOT NULL DEFAULT '',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppContact_phone_key`(`phone`),
    UNIQUE INDEX `WhatsAppContact_normalizedPhone_key`(`normalizedPhone`),
    INDEX `WhatsAppContact_studentId_idx`(`studentId`),
    INDEX `WhatsAppContact_leadId_idx`(`leadId`),
    INDEX `WhatsAppContact_normalizedPhone_idx`(`normalizedPhone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppMessageArchive` (
    `id` VARCHAR(191) NOT NULL,
    `whatsappMessageId` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL DEFAULT '',
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `senderPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `receiverPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `senderNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `messageType` VARCHAR(191) NOT NULL DEFAULT 'text',
    `messageBody` VARCHAR(191) NOT NULL DEFAULT '',
    `mediaId` VARCHAR(191) NOT NULL DEFAULT '',
    `mediaUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `direction` VARCHAR(191) NOT NULL DEFAULT 'inbound',
    `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT 'sent',
    `readStatus` VARCHAR(191) NOT NULL DEFAULT 'unread',
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `aiReviewed` BOOLEAN NOT NULL DEFAULT false,
    `employeeSenderId` VARCHAR(191) NOT NULL DEFAULT '',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `isHidden` BOOLEAN NOT NULL DEFAULT false,
    `hiddenReason` VARCHAR(191) NOT NULL DEFAULT '',
    `rawEventId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WhatsAppMessageArchive_whatsappMessageId_key`(`whatsappMessageId`),
    INDEX `WhatsAppMessageArchive_conversationId_idx`(`conversationId`),
    INDEX `WhatsAppMessageArchive_studentId_idx`(`studentId`),
    INDEX `WhatsAppMessageArchive_leadId_idx`(`leadId`),
    INDEX `WhatsAppMessageArchive_senderPhone_idx`(`senderPhone`),
    INDEX `WhatsAppMessageArchive_receiverPhone_idx`(`receiverPhone`),
    INDEX `WhatsAppMessageArchive_timestamp_idx`(`timestamp`),
    INDEX `WhatsAppMessageArchive_direction_idx`(`direction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppFollowUpTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `templateName` VARCHAR(191) NOT NULL,
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `day` INTEGER NOT NULL DEFAULT 3,
    `purpose` VARCHAR(191) NOT NULL DEFAULT 'follow_up',
    `messageBody` VARCHAR(191) NOT NULL DEFAULT '',
    `variables` VARCHAR(191) NOT NULL DEFAULT '["{{name}}","{{student_code}}","{{portal_link}}","{{counselor_name}}","{{branch_name}}","{{country}}","{{intake}}"]',
    `metaTemplateName` VARCHAR(191) NOT NULL DEFAULT '',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `activeStatus` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppFollowUpTemplate_templateName_key`(`templateName`),
    INDEX `WhatsAppFollowUpTemplate_day_idx`(`day`),
    INDEX `WhatsAppFollowUpTemplate_language_idx`(`language`),
    INDEX `WhatsAppFollowUpTemplate_activeStatus_idx`(`activeStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppFollowUpSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `contactPhone` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL DEFAULT '',
    `scheduledDay` INTEGER NOT NULL DEFAULT 3,
    `scheduledAt` DATETIME(3) NOT NULL,
    `sentAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'scheduled',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `lastError` VARCHAR(191) NOT NULL DEFAULT '',
    `isOptedOut` BOOLEAN NOT NULL DEFAULT false,
    `isPaused` BOOLEAN NOT NULL DEFAULT false,
    `pauseReason` VARCHAR(191) NOT NULL DEFAULT '',
    `messageId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WhatsAppFollowUpSchedule_studentId_idx`(`studentId`),
    INDEX `WhatsAppFollowUpSchedule_leadId_idx`(`leadId`),
    INDEX `WhatsAppFollowUpSchedule_scheduledAt_idx`(`scheduledAt`),
    INDEX `WhatsAppFollowUpSchedule_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentPortalInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `tokenHash` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `isUsed` BOOLEAN NOT NULL DEFAULT false,
    `usedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `invitationSent` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NULL,
    `openedAt` DATETIME(3) NULL,
    `activatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentPortalInvitation_tokenHash_key`(`tokenHash`),
    INDEX `StudentPortalInvitation_studentId_idx`(`studentId`),
    INDEX `StudentPortalInvitation_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentSecurityIncident` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `attemptedById` VARCHAR(191) NOT NULL DEFAULT '',
    `attemptedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `attemptedByRole` VARCHAR(191) NOT NULL DEFAULT '',
    `recipient` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientType` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL DEFAULT 'send',
    `severity` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `blocked` BOOLEAN NOT NULL DEFAULT false,
    `notifiedManager` BOOLEAN NOT NULL DEFAULT false,
    `notifiedCeo` BOOLEAN NOT NULL DEFAULT false,
    `resolvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DocumentSecurityIncident_studentId_idx`(`studentId`),
    INDEX `DocumentSecurityIncident_documentId_idx`(`documentId`),
    INDEX `DocumentSecurityIncident_severity_idx`(`severity`),
    INDEX `DocumentSecurityIncident_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DashboardAlarm` (
    `id` VARCHAR(191) NOT NULL,
    `alarmType` VARCHAR(191) NOT NULL DEFAULT 'SLA_OVERDUE',
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `conversationId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentName` VARCHAR(191) NOT NULL DEFAULT '',
    `maskedPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `unmaskedPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedEmployee` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedRole` VARCHAR(191) NOT NULL DEFAULT '',
    `slaElapsedMinutes` INTEGER NOT NULL DEFAULT 0,
    `escalationLevel` INTEGER NOT NULL DEFAULT 1,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'high',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `acknowledgedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `acknowledgedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `resolvedAt` DATETIME(3) NULL,
    `soundEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DashboardAlarm_status_idx`(`status`),
    INDEX `DashboardAlarm_escalationLevel_idx`(`escalationLevel`),
    INDEX `DashboardAlarm_assignedEmployee_idx`(`assignedEmployee`),
    INDEX `DashboardAlarm_branch_idx`(`branch`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiIntentLog` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `messageId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `intent` VARCHAR(191) NOT NULL DEFAULT 'general',
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `model` VARCHAR(191) NOT NULL DEFAULT 'openrouter',
    `decisionSource` VARCHAR(191) NOT NULL DEFAULT 'ai',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiIntentLog_studentId_idx`(`studentId`),
    INDEX `AiIntentLog_intent_idx`(`intent`),
    INDEX `AiIntentLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiSentimentLog` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `messageId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `sentiment` VARCHAR(191) NOT NULL DEFAULT 'neutral',
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `isHighRisk` BOOLEAN NOT NULL DEFAULT false,
    `isUrgent` BOOLEAN NOT NULL DEFAULT false,
    `model` VARCHAR(191) NOT NULL DEFAULT 'openrouter',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiSentimentLog_studentId_idx`(`studentId`),
    INDEX `AiSentimentLog_sentiment_idx`(`sentiment`),
    INDEX `AiSentimentLog_isHighRisk_idx`(`isHighRisk`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiLeadScore` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL DEFAULT '',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `factors` VARCHAR(191) NOT NULL DEFAULT '{}',
    `explanation` VARCHAR(191) NOT NULL DEFAULT '',
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiLeadScore_studentId_key`(`studentId`),
    INDEX `AiLeadScore_score_idx`(`score`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationRoutingLog` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `conversationId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `fromNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `toNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `routingReason` VARCHAR(191) NOT NULL DEFAULT '',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `assignedToId` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedToName` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `fallbackUsed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationRoutingLog_studentId_idx`(`studentId`),
    INDEX `CommunicationRoutingLog_threadId_idx`(`threadId`),
    INDEX `CommunicationRoutingLog_routingReason_idx`(`routingReason`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppRetryQueue` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientPhone` VARCHAR(191) NOT NULL,
    `messageBody` VARCHAR(191) NOT NULL DEFAULT '',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `maxAttempts` INTEGER NOT NULL DEFAULT 3,
    `lastError` VARCHAR(191) NOT NULL DEFAULT '',
    `nextRetryAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WhatsAppRetryQueue_status_idx`(`status`),
    INDEX `WhatsAppRetryQueue_nextRetryAt_idx`(`nextRetryAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CronJobLog` (
    `id` VARCHAR(191) NOT NULL,
    `jobName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'running',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CronJobLog_jobName_idx`(`jobName`),
    INDEX `CronJobLog_status_idx`(`status`),
    INDEX `CronJobLog_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationDeleteRequest` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL DEFAULT '',
    `requestedById` VARCHAR(191) NOT NULL,
    `requestedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewedById` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CommunicationDeleteRequest_status_idx`(`status`),
    INDEX `CommunicationDeleteRequest_messageId_idx`(`messageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationNoteVersion` (
    `id` VARCHAR(191) NOT NULL,
    `noteId` VARCHAR(191) NOT NULL,
    `oldContent` VARCHAR(191) NOT NULL DEFAULT '',
    `newContent` VARCHAR(191) NOT NULL DEFAULT '',
    `changedById` VARCHAR(191) NOT NULL DEFAULT '',
    `changedByName` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationNoteVersion_noteId_idx`(`noteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppAnalyticsDaily` (
    `id` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `totalConversations` INTEGER NOT NULL DEFAULT 0,
    `newLeads` INTEGER NOT NULL DEFAULT 0,
    `activeConversations` INTEGER NOT NULL DEFAULT 0,
    `unreadConversations` INTEGER NOT NULL DEFAULT 0,
    `aiHandled` INTEGER NOT NULL DEFAULT 0,
    `humanHandled` INTEGER NOT NULL DEFAULT 0,
    `aiHandovers` INTEGER NOT NULL DEFAULT 0,
    `avgResponseTime` DOUBLE NOT NULL DEFAULT 0,
    `slaBreaches` INTEGER NOT NULL DEFAULT 0,
    `escalations` INTEGER NOT NULL DEFAULT 0,
    `urgentCases` INTEGER NOT NULL DEFAULT 0,
    `followUpSent` INTEGER NOT NULL DEFAULT 0,
    `followUpResponses` INTEGER NOT NULL DEFAULT 0,
    `conversionRate` DOUBLE NOT NULL DEFAULT 0,
    `documentVolume` INTEGER NOT NULL DEFAULT 0,
    `complaintVolume` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WhatsAppAnalyticsDaily_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `parentId` VARCHAR(191) NOT NULL DEFAULT '',
    `managerId` VARCHAR(191) NOT NULL DEFAULT '',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeDepartment_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeBranch` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL DEFAULT '',
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT 'Bangladesh',
    `managerId` VARCHAR(191) NOT NULL DEFAULT '',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeBranch_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeOffice` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL DEFAULT '',
    `branchId` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `managerId` VARCHAR(191) NOT NULL DEFAULT '',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeOffice_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeLeave` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `leaveType` VARCHAR(191) NOT NULL DEFAULT 'casual',
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `totalDays` DOUBLE NOT NULL DEFAULT 0,
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `documentUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeeLeave_employeeId_idx`(`employeeId`),
    INDEX `EmployeeLeave_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeLeaveBalance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `year` VARCHAR(191) NOT NULL DEFAULT '',
    `casualTotal` INTEGER NOT NULL DEFAULT 10,
    `casualUsed` INTEGER NOT NULL DEFAULT 0,
    `casualRemaining` INTEGER NOT NULL DEFAULT 10,
    `annualTotal` INTEGER NOT NULL DEFAULT 15,
    `annualUsed` INTEGER NOT NULL DEFAULT 0,
    `annualRemaining` INTEGER NOT NULL DEFAULT 15,
    `medicalTotal` INTEGER NOT NULL DEFAULT 12,
    `medicalUsed` INTEGER NOT NULL DEFAULT 0,
    `medicalRemaining` INTEGER NOT NULL DEFAULT 12,
    `maternityTotal` INTEGER NOT NULL DEFAULT 120,
    `maternityUsed` INTEGER NOT NULL DEFAULT 0,
    `maternityRemaining` INTEGER NOT NULL DEFAULT 120,
    `paternityTotal` INTEGER NOT NULL DEFAULT 7,
    `paternityUsed` INTEGER NOT NULL DEFAULT 0,
    `paternityRemaining` INTEGER NOT NULL DEFAULT 7,
    `lwpTotal` INTEGER NOT NULL DEFAULT 0,
    `lwpUsed` INTEGER NOT NULL DEFAULT 0,
    `compOffTotal` INTEGER NOT NULL DEFAULT 0,
    `compOffUsed` INTEGER NOT NULL DEFAULT 0,
    `compOffRemaining` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeLeaveBalance_employeeId_key`(`employeeId`),
    INDEX `EmployeeLeaveBalance_employeeId_idx`(`employeeId`),
    INDEX `EmployeeLeaveBalance_year_idx`(`year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePayroll` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `bonus` DOUBLE NOT NULL DEFAULT 0,
    `overtime` DOUBLE NOT NULL DEFAULT 0,
    `loanDeduction` DOUBLE NOT NULL DEFAULT 0,
    `advanceDeduction` DOUBLE NOT NULL DEFAULT 0,
    `taxDeduction` DOUBLE NOT NULL DEFAULT 0,
    `pfDeduction` DOUBLE NOT NULL DEFAULT 0,
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `preparedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `monthYear` VARCHAR(191) NOT NULL,
    `employeeCount` INTEGER NOT NULL DEFAULT 0,
    `totalGross` DOUBLE NOT NULL DEFAULT 0,
    `totalDeduction` DOUBLE NOT NULL DEFAULT 0,
    `totalNet` DOUBLE NOT NULL DEFAULT 0,

    INDEX `EmployeePayroll_employeeId_idx`(`employeeId`),
    INDEX `EmployeePayroll_period_idx`(`period`),
    INDEX `EmployeePayroll_status_idx`(`status`),
    UNIQUE INDEX `EmployeePayroll_employeeId_period_key`(`employeeId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePayrollItem` (
    `id` VARCHAR(191) NOT NULL,
    `payrollId` VARCHAR(191) NOT NULL,
    `itemType` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employeeId` VARCHAR(191) NOT NULL,
    `employeeName` VARCHAR(191) NOT NULL DEFAULT '',
    `basicSalary` DOUBLE NOT NULL DEFAULT 0,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `tax` DOUBLE NOT NULL DEFAULT 0,
    `netSalary` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',

    INDEX `EmployeePayrollItem_payrollId_idx`(`payrollId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDevice` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NOT NULL DEFAULT '',
    `deviceType` VARCHAR(191) NOT NULL DEFAULT 'laptop',
    `deviceId` VARCHAR(191) NOT NULL DEFAULT '',
    `serialNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `assetTag` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedDate` VARCHAR(191) NOT NULL DEFAULT '',
    `warranty` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'assigned',
    `returnedDate` VARCHAR(191) NOT NULL DEFAULT '',
    `condition` VARCHAR(191) NOT NULL DEFAULT 'good',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `browser` VARCHAR(191) NOT NULL DEFAULT '',
    `os` VARCHAR(191) NOT NULL DEFAULT '',
    `fingerprint` VARCHAR(191) NOT NULL DEFAULT '',
    `isTrusted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeeDevice_employeeId_idx`(`employeeId`),
    INDEX `EmployeeDevice_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeLoginLog` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
    `userId` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `browser` VARCHAR(191) NOT NULL DEFAULT '',
    `os` VARCHAR(191) NOT NULL DEFAULT '',
    `device` VARCHAR(191) NOT NULL DEFAULT '',
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'success',
    `isSuccess` BOOLEAN NOT NULL DEFAULT true,
    `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutAt` DATETIME(3) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
    `sessionId` VARCHAR(191) NOT NULL DEFAULT '',
    `fingerprint` VARCHAR(191) NOT NULL DEFAULT '',

    INDEX `EmployeeLoginLog_employeeId_idx`(`employeeId`),
    INDEX `EmployeeLoginLog_userId_idx`(`userId`),
    INDEX `EmployeeLoginLog_loginAt_idx`(`loginAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeAgreement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'appointment_letter',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `version` INTEGER NOT NULL DEFAULT 1,
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeAgreementAcceptance` (
    `id` VARCHAR(191) NOT NULL,
    `agreementId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `acceptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `device` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `signatureType` VARCHAR(191) NOT NULL DEFAULT 'digital_acceptance',

    INDEX `EmployeeAgreementAcceptance_employeeId_idx`(`employeeId`),
    UNIQUE INDEX `EmployeeAgreementAcceptance_agreementId_employeeId_version_key`(`agreementId`, `employeeId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDocumentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `agreementId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `filePath` VARCHAR(191) NOT NULL DEFAULT '',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileHash` VARCHAR(191) NOT NULL DEFAULT '',
    `uploadedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'current',
    `reviewerId` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewNote` VARCHAR(191) NOT NULL DEFAULT '',
    `effectiveDate` VARCHAR(191) NOT NULL DEFAULT '',
    `supersededDate` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `employeeDocumentId` VARCHAR(191) NULL,

    INDEX `EmployeeDocumentVersion_documentId_idx`(`documentId`),
    INDEX `EmployeeDocumentVersion_agreementId_idx`(`agreementId`),
    INDEX `EmployeeDocumentVersion_status_idx`(`status`),
    INDEX `EmployeeDocumentVersion_employeeDocumentId_idx`(`employeeDocumentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePermissionRequest` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL DEFAULT 'view',
    `scopeType` VARCHAR(191) NOT NULL DEFAULT 'own',
    `scopeId` VARCHAR(191) NOT NULL DEFAULT '',
    `duration` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'requested',
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeePermissionRequest_employeeId_idx`(`employeeId`),
    INDEX `EmployeePermissionRequest_status_idx`(`status`),
    INDEX `EmployeePermissionRequest_featureKey_idx`(`featureKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeTemporaryPermission` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL DEFAULT 'view',
    `scopeType` VARCHAR(191) NOT NULL DEFAULT 'own',
    `scopeId` VARCHAR(191) NOT NULL DEFAULT '',
    `grantedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `permissionKey` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `EmployeeTemporaryPermission_employeeId_idx`(`employeeId`),
    INDEX `EmployeeTemporaryPermission_isActive_idx`(`isActive`),
    INDEX `EmployeeTemporaryPermission_endDate_idx`(`endDate`),
    INDEX `EmployeeTemporaryPermission_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeSecurityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
    `eventType` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `isResolved` BOOLEAN NOT NULL DEFAULT false,
    `resolvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeSecurityEvent_employeeId_idx`(`employeeId`),
    INDEX `EmployeeSecurityEvent_eventType_idx`(`eventType`),
    INDEX `EmployeeSecurityEvent_severity_idx`(`severity`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeReassignment` (
    `id` VARCHAR(191) NOT NULL,
    `fromEmployeeId` VARCHAR(191) NOT NULL,
    `toEmployeeId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedStudents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assignedApplications` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assignedTasks` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assignedLeads` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `fromDepartment` VARCHAR(191) NOT NULL DEFAULT '',
    `toDepartment` VARCHAR(191) NOT NULL DEFAULT '',
    `fromBranch` VARCHAR(191) NOT NULL DEFAULT '',
    `toBranch` VARCHAR(191) NOT NULL DEFAULT '',
    `effectiveDate` VARCHAR(191) NOT NULL DEFAULT '',
    `reassignedBy` VARCHAR(191) NOT NULL,

    INDEX `EmployeeReassignment_fromEmployeeId_idx`(`fromEmployeeId`),
    INDEX `EmployeeReassignment_toEmployeeId_idx`(`toEmployeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `actingAsId` VARCHAR(191) NOT NULL DEFAULT '',
    `actingAsRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL DEFAULT '',
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `targetType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `oldValue` LONGTEXT NOT NULL DEFAULT '{}',
    `newValue` LONGTEXT NOT NULL DEFAULT '{}',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `approvalId` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `sessionId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeAuditLog_actorId_idx`(`actorId`),
    INDEX `EmployeeAuditLog_employeeId_idx`(`employeeId`),
    INDEX `EmployeeAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `EmployeeAuditLog_action_idx`(`action`),
    INDEX `EmployeeAuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeePermissionPackageAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeePermissionPackageAssignment_employeeId_idx`(`employeeId`),
    INDEX `EmployeePermissionPackageAssignment_packageId_idx`(`packageId`),
    INDEX `EmployeePermissionPackageAssignment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeBreakGlassAccess` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `approverId` VARCHAR(191) NOT NULL DEFAULT '',
    `scopeType` VARCHAR(191) NOT NULL DEFAULT 'global',
    `scopeId` VARCHAR(191) NOT NULL DEFAULT '',
    `startAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeeBreakGlassAccess_employeeId_idx`(`employeeId`),
    INDEX `EmployeeBreakGlassAccess_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_tests` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NOT NULL DEFAULT '',
    `shortDescription` TEXT NOT NULL DEFAULT '',
    `longDescription` LONGTEXT NOT NULL DEFAULT '',
    `testType` VARCHAR(191) NOT NULL DEFAULT 'english_proficiency',
    `provider` VARCHAR(191) NOT NULL DEFAULT '',
    `logo` VARCHAR(191) NOT NULL DEFAULT '',
    `icon` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `format` VARCHAR(191) NOT NULL DEFAULT '',
    `durationMinutes` INTEGER NOT NULL DEFAULT 0,
    `durationDisplay` VARCHAR(191) NOT NULL DEFAULT '',
    `scoringSystem` VARCHAR(191) NOT NULL DEFAULT '',
    `resultTimeline` VARCHAR(191) NOT NULL DEFAULT '',
    `costSummary` VARCHAR(191) NOT NULL DEFAULT '',
    `validitySummary` VARCHAR(191) NOT NULL DEFAULT '',
    `bestFor` TEXT NOT NULL DEFAULT '',
    `acceptanceSummary` TEXT NOT NULL DEFAULT '',
    `difficultyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `lastVerifiedAt` DATETIME(3) NULL,
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `english_tests_slug_key`(`slug`),
    INDEX `english_tests_slug_idx`(`slug`),
    INDEX `english_tests_status_idx`(`status`),
    INDEX `english_tests_testType_idx`(`testType`),
    INDEX `english_tests_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_modules` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `moduleName` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `durationMinutes` INTEGER NOT NULL DEFAULT 0,
    `durationDisplay` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL DEFAULT '',
    `skillsAssessed` TEXT NOT NULL DEFAULT '',
    `questionFormat` TEXT NOT NULL DEFAULT '',
    `preparationTips` TEXT NOT NULL DEFAULT '',
    `commonChallenges` TEXT NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_test_modules_testId_idx`(`testId`),
    INDEX `english_test_modules_slug_idx`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_acceptance` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `countryName` VARCHAR(191) NOT NULL DEFAULT '',
    `countrySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `acceptanceType` VARCHAR(191) NOT NULL DEFAULT 'university',
    `summary` TEXT NOT NULL DEFAULT '',
    `minimumNote` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_test_acceptance_testId_idx`(`testId`),
    INDEX `english_test_acceptance_countryId_idx`(`countryId`),
    INDEX `english_test_acceptance_countrySlug_idx`(`countrySlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_requirements` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `countryName` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `minimumScore` VARCHAR(191) NOT NULL DEFAULT '',
    `componentRequirements` TEXT NOT NULL DEFAULT '',
    `waiverAvailable` BOOLEAN NOT NULL DEFAULT false,
    `remarks` TEXT NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_test_requirements_testId_idx`(`testId`),
    INDEX `english_test_requirements_countryId_idx`(`countryId`),
    INDEX `english_test_requirements_universityId_idx`(`universityId`),
    INDEX `english_test_requirements_courseId_idx`(`courseId`),
    INDEX `english_test_requirements_studyLevel_idx`(`studyLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_faqs` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_test_faqs_testId_idx`(`testId`),
    INDEX `english_test_faqs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_resources` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT '',
    `resourceType` VARCHAR(191) NOT NULL DEFAULT 'guide',
    `resourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `isExternal` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_test_resources_testId_idx`(`testId`),
    INDEX `english_test_resources_resourceType_idx`(`resourceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_success_stories` (
    `id` VARCHAR(191) NOT NULL,
    `testId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentName` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `countryName` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `previousScore` VARCHAR(191) NOT NULL DEFAULT '',
    `finalScore` VARCHAR(191) NOT NULL DEFAULT '',
    `destination` VARCHAR(191) NOT NULL DEFAULT '',
    `testimonial` TEXT NOT NULL DEFAULT '',
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `consentStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_test_success_stories_testId_idx`(`testId`),
    INDEX `english_test_success_stories_consentStatus_idx`(`consentStatus`),
    INDEX `english_test_success_stories_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `language_prep_leads` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `countryName` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `testId` VARCHAR(191) NOT NULL DEFAULT '',
    `testName` VARCHAR(191) NOT NULL DEFAULT '',
    `currentScore` VARCHAR(191) NOT NULL DEFAULT '',
    `targetScore` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `currentLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredFormat` VARCHAR(191) NOT NULL DEFAULT '',
    `preparationTime` VARCHAR(191) NOT NULL DEFAULT '',
    `source` VARCHAR(191) NOT NULL DEFAULT 'language_prep',
    `sourceSection` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'new',
    `assignedCounselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `language_prep_leads_testId_idx`(`testId`),
    INDEX `language_prep_leads_countryId_idx`(`countryId`),
    INDEX `language_prep_leads_status_idx`(`status`),
    INDEX `language_prep_leads_source_idx`(`source`),
    INDEX `language_prep_leads_sourceSection_idx`(`sourceSection`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_english_prep_profiles` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `preferredTest` VARCHAR(191) NOT NULL DEFAULT '',
    `preferredTestId` VARCHAR(191) NOT NULL DEFAULT '',
    `currentTest` VARCHAR(191) NOT NULL DEFAULT '',
    `currentTestId` VARCHAR(191) NOT NULL DEFAULT '',
    `currentScore` VARCHAR(191) NOT NULL DEFAULT '',
    `targetScore` VARCHAR(191) NOT NULL DEFAULT '',
    `testDate` DATETIME(3) NULL,
    `preparationStatus` VARCHAR(191) NOT NULL DEFAULT 'not_started',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `weakestModule` VARCHAR(191) NOT NULL DEFAULT '',
    `strongestModule` VARCHAR(191) NOT NULL DEFAULT '',
    `recommendedTest` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorRecommendation` TEXT NOT NULL DEFAULT '',
    `upcomingMock` DATETIME(3) NULL,
    `lastMockScore` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_english_prep_profiles_studentId_key`(`studentId`),
    INDEX `student_english_prep_profiles_studentId_idx`(`studentId`),
    INDEX `student_english_prep_profiles_preferredTestId_idx`(`preferredTestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_test_comparisons` (
    `id` VARCHAR(191) NOT NULL,
    `testIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL DEFAULT '',
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `b2b_providers` (
    `id` VARCHAR(191) NOT NULL,
    `providerCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `providerType` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL_B2B',
    `countryCoverage` VARCHAR(191) NOT NULL DEFAULT '[]',
    `universityCoverage` VARCHAR(191) NOT NULL DEFAULT '[]',
    `contactPerson` VARCHAR(191) NOT NULL DEFAULT '',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `portalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `loginNote` TEXT NOT NULL DEFAULT '',
    `agreementFile` VARCHAR(191) NOT NULL DEFAULT '',
    `commissionRule` TEXT NOT NULL DEFAULT '',
    `paymentCondition` TEXT NOT NULL DEFAULT '',
    `claimStage` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `lastReviewedAt` DATETIME(3) NULL,
    `internalNote` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `b2b_providers_providerCode_key`(`providerCode`),
    INDEX `b2b_providers_providerType_idx`(`providerType`),
    INDEX `b2b_providers_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `b2b_applications` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `b2bProviderId` VARCHAR(191) NOT NULL,
    `b2bType` VARCHAR(191) NOT NULL DEFAULT 'B2B_OUTBOUND',
    `b2bReference` VARCHAR(191) NOT NULL DEFAULT '',
    `submissionRoute` VARCHAR(191) NOT NULL DEFAULT 'B2B_OUTBOUND',
    `submittedDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `acknowledgementNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `portalReference` VARCHAR(191) NOT NULL DEFAULT '',
    `universityApplicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `b2bStatus` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
    `b2bCommissionType` VARCHAR(191) NOT NULL DEFAULT '',
    `b2bCommissionAmount` DOUBLE NOT NULL DEFAULT 0,
    `b2bPaymentCondition` VARCHAR(191) NOT NULL DEFAULT '',
    `b2bClaimStage` VARCHAR(191) NOT NULL DEFAULT 'NOT_CLAIMED',
    `b2bInternalNote` TEXT NOT NULL DEFAULT '',
    `b2bAttachments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `lastFollowupAt` DATETIME(3) NULL,
    `nextFollowupAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `b2b_applications_applicationId_idx`(`applicationId`),
    INDEX `b2b_applications_b2bProviderId_idx`(`b2bProviderId`),
    INDEX `b2b_applications_b2bType_idx`(`b2bType`),
    INDEX `b2b_applications_b2bStatus_idx`(`b2bStatus`),
    UNIQUE INDEX `b2b_applications_applicationId_b2bProviderId_b2bReference_key`(`applicationId`, `b2bProviderId`, `b2bReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_status_logs` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `oldStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `newStatus` VARCHAR(191) NOT NULL,
    `safeStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `changedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'public_safe',
    `note` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_status_logs_applicationId_idx`(`applicationId`),
    INDEX `application_status_logs_newStatus_idx`(`newStatus`),
    INDEX `application_status_logs_visibility_idx`(`visibility`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_comments` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL DEFAULT '',
    `role` VARCHAR(191) NOT NULL DEFAULT 'APPLICATION_TEAM',
    `commentType` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'internal',
    `commentText` TEXT NOT NULL DEFAULT '',
    `attachmentPath` VARCHAR(191) NOT NULL DEFAULT '',
    `isB2bConfidential` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_comments_applicationId_idx`(`applicationId`),
    INDEX `application_comments_visibility_idx`(`visibility`),
    INDEX `application_comments_isB2bConfidential_idx`(`isB2bConfidential`),
    INDEX `application_comments_commentType_idx`(`commentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_documents` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentType` VARCHAR(191) NOT NULL DEFAULT '',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewerId` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewerNote` TEXT NOT NULL DEFAULT '',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'internal',
    `version` INTEGER NOT NULL DEFAULT 1,
    `isB2bConfidential` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `reviewNote` VARCHAR(191) NULL,

    INDEX `application_documents_applicationId_idx`(`applicationId`),
    INDEX `application_documents_studentId_idx`(`studentId`),
    INDEX `application_documents_documentType_idx`(`documentType`),
    INDEX `application_documents_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_deadlines` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `deadlineType` VARCHAR(191) NOT NULL DEFAULT 'APPLICATION_DEADLINE',
    `deadlineDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `assignedTo` VARCHAR(191) NOT NULL DEFAULT '',
    `reminderSent` BOOLEAN NOT NULL DEFAULT false,
    `note` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_deadlines_applicationId_idx`(`applicationId`),
    INDEX `application_deadlines_deadlineType_idx`(`deadlineType`),
    INDEX `application_deadlines_deadlineDate_idx`(`deadlineDate`),
    INDEX `application_deadlines_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_tasks` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `taskTitle` VARCHAR(191) NOT NULL,
    `taskDescription` TEXT NOT NULL DEFAULT '',
    `assignedTo` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedToName` VARCHAR(191) NOT NULL DEFAULT '',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `application_tasks_applicationId_idx`(`applicationId`),
    INDEX `application_tasks_assignedTo_idx`(`assignedTo`),
    INDEX `application_tasks_status_idx`(`status`),
    INDEX `application_tasks_priority_idx`(`priority`),
    INDEX `application_tasks_dueDate_idx`(`dueDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `recipientType` VARCHAR(191) NOT NULL DEFAULT 'STUDENT',
    `recipientId` VARCHAR(191) NOT NULL DEFAULT '',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'portal',
    `templateName` VARCHAR(191) NOT NULL DEFAULT '',
    `message` TEXT NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_notifications_applicationId_idx`(`applicationId`),
    INDEX `application_notifications_recipientType_idx`(`recipientType`),
    INDEX `application_notifications_recipientId_idx`(`recipientId`),
    INDEX `application_notifications_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_offers` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `offerStatus` VARCHAR(191) NOT NULL DEFAULT 'DECISION_PENDING',
    `offerLetterUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `offerConditions` TEXT NOT NULL DEFAULT '',
    `conditionDeadline` DATETIME(3) NULL,
    `scholarship` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipAmount` DOUBLE NOT NULL DEFAULT 0,
    `depositAmount` DOUBLE NOT NULL DEFAULT 0,
    `depositDeadline` DATETIME(3) NULL,
    `decisionDate` DATETIME(3) NULL,
    `decisionNote` TEXT NOT NULL DEFAULT '',
    `studentNotified` BOOLEAN NOT NULL DEFAULT false,
    `partnerNotified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `offerType` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `offerDate` VARCHAR(191) NOT NULL DEFAULT '',
    `expiryDate` VARCHAR(191) NOT NULL DEFAULT '',
    `conditions` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `application_offers_applicationId_key`(`applicationId`),
    INDEX `application_offers_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_cas_i20_coe` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL DEFAULT 'CAS',
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
    `requestedDate` DATETIME(3) NULL,
    `receivedDate` DATETIME(3) NULL,
    `referenceNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `conditionNote` TEXT NOT NULL DEFAULT '',
    `nextStep` VARCHAR(191) NOT NULL DEFAULT '',
    `visaHandoverStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_READY',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `application_cas_i20_coe_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_finances` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `applicationFee` DOUBLE NOT NULL DEFAULT 0,
    `applicationFeeCurrency` VARCHAR(191) NOT NULL DEFAULT 'GBP',
    `applicationFeeStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `tuitionDeposit` DOUBLE NOT NULL DEFAULT 0,
    `depositCurrency` VARCHAR(191) NOT NULL DEFAULT 'GBP',
    `depositStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `scholarshipAmount` DOUBLE NOT NULL DEFAULT 0,
    `invoiceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `receiptUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `paymentStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `partnerCommission` DOUBLE NOT NULL DEFAULT 0,
    `b2bCommission` DOUBLE NOT NULL DEFAULT 0,
    `b2bCommissionStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_CLAIMED',
    `financeNote` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `application_finances_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL DEFAULT '',
    `resourceId` VARCHAR(191) NOT NULL DEFAULT '',
    `details` TEXT NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `beforeValue` TEXT NOT NULL DEFAULT '{}',
    `afterValue` TEXT NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_resource_resourceId_idx`(`resource`, `resourceId`),
    INDEX `audit_logs_studentId_idx`(`studentId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortDescription` TEXT NOT NULL DEFAULT '',
    `description` LONGTEXT NOT NULL DEFAULT '',
    `longDescription` LONGTEXT NOT NULL DEFAULT '',
    `content` LONGTEXT NOT NULL DEFAULT '',
    `icon` VARCHAR(191) NOT NULL DEFAULT '',
    `heroImage` VARCHAR(191) NOT NULL DEFAULT '',
    `heroTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `heroSubtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `eligibility` TEXT NOT NULL DEFAULT '',
    `requirements` TEXT NOT NULL DEFAULT '',
    `documents` TEXT NOT NULL DEFAULT '',
    `faqEnabled` BOOLEAN NOT NULL DEFAULT true,
    `ctaLabel` VARCHAR(191) NOT NULL DEFAULT '',
    `ctaUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `whatIs` LONGTEXT NOT NULL DEFAULT '',
    `whyNeeded` LONGTEXT NOT NULL DEFAULT '',
    `whoIsFor` TEXT NOT NULL DEFAULT '',
    `whatAloDoes` LONGTEXT NOT NULL DEFAULT '',
    `processSteps` TEXT NOT NULL DEFAULT '[]',
    `requiredInfo` TEXT NOT NULL DEFAULT '[]',
    `documentsNeeded` TEXT NOT NULL DEFAULT '[]',
    `timeline` TEXT NOT NULL DEFAULT '',
    `whatStudentsReceive` TEXT NOT NULL DEFAULT '[]',
    `whatNotGuaranteed` TEXT NOT NULL DEFAULT '',
    `commonMistakes` TEXT NOT NULL DEFAULT '[]',
    `documentPreparation` TEXT NOT NULL DEFAULT '',
    `checklist` TEXT NOT NULL DEFAULT '[]',
    `financialGuidance` TEXT NOT NULL DEFAULT '',
    `credibilityPrep` TEXT NOT NULL DEFAULT '',
    `documentConsistency` TEXT NOT NULL DEFAULT '',
    `applicationReview` TEXT NOT NULL DEFAULT '',
    `refusalRiskPrep` TEXT NOT NULL DEFAULT '',
    `officialDisclaimer` TEXT NOT NULL DEFAULT '',
    `findingScholarships` TEXT NOT NULL DEFAULT '',
    `eligibilityReview` TEXT NOT NULL DEFAULT '',
    `deadlineTracking` TEXT NOT NULL DEFAULT '',
    `statementSupport` TEXT NOT NULL DEFAULT '',
    `profileAssessment` TEXT NOT NULL DEFAULT '',
    `academicMatching` TEXT NOT NULL DEFAULT '',
    `englishMatching` TEXT NOT NULL DEFAULT '',
    `budgetMatching` TEXT NOT NULL DEFAULT '',
    `destinationMatching` TEXT NOT NULL DEFAULT '',
    `intakeMatching` TEXT NOT NULL DEFAULT '',
    `careerGoalMatching` TEXT NOT NULL DEFAULT '',
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` TEXT NOT NULL DEFAULT '',
    `canonicalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `ogTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `ogDescription` TEXT NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `relatedResources` VARCHAR(191) NOT NULL DEFAULT '[]',
    `relatedServices` VARCHAR(191) NOT NULL DEFAULT '[]',
    `relatedCourses` VARCHAR(191) NOT NULL DEFAULT '[]',
    `relatedCountries` VARCHAR(191) NOT NULL DEFAULT '[]',

    UNIQUE INDEX `services_slug_key`(`slug`),
    INDEX `services_slug_idx`(`slug`),
    INDEX `services_status_idx`(`status`),
    INDEX `services_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_faqs` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `service_faqs_serviceId_idx`(`serviceId`),
    INDEX `service_faqs_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT '',
    `icon` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resource_categories_slug_key`(`slug`),
    INDEX `resource_categories_slug_idx`(`slug`),
    INDEX `resource_categories_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `summary` TEXT NOT NULL DEFAULT '',
    `excerpt` TEXT NOT NULL DEFAULT '',
    `keyTakeaways` TEXT NOT NULL DEFAULT '[]',
    `detailedExplanation` LONGTEXT NOT NULL DEFAULT '',
    `whoAppliesTo` TEXT NOT NULL DEFAULT '',
    `requirements` TEXT NOT NULL DEFAULT '',
    `processSteps` TEXT NOT NULL DEFAULT '[]',
    `documents` TEXT NOT NULL DEFAULT '[]',
    `timeline` TEXT NOT NULL DEFAULT '',
    `fees` TEXT NOT NULL DEFAULT '',
    `deadlines` TEXT NOT NULL DEFAULT '',
    `commonMistakes` TEXT NOT NULL DEFAULT '[]',
    `aloGuidance` LONGTEXT NOT NULL DEFAULT '',
    `officialSources` TEXT NOT NULL DEFAULT '[]',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `featuredImage` VARCHAR(191) NOT NULL DEFAULT '',
    `countrySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `readingTime` INTEGER NOT NULL DEFAULT 5,
    `publishedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `authorId` VARCHAR(191) NOT NULL DEFAULT '',
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` TEXT NOT NULL DEFAULT '',
    `canonicalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `ogTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `ogDescription` TEXT NOT NULL DEFAULT '',
    `imageUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `content` LONGTEXT NOT NULL DEFAULT '',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resources_slug_key`(`slug`),
    INDEX `resources_slug_idx`(`slug`),
    INDEX `resources_categoryId_idx`(`categoryId`),
    INDEX `resources_status_idx`(`status`),
    INDEX `resources_sortOrder_idx`(`sortOrder`),
    INDEX `resources_countrySlug_idx`(`countrySlug`),
    INDEX `resources_studyLevel_idx`(`studyLevel`),
    INDEX `resources_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resource_faqs` (
    `id` VARCHAR(191) NOT NULL,
    `resourceId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `resource_faqs_resourceId_idx`(`resourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scholarships` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `scholarshipCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
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
    `coverage` TEXT NOT NULL DEFAULT '',
    `documentsRequired` TEXT NOT NULL DEFAULT '[]',
    `eligibility` TEXT NOT NULL DEFAULT '',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `deadlineDate` DATETIME(3) NULL,
    `openingDate` DATETIME(3) NULL,
    `closingDate` DATETIME(3) NULL,
    `overview` LONGTEXT NOT NULL DEFAULT '',
    `whoCanApply` TEXT NOT NULL DEFAULT '',
    `academicRequirements` TEXT NOT NULL DEFAULT '',
    `englishRequirements` TEXT NOT NULL DEFAULT '',
    `nationalityRequirements` TEXT NOT NULL DEFAULT '',
    `courseEligibility` TEXT NOT NULL DEFAULT '',
    `universityEligibility` TEXT NOT NULL DEFAULT '',
    `whatCovers` TEXT NOT NULL DEFAULT '',
    `whatNotCovers` TEXT NOT NULL DEFAULT '',
    `minimumRequirements` TEXT NOT NULL DEFAULT '',
    `requiredDocuments` TEXT NOT NULL DEFAULT '[]',
    `howToApply` LONGTEXT NOT NULL DEFAULT '',
    `applicationSteps` TEXT NOT NULL DEFAULT '[]',
    `selectionProcess` TEXT NOT NULL DEFAULT '',
    `resultTimeline` VARCHAR(191) NOT NULL DEFAULT '',
    `renewalConditions` TEXT NOT NULL DEFAULT '',
    `commonMistakes` TEXT NOT NULL DEFAULT '[]',
    `howAloHelps` TEXT NOT NULL DEFAULT '',
    `officialSourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `officialSourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `lastVerifiedAt` DATETIME(3) NULL,
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` TEXT NOT NULL DEFAULT '',
    `canonicalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `eligibleCourses` VARCHAR(191) NOT NULL DEFAULT '[]',
    `eligibleUniversities` VARCHAR(191) NOT NULL DEFAULT '[]',
    `countrySlug` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `studyLevel` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `applicationMethod` VARCHAR(191) NULL,
    `applicationUrl` TEXT NULL,
    `decisionDate` VARCHAR(191) NULL,
    `sourceUrl` TEXT NULL,
    `sourceName` VARCHAR(191) NULL,

    UNIQUE INDEX `scholarships_slug_key`(`slug`),
    UNIQUE INDEX `scholarships_scholarshipCode_key`(`scholarshipCode`),
    INDEX `scholarships_slug_idx`(`slug`),
    INDEX `scholarships_country_idx`(`country`),
    INDEX `scholarships_universityId_idx`(`universityId`),
    INDEX `scholarships_status_idx`(`status`),
    INDEX `scholarships_deadlineDate_idx`(`deadlineDate`),
    INDEX `scholarships_isFeatured_idx`(`isFeatured`),
    INDEX `scholarships_universitySlug_idx`(`universitySlug`),
    INDEX `scholarships_countrySlug_idx`(`countrySlug`),
    INDEX `scholarships_studyLevel_idx`(`studyLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scholarship_faqs` (
    `id` VARCHAR(191) NOT NULL,
    `scholarshipId` VARCHAR(191) NOT NULL,
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `scholarship_faqs_scholarshipId_idx`(`scholarshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unified_faqs` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL DEFAULT '',
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `targetType` VARCHAR(191) NOT NULL DEFAULT '',
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `targetSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `relatedQuestions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `lastVerifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `unified_faqs_category_idx`(`category`),
    INDEX `unified_faqs_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `unified_faqs_targetSlug_idx`(`targetSlug`),
    INDEX `unified_faqs_status_idx`(`status`),
    INDEX `unified_faqs_sortOrder_idx`(`sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `official_sources` (
    `id` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'official_university',
    `sourceTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `targetType` VARCHAR(191) NOT NULL DEFAULT '',
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `targetSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `dataSection` VARCHAR(191) NOT NULL DEFAULT '',
    `contentHash` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `lastVerifiedAt` DATETIME(3) NULL,
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `httpStatus` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `sourceName` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 1,
    `monitoringEnabled` BOOLEAN NOT NULL DEFAULT true,
    `checkFrequencyDays` INTEGER NOT NULL DEFAULT 7,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastHttpStatus` INTEGER NULL,
    `lastContentHash` VARCHAR(191) NULL,
    `lastError` VARCHAR(191) NULL,
    `consecutiveFailures` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `discoveredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `official_sources_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `official_sources_targetSlug_idx`(`targetSlug`),
    INDEX `official_sources_sourceType_idx`(`sourceType`),
    INDEX `official_sources_verificationStatus_idx`(`verificationStatus`),
    INDEX `official_sources_dataSection_idx`(`dataSection`),
    INDEX `official_sources_countrySlug_idx`(`countrySlug`),
    INDEX `official_sources_courseSlug_idx`(`courseSlug`),
    INDEX `official_sources_priority_idx`(`priority`),
    INDEX `official_sources_status_idx`(`status`),
    INDEX `official_sources_entityType_idx`(`entityType`),
    INDEX `official_sources_universitySlug_idx`(`universitySlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `weekly_update_requests` (
    `id` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `targetName` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` TEXT NOT NULL DEFAULT '',
    `newValue` TEXT NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `evidence` TEXT NOT NULL DEFAULT '',
    `aiConfidence` DOUBLE NOT NULL DEFAULT 0.9,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_REVIEW',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `weekly_update_requests_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `weekly_update_requests_status_idx`(`status`),
    INDEX `weekly_update_requests_fieldName_idx`(`fieldName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `related_contents` (
    `id` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `sourceSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `relatedType` VARCHAR(191) NOT NULL,
    `relatedId` VARCHAR(191) NOT NULL,
    `relatedSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `relation` VARCHAR(191) NOT NULL DEFAULT 'related',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `related_contents_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `related_contents_sourceSlug_idx`(`sourceSlug`),
    INDEX `related_contents_relatedType_idx`(`relatedType`),
    INDEX `related_contents_relation_idx`(`relation`),
    INDEX `related_contents_score_idx`(`score`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_relationships` (
    `id` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NULL,
    `serviceReverseId` VARCHAR(191) NULL,
    `scholarshipId` VARCHAR(191) NULL,
    `scholarshipReverseId` VARCHAR(191) NULL,
    `resourceId` VARCHAR(191) NULL,
    `resourceReverseId` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `relationshipType` VARCHAR(191) NOT NULL DEFAULT 'related',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `content_relationships_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `content_relationships_serviceId_idx`(`serviceId`),
    INDEX `content_relationships_serviceReverseId_idx`(`serviceReverseId`),
    INDEX `content_relationships_scholarshipId_idx`(`scholarshipId`),
    INDEX `content_relationships_scholarshipReverseId_idx`(`scholarshipReverseId`),
    INDEX `content_relationships_resourceId_idx`(`resourceId`),
    INDEX `content_relationships_resourceReverseId_idx`(`resourceReverseId`),
    INDEX `content_relationships_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `content_relationships_relationshipType_idx`(`relationshipType`),
    INDEX `content_relationships_status_idx`(`status`),
    UNIQUE INDEX `content_relationships_sourceType_sourceId_targetType_targetI_key`(`sourceType`, `sourceId`, `targetType`, `targetId`, `relationshipType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campuses` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `countryId` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `state` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `campusType` VARCHAR(191) NOT NULL DEFAULT 'main',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `campuses_universityId_idx`(`universityId`),
    INDEX `campuses_countryId_idx`(`countryId`),
    INDEX `campuses_city_idx`(`city`),
    INDEX `campuses_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_levels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `study_levels_name_key`(`name`),
    UNIQUE INDEX `study_levels_slug_key`(`slug`),
    INDEX `study_levels_slug_idx`(`slug`),
    INDEX `study_levels_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `study_areas` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `study_areas_name_key`(`name`),
    UNIQUE INDEX `study_areas_slug_key`(`slug`),
    INDEX `study_areas_slug_idx`(`slug`),
    INDEX `study_areas_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disciplines` (
    `id` VARCHAR(191) NOT NULL,
    `studyAreaId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disciplines_slug_key`(`slug`),
    INDEX `disciplines_studyAreaId_idx`(`studyAreaId`),
    INDEX `disciplines_slug_idx`(`slug`),
    INDEX `disciplines_status_idx`(`status`),
    UNIQUE INDEX `disciplines_studyAreaId_name_key`(`studyAreaId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_tags` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `tagName` VARCHAR(191) NOT NULL,
    `tagType` VARCHAR(191) NOT NULL DEFAULT 'general',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `course_tags_courseId_idx`(`courseId`),
    INDEX `course_tags_tagName_idx`(`tagName`),
    INDEX `course_tags_tagType_idx`(`tagType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_intakes` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `intakeMonth` VARCHAR(191) NOT NULL,
    `intakeYear` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `deadlineDate` DATETIME(3) NULL,
    `seatsAvailable` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_intakes_courseId_idx`(`courseId`),
    INDEX `course_intakes_intakeYear_intakeMonth_idx`(`intakeYear`, `intakeMonth`),
    INDEX `course_intakes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `entry_requirements` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `qualificationLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `academicRequirement` TEXT NOT NULL DEFAULT '',
    `minGpa` DOUBLE NOT NULL DEFAULT 0,
    `gpaScale` VARCHAR(191) NOT NULL DEFAULT '4.0',
    `backlogAllowed` INTEGER NOT NULL DEFAULT 0,
    `workExperienceRequired` BOOLEAN NOT NULL DEFAULT false,
    `portfolioRequired` BOOLEAN NOT NULL DEFAULT false,
    `interviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `remarks` TEXT NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `entry_requirements_courseId_idx`(`courseId`),
    INDEX `entry_requirements_qualificationLevel_idx`(`qualificationLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `english_requirements` (
    `id` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `testType` VARCHAR(191) NOT NULL,
    `overallScore` DOUBLE NOT NULL DEFAULT 0,
    `listeningScore` DOUBLE NOT NULL DEFAULT 0,
    `readingScore` DOUBLE NOT NULL DEFAULT 0,
    `writingScore` DOUBLE NOT NULL DEFAULT 0,
    `speakingScore` DOUBLE NOT NULL DEFAULT 0,
    `noBandLessThan` DOUBLE NOT NULL DEFAULT 0,
    `waiverAvailable` BOOLEAN NOT NULL DEFAULT false,
    `remarks` TEXT NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `english_requirements_courseId_idx`(`courseId`),
    INDEX `english_requirements_testType_idx`(`testType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_shortlists` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `courseSlug` VARCHAR(191) NOT NULL,

    INDEX `course_shortlists_studentId_idx`(`studentId`),
    INDEX `course_shortlists_courseId_idx`(`courseId`),
    UNIQUE INDEX `course_shortlists_studentId_courseId_key`(`studentId`, `courseId`),
    UNIQUE INDEX `course_shortlists_studentId_courseSlug_key`(`studentId`, `courseSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_comparison_lists` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_comparison_lists_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_quality_scores` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `grade` VARCHAR(191) NOT NULL DEFAULT 'Incomplete',
    `factors` VARCHAR(191) NOT NULL DEFAULT '{}',
    `lastCalculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `data_quality_scores_entityType_idx`(`entityType`),
    INDEX `data_quality_scores_score_idx`(`score`),
    INDEX `data_quality_scores_grade_idx`(`grade`),
    UNIQUE INDEX `data_quality_scores_entityType_entityId_key`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `source_logs` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `sourceName` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'Official University',
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkedBy` VARCHAR(191) NOT NULL DEFAULT 'system',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `notes` TEXT NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `source_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `source_logs_sourceType_idx`(`sourceType`),
    INDEX `source_logs_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `update_requests` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` TEXT NOT NULL DEFAULT '',
    `newValue` TEXT NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `evidence` TEXT NOT NULL DEFAULT '',
    `confidence` DOUBLE NOT NULL DEFAULT 0.9,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `update_requests_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `update_requests_fieldName_idx`(`fieldName`),
    INDEX `update_requests_status_idx`(`status`),
    INDEX `update_requests_detectedAt_idx`(`detectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NOT NULL,
    `altPhone` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'WEBSITE',
    `sourceDetail` VARCHAR(191) NULL,
    `preferredCountry` VARCHAR(191) NULL,
    `preferredCourse` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `counselorId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `duplicateOfId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `welcomeSent` BOOLEAN NOT NULL DEFAULT false,
    `preferredLevel` VARCHAR(191) NULL,
    `preferredIntake` VARCHAR(191) NULL,
    `budget` VARCHAR(191) NULL,
    `englishTest` VARCHAR(191) NULL,
    `englishScore` VARCHAR(191) NULL,
    `currentQualification` VARCHAR(191) NULL,
    `cgpa` VARCHAR(191) NULL,
    `leadScore` INTEGER NOT NULL DEFAULT 0,
    `leadTier` VARCHAR(191) NOT NULL DEFAULT 'COLD',
    `assignedReason` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `followUpDate` DATETIME(3) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `rawSubmission` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Lead_leadId_key`(`leadId`),
    INDEX `Lead_source_idx`(`source`),
    INDEX `Lead_status_idx`(`status`),
    INDEX `Lead_counselorId_idx`(`counselorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `assigneeId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'FOLLOW_UP',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dueDate` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_assigneeId_idx`(`assigneeId`),
    INDEX `Task_status_idx`(`status`),
    INDEX `Task_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacebookIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `pageName` VARCHAR(191) NULL,
    `pageAccessToken` VARCHAR(191) NOT NULL,
    `appId` VARCHAR(191) NULL,
    `appSecret` VARCHAR(191) NULL,
    `verifyToken` VARCHAR(191) NULL,
    `connectedBy` VARCHAR(191) NULL,
    `connectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastWebhookAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FacebookIntegration_pageId_key`(`pageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FacebookLeadRaw` (
    `id` VARCHAR(191) NOT NULL,
    `pageId` VARCHAR(191) NOT NULL,
    `leadgenId` VARCHAR(191) NOT NULL,
    `formId` VARCHAR(191) NULL,
    `formName` VARCHAR(191) NULL,
    `fieldData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `normalizedData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `matchedLeadId` VARCHAR(191) NULL,
    `assignedCounselorId` VARCHAR(191) NULL,
    `processingStatus` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `errorMessage` VARCHAR(191) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FacebookLeadRaw_leadgenId_key`(`leadgenId`),
    INDEX `FacebookLeadRaw_pageId_idx`(`pageId`),
    INDEX `FacebookLeadRaw_processingStatus_idx`(`processingStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL,
    `signature` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `processed` BOOLEAN NOT NULL DEFAULT false,
    `processedAt` DATETIME(3) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookEvent_provider_idx`(`provider`),
    INDEX `WebhookEvent_processed_idx`(`processed`),
    UNIQUE INDEX `WebhookEvent_provider_eventId_key`(`provider`, `eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WhatsAppMessageStatus` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `socialMessageId` VARCHAR(191) NULL,
    `recipientPhone` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `statusTimestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `errorMessage` VARCHAR(191) NULL,
    `providerPayload` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WhatsAppMessageStatus_messageId_key`(`messageId`),
    INDEX `WhatsAppMessageStatus_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialInboxMessage` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL DEFAULT 'INBOUND',
    `senderId` VARCHAR(191) NULL,
    `senderName` VARCHAR(191) NULL,
    `senderAvatar` VARCHAR(191) NULL,
    `recipientId` VARCHAR(191) NULL,
    `messageText` VARCHAR(191) NULL,
    `messageMediaUrl` VARCHAR(191) NULL,
    `messageMediaMetadata` VARCHAR(191) NULL,
    `commentId` VARCHAR(191) NULL,
    `postId` VARCHAR(191) NULL,
    `conversationId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `aiHandled` BOOLEAN NOT NULL DEFAULT false,
    `aiDraftReply` VARCHAR(191) NULL,
    `humanApproved` BOOLEAN NOT NULL DEFAULT false,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `keywordTriggered` VARCHAR(191) NULL,
    `externalId` VARCHAR(191) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SocialInboxMessage_platform_idx`(`platform`),
    INDEX `SocialInboxMessage_leadId_idx`(`leadId`),
    INDEX `SocialInboxMessage_studentId_idx`(`studentId`),
    INDEX `SocialInboxMessage_employeeId_idx`(`employeeId`),
    INDEX `SocialInboxMessage_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `providerFileId` VARCHAR(191) NOT NULL DEFAULT '',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileType` VARCHAR(191) NOT NULL DEFAULT '',
    `fileSizeBytes` INTEGER NOT NULL DEFAULT 0,
    `matchReviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `whatsappMsgRef` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationAttachment_messageId_idx`(`messageId`),
    INDEX `CommunicationAttachment_threadId_idx`(`threadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationSlaEvent` (
    `id` VARCHAR(191) NOT NULL,
    `threadId` VARCHAR(191) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `channel` VARCHAR(191) NOT NULL DEFAULT '',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `slaMinutes` INTEGER NOT NULL DEFAULT 30,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `slaDueAt` DATETIME(3) NULL,
    `slaStatus` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `escalatedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommunicationSlaEvent_threadId_idx`(`threadId`),
    INDEX `CommunicationSlaEvent_counselorId_idx`(`counselorId`),
    INDEX `CommunicationSlaEvent_slaStatus_idx`(`slaStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactMatchReview` (
    `id` VARCHAR(191) NOT NULL,
    `incomingPhone` VARCHAR(191) NOT NULL,
    `normalizedPhone` VARCHAR(191) NOT NULL,
    `incomingName` VARCHAR(191) NULL,
    `incomingEmail` VARCHAR(191) NULL,
    `matchedStudentId` VARCHAR(191) NULL,
    `matchedLeadId` VARCHAR(191) NULL,
    `matchedPartnerId` VARCHAR(191) NULL,
    `matchConfidence` INTEGER NOT NULL DEFAULT 0,
    `matchReason` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `decision` VARCHAR(191) NULL,
    `decidedBy` VARCHAR(191) NULL,
    `decidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMatchReview_incomingPhone_idx`(`incomingPhone`),
    INDEX `ContactMatchReview_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KeywordTrigger` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `keywordType` VARCHAR(191) NOT NULL DEFAULT 'EXACT',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `autoReplyText` VARCHAR(191) NOT NULL,
    `autoDmText` VARCHAR(191) NULL,
    `autoCreateLead` BOOLEAN NOT NULL DEFAULT true,
    `autoAssignCounselor` BOOLEAN NOT NULL DEFAULT true,
    `sendPortalLink` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `triggerCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KeywordTrigger_keyword_key`(`keyword`),
    INDEX `KeywordTrigger_keyword_idx`(`keyword`),
    INDEX `KeywordTrigger_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentAsset` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `sourceQuery` VARCHAR(191) NULL,
    `authorAgentId` VARCHAR(191) NULL,
    `humanApproverId` VARCHAR(191) NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL DEFAULT '',
    `excerpt` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` VARCHAR(191) NULL,
    `targetKeywords` VARCHAR(191) NULL,
    `canonicalUrl` VARCHAR(191) NULL,
    `factChecked` BOOLEAN NOT NULL DEFAULT false,
    `sourceChecked` BOOLEAN NOT NULL DEFAULT false,
    `brandChecked` BOOLEAN NOT NULL DEFAULT false,
    `seoChecked` BOOLEAN NOT NULL DEFAULT false,
    `duplicateChecked` BOOLEAN NOT NULL DEFAULT false,
    `legalChecked` BOOLEAN NOT NULL DEFAULT false,
    `privacyChecked` BOOLEAN NOT NULL DEFAULT false,
    `qualityScore` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `publishedUrl` VARCHAR(191) NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `views` INTEGER NOT NULL DEFAULT 0,
    `engagement` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `leads` INTEGER NOT NULL DEFAULT 0,
    `applications` INTEGER NOT NULL DEFAULT 0,
    `enrollments` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ContentAsset_slug_key`(`slug`),
    INDEX `ContentAsset_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentPublication` (
    `id` VARCHAR(191) NOT NULL,
    `contentAssetId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `platformPostId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `scheduledAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `publishedUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentPublication_contentAssetId_idx`(`contentAssetId`),
    INDEX `ContentPublication_platform_idx`(`platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentOpportunity` (
    `id` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `scholarshipSlug` VARCHAR(191) NULL,
    `searchIntent` VARCHAR(191) NULL,
    `audience` VARCHAR(191) NULL,
    `sourceEvidence` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `estimatedUsefulness` INTEGER NOT NULL DEFAULT 0,
    `freshness` VARCHAR(191) NOT NULL DEFAULT 'FRESH',
    `competitionSignal` VARCHAR(191) NULL,
    `contentType` VARCHAR(191) NULL,
    `recommendedChannels` VARCHAR(191) NULL,
    `assignedDepartment` VARCHAR(191) NULL,
    `assignedAgentIds` VARCHAR(191) NULL,
    `humanReviewerId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED',
    `contentAssetId` VARCHAR(191) NULL,
    `conversionRelationship` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentOpportunity_status_idx`(`status`),
    INDEX `ContentOpportunity_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentDependency` (
    `id` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `sourceField` VARCHAR(191) NULL,
    `dependentAssetType` VARCHAR(191) NOT NULL,
    `dependentAssetId` VARCHAR(191) NOT NULL,
    `dependencyStrength` VARCHAR(191) NOT NULL DEFAULT 'DIRECT',
    `lastSyncedAt` DATETIME(3) NULL,
    `stale` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentDependency_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `ContentDependency_stale_idx`(`stale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentDNA` (
    `id` VARCHAR(191) NOT NULL,
    `contentAssetId` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `destination` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `degree` VARCHAR(191) NULL,
    `studentIntent` VARCHAR(191) NULL,
    `stage` VARCHAR(191) NULL,
    `scholarship` VARCHAR(191) NULL,
    `cost` VARCHAR(191) NULL,
    `application` VARCHAR(191) NULL,
    `visa` VARCHAR(191) NULL,
    `career` VARCHAR(191) NULL,
    `contentType` VARCHAR(191) NULL,
    `audience` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ContentDNA_fingerprint_key`(`fingerprint`),
    INDEX `ContentDNA_contentAssetId_idx`(`contentAssetId`),
    INDEX `ContentDNA_country_idx`(`country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SourceChangeEvent` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NULL,
    `changedFrom` VARCHAR(191) NULL,
    `changedTo` VARCHAR(191) NULL,
    `contentHashBefore` VARCHAR(191) NULL,
    `contentHashAfter` VARCHAR(191) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `materiality` VARCHAR(191) NULL,
    `aiAssessment` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewerId` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `appliedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SourceChangeEvent_sourceId_idx`(`sourceId`),
    INDEX `SourceChangeEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeLearningResource` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `resourceType` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `contentAssetId` VARCHAR(191) NULL,
    `sourceChangeId` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `role` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `EmployeeLearningResource_resourceType_idx`(`resourceType`),
    INDEX `EmployeeLearningResource_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityResearchEvidence` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `fieldValue` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `sourceTitle` VARCHAR(191) NULL,
    `sourceSection` VARCHAR(191) NULL,
    `retrievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contentHash` VARCHAR(191) NULL,
    `sourceSnapshot` VARCHAR(191) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.5,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `changedFrom` VARCHAR(191) NULL,
    `changedTo` VARCHAR(191) NULL,
    `reviewerId` VARCHAR(191) NULL,
    `aiAgentId` VARCHAR(191) NULL,
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UniversityResearchEvidence_universitySlug_idx`(`universitySlug`),
    INDEX `UniversityResearchEvidence_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAgent` (
    `id` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `agentCode` VARCHAR(191) NOT NULL,
    `agentType` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `jobsProcessed` INTEGER NOT NULL DEFAULT 0,
    `pendingApprovals` INTEGER NOT NULL DEFAULT 0,
    `lastRunAt` DATETIME(3) NULL,
    `supervisorAgentId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiAgent_department_idx`(`department`),
    INDEX `AiAgent_status_idx`(`status`),
    INDEX `AiAgent_supervisorAgentId_idx`(`supervisorAgentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAgentRegistry` (
    `id` VARCHAR(191) NOT NULL,
    `agentCode` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `agentType` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
    `promptTemplate` VARCHAR(191) NULL,
    `apiUsed` VARCHAR(191) NOT NULL DEFAULT 'z-ai-web-dev-sdk',
    `fallbackApi` VARCHAR(191) NULL,
    `dailyRequests` INTEGER NOT NULL DEFAULT 0,
    `monthlyRequests` INTEGER NOT NULL DEFAULT 0,
    `totalRequests` INTEGER NOT NULL DEFAULT 0,
    `successRate` DOUBLE NOT NULL DEFAULT 95.0,
    `avgResponseTime` DOUBLE NOT NULL DEFAULT 0,
    `lastExecutedAt` DATETIME(3) NULL,
    `errorCount` INTEGER NOT NULL DEFAULT 0,
    `lastError` VARCHAR(191) NULL,
    `executionLog` VARCHAR(191) NULL,
    `config` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiAgentRegistry_agentCode_key`(`agentCode`),
    INDEX `AiAgentRegistry_agentType_idx`(`agentType`),
    INDEX `AiAgentRegistry_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentSkillExtension` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `skillCode` VARCHAR(191) NOT NULL,
    `skillName` VARCHAR(191) NOT NULL,
    `brain` VARCHAR(191) NOT NULL,
    `capability` VARCHAR(191) NOT NULL,
    `proficiencyLevel` VARCHAR(191) NOT NULL DEFAULT 'EXPERT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AgentSkillExtension_agentId_idx`(`agentId`),
    INDEX `AgentSkillExtension_brain_idx`(`brain`),
    UNIQUE INDEX `AgentSkillExtension_agentId_skillCode_key`(`agentId`, `skillCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentToolExtension` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `toolName` VARCHAR(191) NOT NULL,
    `brain` VARCHAR(191) NOT NULL,
    `inputSchema` VARCHAR(191) NOT NULL DEFAULT '{}',
    `outputSchema` VARCHAR(191) NOT NULL DEFAULT '{}',
    `permission` VARCHAR(191) NOT NULL DEFAULT 'EXECUTE',
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `approvalRequired` BOOLEAN NOT NULL DEFAULT false,
    `rateLimit` INTEGER NOT NULL DEFAULT 100,
    `timeout` INTEGER NOT NULL DEFAULT 30000,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AgentToolExtension_agentId_idx`(`agentId`),
    INDEX `AgentToolExtension_brain_idx`(`brain`),
    UNIQUE INDEX `AgentToolExtension_agentId_toolId_key`(`agentId`, `toolId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Department_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnterpriseDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `deptCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `parentDeptId` VARCHAR(191) NULL,
    `headAgentId` VARCHAR(191) NULL,
    `aiEmployeeCount` INTEGER NOT NULL DEFAULT 20,
    `skillCount` INTEGER NOT NULL DEFAULT 100,
    `promptCount` INTEGER NOT NULL DEFAULT 500,
    `sopCount` INTEGER NOT NULL DEFAULT 5,
    `constitutionalRulesCount` INTEGER NOT NULL DEFAULT 5,
    `sopCoverage` DOUBLE NOT NULL DEFAULT 95,
    `knowledgeCoverage` DOUBLE NOT NULL DEFAULT 95,
    `skillCoverage` DOUBLE NOT NULL DEFAULT 95,
    `testPassRate` DOUBLE NOT NULL DEFAULT 95,
    `kpiAchievement` DOUBLE NOT NULL DEFAULT 90,
    `securityCompliance` DOUBLE NOT NULL DEFAULT 100,
    `auditCompliance` DOUBLE NOT NULL DEFAULT 100,
    `selfRecoverySuccess` DOUBLE NOT NULL DEFAULT 90,
    `humanEscalationRate` DOUBLE NOT NULL DEFAULT 10,
    `dccCertified` BOOLEAN NOT NULL DEFAULT false,
    `dccCertifiedAt` DATETIME(3) NULL,
    `canCreateAgents` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EnterpriseDepartment_deptCode_key`(`deptCode`),
    INDEX `EnterpriseDepartment_status_idx`(`status`),
    INDEX `EnterpriseDepartment_dccCertified_idx`(`dccCertified`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiEmployee` (
    `id` VARCHAR(191) NOT NULL,
    `employeeCode` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `skillIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `promptIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `jobsProcessed` INTEGER NOT NULL DEFAULT 0,
    `successRate` DOUBLE NOT NULL DEFAULT 95,
    `avgResponseTime` DOUBLE NOT NULL DEFAULT 0,
    `lastActiveAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiEmployee_employeeCode_key`(`employeeCode`),
    INDEX `AiEmployee_departmentId_idx`(`departmentId`),
    INDEX `AiEmployee_status_idx`(`status`),
    INDEX `AiEmployee_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiSkill` (
    `id` VARCHAR(191) NOT NULL,
    `skillCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `proficiencyLevel` VARCHAR(191) NOT NULL DEFAULT 'EXPERT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AiSkill_skillCode_key`(`skillCode`),
    INDEX `AiSkill_category_idx`(`category`),
    INDEX `AiSkill_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromptTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `templateCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `promptText` VARCHAR(191) NOT NULL,
    `variables` VARCHAR(191) NOT NULL DEFAULT '[]',
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PromptTemplate_templateCode_key`(`templateCode`),
    INDEX `PromptTemplate_category_idx`(`category`),
    INDEX `PromptTemplate_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiSop` (
    `id` VARCHAR(191) NOT NULL,
    `sopCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `steps` VARCHAR(191) NOT NULL DEFAULT '[]',
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiSop_sopCode_key`(`sopCode`),
    INDEX `AiSop_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiEngine` (
    `id` VARCHAR(191) NOT NULL,
    `engineCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `healthStatus` VARCHAR(191) NOT NULL DEFAULT 'HEALTHY',
    `metrics` VARCHAR(191) NULL,
    `lastHealthCheck` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiEngine_engineCode_key`(`engineCode`),
    INDEX `AiEngine_type_idx`(`type`),
    INDEX `AiEngine_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentOSTool` (
    `id` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `inputSchema` VARCHAR(191) NOT NULL DEFAULT '{}',
    `outputSchema` VARCHAR(191) NOT NULL DEFAULT '{}',
    `permissions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `allowedAgents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `allowedDepartments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `rateLimit` INTEGER NOT NULL DEFAULT 100,
    `timeout` INTEGER NOT NULL DEFAULT 30000,
    `approvalPolicy` VARCHAR(191) NOT NULL DEFAULT 'STANDARD',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
    `metadata` VARCHAR(191) NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentOSTool_toolId_key`(`toolId`),
    INDEX `AgentOSTool_category_idx`(`category`),
    INDEX `AgentOSTool_riskLevel_idx`(`riskLevel`),
    INDEX `AgentOSTool_enabled_idx`(`enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentOSTask` (
    `id` VARCHAR(191) NOT NULL,
    `taskCode` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `departmentId` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `authorizationContext` VARCHAR(191) NULL DEFAULT '{}',
    `input` VARCHAR(191) NOT NULL DEFAULT '{}',
    `planSummary` VARCHAR(191) NULL,
    `approvedActions` VARCHAR(191) NULL DEFAULT '[]',
    `toolCalls` VARCHAR(191) NULL DEFAULT '[]',
    `executionResult` VARCHAR(191) NULL DEFAULT '{}',
    `status` VARCHAR(191) NOT NULL DEFAULT 'CREATED',
    `error` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `auditId` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `correlationId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentOSTask_taskCode_key`(`taskCode`),
    INDEX `AgentOSTask_agentId_idx`(`agentId`),
    INDEX `AgentOSTask_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiCommandAction` (
    `id` VARCHAR(191) NOT NULL,
    `actionType` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `requestedBy` VARCHAR(191) NOT NULL,
    `aiAgentId` VARCHAR(191) NULL,
    `actor` VARCHAR(191) NULL,
    `trigger` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `payload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `result` VARCHAR(191) NULL,
    `lastError` VARCHAR(191) NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `executedAt` DATETIME(3) NULL,
    `rollbackReason` VARCHAR(191) NULL,
    `rolledBackAt` DATETIME(3) NULL,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `riskFlags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiCommandAction_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AiCommandAction_actionType_idx`(`actionType`),
    INDEX `AiCommandAction_requestedBy_idx`(`requestedBy`),
    INDEX `AiCommandAction_status_idx`(`status`),
    INDEX `AiCommandAction_aiAgentId_idx`(`aiAgentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GlobalAiPause` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `targetId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `reason` VARCHAR(191) NULL,
    `activatedBy` VARCHAR(191) NULL,
    `activatedAt` DATETIME(3) NULL,
    `deactivatedBy` VARCHAR(191) NULL,
    `deactivatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GlobalAiPause_active_idx`(`active`),
    UNIQUE INDEX `GlobalAiPause_scope_targetId_key`(`scope`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutomationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `workflow` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL,
    `trigger` VARCHAR(191) NOT NULL,
    `actor` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `result` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AutomationEvent_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AutomationEvent_workflow_idx`(`workflow`),
    INDEX `AutomationEvent_mode_idx`(`mode`),
    INDEX `AutomationEvent_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventLog` (
    `id` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `aggregateType` VARCHAR(191) NOT NULL,
    `aggregateId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `actorType` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `agentId` VARCHAR(191) NULL,
    `payload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `correlationId` VARCHAR(191) NULL,
    `causationId` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EventLog_eventType_idx`(`eventType`),
    INDEX `EventLog_studentId_idx`(`studentId`),
    INDEX `EventLog_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentReplicationCycle` (
    `id` VARCHAR(191) NOT NULL,
    `parentAgentId` VARCHAR(191) NOT NULL,
    `parentAgentCode` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NULL,
    `cycleNumber` INTEGER NOT NULL DEFAULT 1,
    `cycleStartDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `cycleEndDate` DATETIME(3) NOT NULL,
    `targetChildren` INTEGER NOT NULL DEFAULT 3,
    `childrenCreated` INTEGER NOT NULL DEFAULT 0,
    `childrenPassedDcc` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `isTwoLoop` BOOLEAN NOT NULL DEFAULT false,
    `graduatedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AgentReplicationCycle_parentAgentId_idx`(`parentAgentId`),
    INDEX `AgentReplicationCycle_departmentId_idx`(`departmentId`),
    INDEX `AgentReplicationCycle_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAgentLineage` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `agentCode` VARCHAR(191) NOT NULL,
    `parentAgentId` VARCHAR(191) NULL,
    `parentAgentCode` VARCHAR(191) NULL,
    `generation` INTEGER NOT NULL DEFAULT 1,
    `lineagePath` VARCHAR(191) NOT NULL DEFAULT '',
    `isTwoLoopModel` BOOLEAN NOT NULL DEFAULT false,
    `graduatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiAgentLineage_agentId_idx`(`agentId`),
    INDEX `AiAgentLineage_parentAgentId_idx`(`parentAgentId`),
    INDEX `AiAgentLineage_generation_idx`(`generation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewInvitation` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `studentEmail` VARCHAR(191) NULL,
    `studentPhone` VARCHAR(191) NULL,
    `counselorId` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `serviceType` VARCHAR(191) NULL,
    `campaignId` VARCHAR(191) NULL,
    `googleReviewUrl` VARCHAR(191) NULL,
    `facebookRecommendUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'SENT',
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `openedAt` DATETIME(3) NULL,
    `submittedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `reviewId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ReviewInvitation_token_key`(`token`),
    INDEX `ReviewInvitation_studentId_idx`(`studentId`),
    INDEX `ReviewInvitation_status_idx`(`status`),
    INDEX `ReviewInvitation_token_idx`(`token`),
    INDEX `ReviewInvitation_sentAt_idx`(`sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentReview` (
    `id` VARCHAR(191) NOT NULL,
    `invitationId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `studentEmail` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `counselorName` VARCHAR(191) NULL,
    `serviceType` VARCHAR(191) NULL,
    `rating` INTEGER NOT NULL,
    `reviewText` VARCHAR(191) NOT NULL,
    `photoFileId` VARCHAR(191) NULL,
    `consentPublish` BOOLEAN NOT NULL DEFAULT false,
    `consentMarketing` BOOLEAN NOT NULL DEFAULT false,
    `consentShowName` BOOLEAN NOT NULL DEFAULT false,
    `consentCapturedAt` DATETIME(3) NULL,
    `consentIp` VARCHAR(191) NULL,
    `aiSpamScore` DOUBLE NOT NULL DEFAULT 0,
    `aiFlags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `aiSentiment` VARCHAR(191) NULL,
    `moderationStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `moderatedBy` VARCHAR(191) NULL,
    `moderatedAt` DATETIME(3) NULL,
    `moderationNotes` VARCHAR(191) NULL,
    `publicationStatus` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `publishedAt` DATETIME(3) NULL,
    `unpublishedAt` DATETIME(3) NULL,
    `googleSubmitted` BOOLEAN NOT NULL DEFAULT false,
    `googleSubmittedAt` DATETIME(3) NULL,
    `facebookSubmitted` BOOLEAN NOT NULL DEFAULT false,
    `facebookSubmittedAt` DATETIME(3) NULL,
    `isVerifiedStudent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentReview_invitationId_idx`(`invitationId`),
    INDEX `StudentReview_studentId_idx`(`studentId`),
    INDEX `StudentReview_moderationStatus_idx`(`moderationStatus`),
    INDEX `StudentReview_publicationStatus_idx`(`publicationStatus`),
    INDEX `StudentReview_rating_idx`(`rating`),
    INDEX `StudentReview_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReviewRequest` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `studentEmail` VARCHAR(191) NULL,
    `studentPhone` VARCHAR(191) NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `feedbackRating` INTEGER NULL,
    `feedbackText` VARCHAR(191) NULL,
    `googleReviewUrl` VARCHAR(191) NULL,
    `reviewRequestedAt` DATETIME(3) NULL,
    `reviewCompletedAt` DATETIME(3) NULL,
    `incentivized` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReviewRequest_studentId_idx`(`studentId`),
    INDEX `ReviewRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BrandAsset` (
    `id` VARCHAR(191) NOT NULL,
    `assetType` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL DEFAULT '{}',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER NOT NULL DEFAULT 1,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BrandAsset_assetType_idx`(`assetType`),
    INDEX `BrandAsset_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CampaignPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `hashtags` VARCHAR(191) NULL,
    `ctaText` VARCHAR(191) NULL,
    `ctaUrl` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NULL,
    `videoScript` VARCHAR(191) NULL,
    `reelCaption` VARCHAR(191) NULL,
    `landingLink` VARCHAR(191) NULL,
    `campaignObjective` VARCHAR(191) NULL,
    `platformSize` VARCHAR(191) NULL,
    `scheduledAt` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `publishedUrl` VARCHAR(191) NULL,
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `brandAssetApplied` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CampaignPost_platform_idx`(`platform`),
    INDEX `CampaignPost_category_idx`(`category`),
    INDEX `CampaignPost_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhoneCallLog` (
    `id` VARCHAR(191) NOT NULL,
    `callType` VARCHAR(191) NOT NULL,
    `fromNumber` VARCHAR(191) NOT NULL,
    `toNumber` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `recordingPath` VARCHAR(191) NULL,
    `callNotes` VARCHAR(191) NULL,
    `disposition` VARCHAR(191) NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT '3CX',
    `providerEventId` VARCHAR(191) NULL,
    `threecxCallId` VARCHAR(191) NULL,
    `extension` VARCHAR(191) NULL,
    `status` VARCHAR(191) NULL,
    `startTimestamp` DATETIME(3) NULL,
    `endTimestamp` DATETIME(3) NULL,
    `recordingMetadata` VARCHAR(191) NULL,
    `transcriptionStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_AVAILABLE',
    `transcriptionText` VARCHAR(191) NULL,
    `consentRecorded` BOOLEAN NOT NULL DEFAULT false,
    `aiSummary` VARCHAR(191) NULL,
    `aiIntent` VARCHAR(191) NULL,
    `aiRecommendations` VARCHAR(191) NULL,
    `aiAnalysisId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `timelineEventId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PhoneCallLog_providerEventId_key`(`providerEventId`),
    INDEX `PhoneCallLog_studentId_idx`(`studentId`),
    INDEX `PhoneCallLog_leadId_idx`(`leadId`),
    INDEX `PhoneCallLog_fromNumber_idx`(`fromNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ThreeCxIntegration` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT 'default',
    `baseUrl` VARCHAR(191) NULL,
    `integrationId` VARCHAR(191) NULL,
    `apiKey` VARCHAR(191) NULL,
    `webhookSecret` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_CONFIGURED',
    `version` VARCHAR(191) NULL,
    `lastTestedAt` DATETIME(3) NULL,
    `lastTestSuccess` BOOLEAN NULL,
    `lastError` VARCHAR(191) NULL,
    `lastSuccessfulSync` DATETIME(3) NULL,
    `configuredBy` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ThreeCxIntegration_active_idx`(`active`),
    INDEX `ThreeCxIntegration_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmsLog` (
    `id` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL DEFAULT 'OUTBOUND',
    `fromNumber` VARCHAR(191) NOT NULL,
    `toNumber` VARCHAR(191) NOT NULL,
    `messageText` VARCHAR(191) NOT NULL,
    `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `readStatus` BOOLEAN NOT NULL DEFAULT false,
    `campaignId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SmsLog_studentId_idx`(`studentId`),
    INDEX `SmsLog_leadId_idx`(`leadId`),
    INDEX `SmsLog_toNumber_idx`(`toNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CallOutcome` (
    `id` VARCHAR(191) NOT NULL,
    `callLogId` VARCHAR(191) NULL,
    `outcome` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NULL,
    `studentVisibleNote` VARCHAR(191) NULL,
    `internalNote` VARCHAR(191) NULL,
    `nextAction` VARCHAR(191) NULL,
    `followUpAt` DATETIME(3) NULL,
    `consentRecorded` BOOLEAN NOT NULL DEFAULT false,
    `recordingPath` VARCHAR(191) NULL,
    `counselorId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CallOutcome_callLogId_idx`(`callLogId`),
    INDEX `CallOutcome_studentId_idx`(`studentId`),
    INDEX `CallOutcome_outcome_idx`(`outcome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UnknownIncomingContact` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'PHONE_CALL',
    `callLogId` VARCHAR(191) NULL,
    `matchedToStudent` BOOLEAN NOT NULL DEFAULT false,
    `matchedStudentId` VARCHAR(191) NULL,
    `matchedLeadId` VARCHAR(191) NULL,
    `matchedPartnerId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NULL,
    `actionById` VARCHAR(191) NULL,
    `actionAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UnknownIncomingContact_phone_idx`(`phone`),
    INDEX `UnknownIncomingContact_matchedToStudent_idx`(`matchedToStudent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentOSExecution` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `stepNumber` INTEGER NOT NULL DEFAULT 1,
    `stepType` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NULL,
    `toolInput` VARCHAR(191) NULL DEFAULT '{}',
    `toolOutput` VARCHAR(191) NULL DEFAULT '{}',
    `result` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `duration` INTEGER NULL,
    `errorMessage` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AgentOSExecution_taskId_idx`(`taskId`),
    INDEX `AgentOSExecution_stepType_idx`(`stepType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAction` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `actionType` VARCHAR(191) NOT NULL,
    `toolName` VARCHAR(191) NULL,
    `toolInput` VARCHAR(191) NULL DEFAULT '{}',
    `toolResult` VARCHAR(191) NULL DEFAULT '{}',
    `crmId` VARCHAR(191) NULL,
    `crmType` VARCHAR(191) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiAction_taskId_idx`(`taskId`),
    INDEX `AiAction_agentName_idx`(`agentName`),
    INDEX `AiAction_actionType_idx`(`actionType`),
    INDEX `AiAction_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiDocumentClassification` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `documentVersionId` VARCHAR(191) NULL,
    `detectedType` VARCHAR(191) NOT NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `extractedData` VARCHAR(191) NULL,
    `ocrText` VARCHAR(191) NULL,
    `matchedStudentId` VARCHAR(191) NULL,
    `autoFilled` BOOLEAN NOT NULL DEFAULT false,
    `humanVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiDocumentClassification_documentId_idx`(`documentId`),
    INDEX `AiDocumentClassification_detectedType_idx`(`detectedType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiTask` (
    `id` VARCHAR(191) NOT NULL,
    `taskCode` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `agentName` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `crmId` VARCHAR(191) NULL,
    `crmType` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `action` VARCHAR(191) NOT NULL,
    `input` VARCHAR(191) NULL DEFAULT '{}',
    `result` VARCHAR(191) NULL DEFAULT '{}',
    `errorMessage` VARCHAR(191) NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `maxRetries` INTEGER NOT NULL DEFAULT 3,
    `approvalRequired` BOOLEAN NOT NULL DEFAULT false,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiTask_taskCode_key`(`taskCode`),
    INDEX `AiTask_status_idx`(`status`),
    INDEX `AiTask_agentId_idx`(`agentId`),
    INDEX `AiTask_crmId_idx`(`crmId`),
    INDEX `AiTask_priority_idx`(`priority`),
    INDEX `AiTask_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalAction` (
    `id` VARCHAR(191) NOT NULL,
    `changeId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NOT NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `editedFieldName` VARCHAR(191) NULL,
    `editedOldValue` VARCHAR(191) NULL,
    `editedNewValue` VARCHAR(191) NULL,
    `metadata` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApprovalAction_changeId_idx`(`changeId`),
    INDEX `ApprovalAction_action_idx`(`action`),
    INDEX `ApprovalAction_performedBy_idx`(`performedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApprovalQueueItem` (
    `id` VARCHAR(191) NOT NULL,
    `changeId` VARCHAR(191) NOT NULL,
    `queueType` VARCHAR(191) NOT NULL DEFAULT 'STANDARD',
    `priority` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `assignedTo` VARCHAR(191) NULL,
    `requestedBy` VARCHAR(191) NULL,
    `enqueuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApprovalQueueItem_changeId_key`(`changeId`),
    INDEX `ApprovalQueueItem_status_idx`(`status`),
    INDEX `ApprovalQueueItem_queueType_idx`(`queueType`),
    INDEX `ApprovalQueueItem_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AutomationMetric` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `totalTasks` INTEGER NOT NULL DEFAULT 0,
    `automatedTasks` INTEGER NOT NULL DEFAULT 0,
    `aiAssistedTasks` INTEGER NOT NULL DEFAULT 0,
    `humanTasks` INTEGER NOT NULL DEFAULT 0,
    `failedTasks` INTEGER NOT NULL DEFAULT 0,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AutomationMetric_category_idx`(`category`),
    INDEX `AutomationMetric_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `B2BContact` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `organization` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `lastContactedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `B2BContact_organization_idx`(`organization`),
    INDEX `B2BContact_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BlogPost` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '[]',
    `coverImage` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `authorName` VARCHAR(191) NULL,
    `authorRole` VARCHAR(191) NULL,
    `readMinutes` INTEGER NOT NULL DEFAULT 3,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BlogPost_slug_key`(`slug`),
    INDEX `BlogPost_status_idx`(`status`),
    INDEX `BlogPost_category_idx`(`category`),
    INDEX `BlogPost_featured_idx`(`featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `budget` DOUBLE NULL,
    `spent` DOUBLE NOT NULL DEFAULT 0,
    `leadsCount` INTEGER NOT NULL DEFAULT 0,
    `conversionsCount` INTEGER NOT NULL DEFAULT 0,
    `startDate` VARCHAR(191) NULL,
    `endDate` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Campaign_channel_idx`(`channel`),
    INDEX `Campaign_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` VARCHAR(191) NOT NULL,
    `commissionCode` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DUE',
    `invoiceNumber` VARCHAR(191) NULL,
    `invoiceUrl` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `verifiedById` VARCHAR(191) NULL,
    `verifiedAt` DATETIME(3) NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `receivedAt` DATETIME(3) NULL,
    `reconciledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Commission_commissionCode_key`(`commissionCode`),
    INDEX `Commission_type_idx`(`type`),
    INDEX `Commission_status_idx`(`status`),
    INDEX `Commission_universitySlug_idx`(`universitySlug`),
    INDEX `Commission_partnerId_idx`(`partnerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationDraft` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `socialInboxMessageId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `draftBody` VARCHAR(191) NOT NULL,
    `aiGenerated` BOOLEAN NOT NULL DEFAULT true,
    `aiConfidence` INTEGER NOT NULL DEFAULT 0,
    `aiReasoning` VARCHAR(191) NULL,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `riskFlags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `mode` VARCHAR(191) NOT NULL DEFAULT 'AI_DRAFT_HUMAN_SEND',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `editedBody` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `sentById` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CommunicationDraft_channel_idx`(`channel`),
    INDEX `CommunicationDraft_studentId_idx`(`studentId`),
    INDEX `CommunicationDraft_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationTask` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `communicationMessageId` VARCHAR(191) NULL,
    `socialInboxMessageId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `source` VARCHAR(191) NOT NULL DEFAULT 'COMMUNICATION',
    `resolution` VARCHAR(191) NULL,
    `deadline` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CommunicationTask_assignedTo_idx`(`assignedTo`),
    INDEX `CommunicationTask_studentId_idx`(`studentId`),
    INDEX `CommunicationTask_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConnectedAccount` (
    `id` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `accessTokenEnc` VARCHAR(191) NULL,
    `refreshTokenEnc` VARCHAR(191) NULL,
    `tokenExpiry` DATETIME(3) NULL,
    `connectionStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCONNECTED',
    `lastSync` DATETIME(3) NULL,
    `lastActivity` DATETIME(3) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `assignedBranch` VARCHAR(191) NULL,
    `autoSync` BOOLEAN NOT NULL DEFAULT true,
    `metadata` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConnectedAccount_platform_idx`(`platform`),
    INDEX `ConnectedAccount_connectionStatus_idx`(`connectionStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConsentRecord` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NOT NULL,
    `consentStatus` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `preferredLanguage` VARCHAR(191) NULL,
    `preferredChannel` VARCHAR(191) NULL,
    `consentDate` DATETIME(3) NULL,
    `optOutDate` DATETIME(3) NULL,
    `consentSource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ConsentRecord_studentId_idx`(`studentId`),
    INDEX `ConsentRecord_leadId_idx`(`leadId`),
    INDEX `ConsentRecord_consentStatus_idx`(`consentStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConstitutionalRule` (
    `id` VARCHAR(191) NOT NULL,
    `ruleCode` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `enforcement` VARCHAR(191) NOT NULL DEFAULT 'BLOCK',
    `priority` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ConstitutionalRule_ruleCode_key`(`ruleCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CountryPage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `shortName` VARCHAR(191) NOT NULL,
    `flag` VARCHAR(191) NOT NULL,
    `capital` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `intro` VARCHAR(191) NOT NULL,
    `quickFacts` VARCHAR(191) NOT NULL DEFAULT '{}',
    `whyStudy` VARCHAR(191) NOT NULL DEFAULT '[]',
    `pathway` VARCHAR(191) NOT NULL DEFAULT '{}',
    `popularCourses` VARCHAR(191) NOT NULL DEFAULT '[]',
    `entryRequirements` VARCHAR(191) NOT NULL DEFAULT '{}',
    `documents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `visaProcess` VARCHAR(191) NOT NULL DEFAULT '[]',
    `interviewTypes` VARCHAR(191) NOT NULL DEFAULT '[]',
    `workRights` VARCHAR(191) NOT NULL DEFAULT '{}',
    `scholarships` VARCHAR(191) NOT NULL DEFAULT '[]',
    `cities` VARCHAR(191) NOT NULL DEFAULT '[]',
    `faqs` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sourceUrl` VARCHAR(191) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'VERIFIED',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CountryPage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoursePage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `countrySlug` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `duration` VARCHAR(191) NOT NULL,
    `intake` VARCHAR(191) NOT NULL,
    `tuition` VARCHAR(191) NOT NULL,
    `scholarship` VARCHAR(191) NULL,
    `englishRequirement` VARCHAR(191) NOT NULL,
    `academicRequirement` VARCHAR(191) NOT NULL,
    `overview` VARCHAR(191) NOT NULL,
    `modules` VARCHAR(191) NOT NULL DEFAULT '[]',
    `careerOutcomes` VARCHAR(191) NOT NULL DEFAULT '[]',
    `documents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `faqs` VARCHAR(191) NOT NULL DEFAULT '[]',
    `deadline` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'VERIFIED',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CoursePage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseView` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL,
    `courseSlug` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CourseView_courseSlug_idx`(`courseSlug`),
    INDEX `CourseView_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataChange` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `changeType` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `sourcePageTitle` VARCHAR(191) NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `previousVerifiedAt` DATETIME(3) NULL,
    `newSourceDate` VARCHAR(191) NULL,
    `aiExplanation` VARCHAR(191) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0,
    `impactLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `appliedAt` DATETIME(3) NULL,
    `appliedBy` VARCHAR(191) NULL,
    `supersededBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DataChange_runId_idx`(`runId`),
    INDEX `DataChange_sourceId_idx`(`sourceId`),
    INDEX `DataChange_entityType_idx`(`entityType`),
    INDEX `DataChange_universitySlug_idx`(`universitySlug`),
    INDEX `DataChange_courseSlug_idx`(`courseSlug`),
    INDEX `DataChange_changeType_idx`(`changeType`),
    INDEX `DataChange_status_idx`(`status`),
    INDEX `DataChange_impactLevel_idx`(`impactLevel`),
    INDEX `DataChange_detectedAt_idx`(`detectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataChangeValue` (
    `id` VARCHAR(191) NOT NULL,
    `changeId` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `oldValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NULL,
    `oldValueHash` VARCHAR(191) NULL,
    `newValueHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DataChangeValue_changeId_idx`(`changeId`),
    INDEX `DataChangeValue_fieldName_idx`(`fieldName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DataConflict` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `conflictingValues` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `resolution` VARCHAR(191) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `resolutionNotes` VARCHAR(191) NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DataConflict_entityType_idx`(`entityType`),
    INDEX `DataConflict_universitySlug_idx`(`universitySlug`),
    INDEX `DataConflict_courseSlug_idx`(`courseSlug`),
    INDEX `DataConflict_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceManagement` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `deviceType` VARCHAR(191) NOT NULL,
    `deviceName` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `assetTag` VARCHAR(191) NULL,
    `assignedDate` VARCHAR(191) NOT NULL,
    `warrantyExpiry` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ASSIGNED',
    `returnedDate` VARCHAR(191) NULL,
    `condition` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DeviceManagement_employeeId_idx`(`employeeId`),
    INDEX `DeviceManagement_status_idx`(`status`),
    INDEX `DeviceManagement_deviceType_idx`(`deviceType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `required` BOOLEAN NOT NULL DEFAULT true,
    `fileName` VARCHAR(191) NULL,
    `fileType` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `storagePath` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `rejectionReason` VARCHAR(191) NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `uploadedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Document_studentId_idx`(`studentId`),
    INDEX `Document_status_idx`(`status`),
    INDEX `Document_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `filePath` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NULL,
    `fileType` VARCHAR(191) NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewerId` VARCHAR(191) NULL,
    `reviewerNote` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `isLatest` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocumentVersion_documentId_idx`(`documentId`),
    INDEX `DocumentVersion_reviewStatus_idx`(`reviewStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailSync` (
    `id` VARCHAR(191) NOT NULL,
    `connectedAccountId` VARCHAR(191) NULL,
    `folder` VARCHAR(191) NOT NULL DEFAULT 'INBOX',
    `messageId` VARCHAR(191) NULL,
    `fromEmail` VARCHAR(191) NOT NULL,
    `toEmail` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `bodyText` VARCHAR(191) NULL,
    `bodyHtml` VARCHAR(191) NULL,
    `attachments` VARCHAR(191) NULL,
    `threadId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `matchedToCRM` BOOLEAN NOT NULL DEFAULT false,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailSync_studentId_idx`(`studentId`),
    INDEX `EmailSync_leadId_idx`(`leadId`),
    INDEX `EmailSync_fromEmail_idx`(`fromEmail`),
    INDEX `EmailSync_threadId_idx`(`threadId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeHR` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `officialEmail` VARCHAR(191) NOT NULL,
    `officialPhone` VARCHAR(191) NOT NULL,
    `personalEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `photo` VARCHAR(191) NOT NULL DEFAULT '',
    `fullName` VARCHAR(191) NOT NULL DEFAULT '',
    `fatherName` VARCHAR(191) NOT NULL DEFAULT '',
    `motherName` VARCHAR(191) NOT NULL DEFAULT '',
    `gender` VARCHAR(191) NOT NULL DEFAULT '',
    `dob` VARCHAR(191) NOT NULL DEFAULT '',
    `nationality` VARCHAR(191) NOT NULL DEFAULT 'Bangladeshi',
    `religion` VARCHAR(191) NOT NULL DEFAULT '',
    `bloodGroup` VARCHAR(191) NOT NULL DEFAULT '',
    `maritalStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `nidNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `passportNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `passportExpiry` VARCHAR(191) NOT NULL DEFAULT '',
    `tinNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `drivingLicense` VARCHAR(191) NOT NULL DEFAULT '',
    `presentAddress` TEXT NOT NULL DEFAULT '',
    `permanentAddress` TEXT NOT NULL DEFAULT '',
    `emergencyContactName` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyContactPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `emergencyRelation` VARCHAR(191) NOT NULL DEFAULT '',
    `bankName` VARCHAR(191) NOT NULL DEFAULT '',
    `bankAccount` VARCHAR(191) NOT NULL DEFAULT '',
    `bankBranch` VARCHAR(191) NOT NULL DEFAULT '',
    `bankRouting` VARCHAR(191) NOT NULL DEFAULT '',
    `mobileBankingType` VARCHAR(191) NOT NULL DEFAULT '',
    `mobileBankingNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `branch` VARCHAR(191) NOT NULL DEFAULT 'Dhaka HQ',
    `officeId` VARCHAR(191) NOT NULL DEFAULT '',
    `designation` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL,
    `employmentType` VARCHAR(191) NOT NULL DEFAULT 'FULL_TIME',
    `employeeType` VARCHAR(191) NOT NULL DEFAULT 'PERMANENT',
    `employmentStatus` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `joiningDate` VARCHAR(191) NOT NULL,
    `confirmationDate` VARCHAR(191) NOT NULL DEFAULT '',
    `probationEndDate` VARCHAR(191) NOT NULL DEFAULT '',
    `probationMonths` INTEGER NOT NULL DEFAULT 6,
    `salaryGrade` VARCHAR(191) NOT NULL DEFAULT 'G7',
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `baseSalary` DOUBLE NOT NULL DEFAULT 0,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `houseRent` DOUBLE NOT NULL DEFAULT 0,
    `medicalAllowance` DOUBLE NOT NULL DEFAULT 0,
    `conveyanceAllowance` DOUBLE NOT NULL DEFAULT 0,
    `taxDeduction` DOUBLE NOT NULL DEFAULT 0,
    `pfDeduction` DOUBLE NOT NULL DEFAULT 0,
    `pfRate` DOUBLE NOT NULL DEFAULT 8,
    `insurance` DOUBLE NOT NULL DEFAULT 0,
    `salaryCurrency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `workingHours` VARCHAR(191) NOT NULL DEFAULT '9:00 AM - 6:00 PM',
    `shift` VARCHAR(191) NOT NULL DEFAULT 'Day',
    `weekOff` VARCHAR(191) NOT NULL DEFAULT 'Friday',
    `performanceScore` DOUBLE NOT NULL DEFAULT 0,
    `targetLeads` INTEGER NOT NULL DEFAULT 0,
    `achievedLeads` INTEGER NOT NULL DEFAULT 0,
    `targetConversion` DOUBLE NOT NULL DEFAULT 0,
    `achievedConversion` DOUBLE NOT NULL DEFAULT 0,
    `managerId` VARCHAR(191) NULL,
    `reportingManagerId` VARCHAR(191) NOT NULL DEFAULT '',
    `skills` VARCHAR(191) NOT NULL DEFAULT '[]',
    `languages` VARCHAR(191) NOT NULL DEFAULT '[]',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `version` INTEGER NOT NULL DEFAULT 1,
    `documents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `warnings` VARCHAR(191) NOT NULL DEFAULT '[]',
    `managerFeedback` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmployeeHR_userId_key`(`userId`),
    UNIQUE INDEX `EmployeeHR_employeeId_key`(`employeeId`),
    INDEX `EmployeeHR_userId_idx`(`userId`),
    INDEX `EmployeeHR_employeeId_idx`(`employeeId`),
    INDEX `EmployeeHR_branch_idx`(`branch`),
    INDEX `EmployeeHR_department_idx`(`department`),
    INDEX `EmployeeHR_status_idx`(`status`),
    INDEX `EmployeeHR_employmentStatus_idx`(`employmentStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EscalationEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL DEFAULT 1,
    `communicationId` VARCHAR(191) NULL,
    `slaEventId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `counselorId` VARCHAR(191) NULL,
    `supervisorId` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `actionTaken` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolvedAt` DATETIME(3) NULL,

    INDEX `EscalationEvent_counselorId_idx`(`counselorId`),
    INDEX `EscalationEvent_status_idx`(`status`),
    INDEX `EscalationEvent_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EventPage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '[]',
    `coverImage` VARCHAR(191) NULL,
    `eventType` VARCHAR(191) NOT NULL DEFAULT 'WEBINAR',
    `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    `eventDate` DATETIME(3) NOT NULL,
    `eventEndDate` DATETIME(3) NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT 'Online',
    `city` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `onlineLink` VARCHAR(191) NULL,
    `capacity` INTEGER NULL,
    `registeredCount` INTEGER NOT NULL DEFAULT 0,
    `isFree` BOOLEAN NOT NULL DEFAULT true,
    `price` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EventPage_slug_key`(`slug`),
    INDEX `EventPage_status_idx`(`status`),
    INDEX `EventPage_category_idx`(`category`),
    INDEX `EventPage_eventDate_idx`(`eventDate`),
    INDEX `EventPage_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamPage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `intro` VARCHAR(191) NOT NULL,
    `whatIs` VARCHAR(191) NOT NULL,
    `modules` VARCHAR(191) NOT NULL DEFAULT '[]',
    `mockRules` VARCHAR(191) NOT NULL DEFAULT '[]',
    `freeQuota` VARCHAR(191) NOT NULL DEFAULT '{}',
    `examExperience` VARCHAR(191) NOT NULL DEFAULT '[]',
    `aiScoring` VARCHAR(191) NOT NULL DEFAULT '{}',
    `speakingPractice` VARCHAR(191) NOT NULL DEFAULT '{}',
    `writingReview` VARCHAR(191) NOT NULL DEFAULT '{}',
    `resultReport` VARCHAR(191) NOT NULL DEFAULT '[]',
    `pricing` VARCHAR(191) NOT NULL DEFAULT '{}',
    `faqs` VARCHAR(191) NOT NULL DEFAULT '[]',
    `disclaimer` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'VERIFIED',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ExamPage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExitManagement` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `exitType` VARCHAR(191) NOT NULL,
    `exitDate` VARCHAR(191) NOT NULL,
    `exitInterview` VARCHAR(191) NULL,
    `clearanceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `finalSettlement` DOUBLE NULL,
    `experienceLetterPath` VARCHAR(191) NULL,
    `relievingLetterPath` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ExitManagement_employeeId_idx`(`employeeId`),
    INDEX `ExitManagement_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureUsageLog` (
    `id` VARCHAR(191) NOT NULL,
    `ownerType` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `metadata` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FeatureUsageLog_ownerType_ownerId_featureKey_idx`(`ownerType`, `ownerId`, `featureKey`),
    INDEX `FeatureUsageLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileEvent` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `performedBy` VARCHAR(191) NULL,
    `performedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `performedFromIp` VARCHAR(191) NULL,
    `result` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FileEvent_fileId_idx`(`fileId`),
    INDEX `FileEvent_action_idx`(`action`),
    INDEX `FileEvent_performedBy_idx`(`performedBy`),
    INDEX `FileEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FileMetadata` (
    `id` VARCHAR(191) NOT NULL,
    `uuid` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `storedName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `extension` VARCHAR(191) NOT NULL,
    `sizeBytes` BIGINT NOT NULL,
    `checksumSha256` VARCHAR(191) NOT NULL,
    `storagePool` VARCHAR(191) NOT NULL,
    `storagePath` VARCHAR(191) NOT NULL,
    `absolutePath` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `studentId` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `employeeId` VARCHAR(191) NULL,
    `applicationId` VARCHAR(191) NULL,
    `projectId` VARCHAR(191) NULL,
    `uploadedBy` VARCHAR(191) NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `uploadedFromIp` VARCHAR(191) NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'WEB_UPLOAD',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'STUDENT_VISIBLE',
    `accessPolicy` VARCHAR(191) NOT NULL DEFAULT 'OWNER_AND_STAFF',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `deletedBy` VARCHAR(191) NULL,
    `deletionReason` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `previousVersionId` VARCHAR(191) NULL,
    `retentionPolicy` VARCHAR(191) NULL,
    `retentionExpiresAt` DATETIME(3) NULL,
    `metadata` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FileMetadata_uuid_key`(`uuid`),
    INDEX `FileMetadata_storagePool_idx`(`storagePool`),
    INDEX `FileMetadata_entityType_idx`(`entityType`),
    INDEX `FileMetadata_entityId_idx`(`entityId`),
    INDEX `FileMetadata_studentId_idx`(`studentId`),
    INDEX `FileMetadata_partnerId_idx`(`partnerId`),
    INDEX `FileMetadata_employeeId_idx`(`employeeId`),
    INDEX `FileMetadata_applicationId_idx`(`applicationId`),
    INDEX `FileMetadata_uploadedBy_idx`(`uploadedBy`),
    INDEX `FileMetadata_status_idx`(`status`),
    INDEX `FileMetadata_visibility_idx`(`visibility`),
    INDEX `FileMetadata_checksumSha256_idx`(`checksumSha256`),
    INDEX `FileMetadata_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `submissionCode` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `rawPayload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `normalizedData` VARCHAR(191) NULL DEFAULT '{}',
    `crmId` VARCHAR(191) NULL,
    `crmType` VARCHAR(191) NULL,
    `processingStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `errorMessage` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FormSubmission_submissionCode_key`(`submissionCode`),
    INDEX `FormSubmission_source_idx`(`source`),
    INDEX `FormSubmission_crmId_idx`(`crmId`),
    INDEX `FormSubmission_processingStatus_idx`(`processingStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ImportError` (
    `id` VARCHAR(191) NOT NULL,
    `batchId` VARCHAR(191) NOT NULL,
    `rowNumber` INTEGER NOT NULL,
    `fieldName` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NOT NULL,
    `rawData` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ImportError_batchId_idx`(`batchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterviewAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `studentAnswer` VARCHAR(191) NOT NULL DEFAULT '',
    `aiFeedback` VARCHAR(191) NULL,
    `aiScore` INTEGER NULL,
    `aiConfidence` VARCHAR(191) NULL,
    `completionStatus` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InterviewAnswer_studentId_idx`(`studentId`),
    INDEX `InterviewAnswer_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterviewQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `suggestedAnswer` VARCHAR(191) NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InterviewQuestion_universitySlug_idx`(`universitySlug`),
    INDEX `InterviewQuestion_countrySlug_idx`(`countrySlug`),
    INDEX `InterviewQuestion_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InterviewSession` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `transcript` VARCHAR(191) NOT NULL DEFAULT '[]',
    `scores` VARCHAR(191) NULL,
    `readiness` VARCHAR(191) NULL,
    `riskLevel` VARCHAR(191) NULL,
    `feedback` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    UNIQUE INDEX `InterviewSession_sessionId_key`(`sessionId`),
    INDEX `InterviewSession_studentId_idx`(`studentId`),
    INDEX `InterviewSession_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KeywordResearch` (
    `id` VARCHAR(191) NOT NULL,
    `keyword` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `course` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `searchVolume` INTEGER NOT NULL DEFAULT 0,
    `difficulty` DOUBLE NOT NULL DEFAULT 0,
    `cpc` DOUBLE NOT NULL DEFAULT 0,
    `competition` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `intent` VARCHAR(191) NOT NULL DEFAULT 'INFORMATIONAL',
    `clusterId` VARCHAR(191) NULL,
    `clusterName` VARCHAR(191) NULL,
    `relatedKeywords` VARCHAR(191) NULL,
    `serpFeatures` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'NEW',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `contentAssetId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KeywordResearch_keyword_idx`(`keyword`),
    INDEX `KeywordResearch_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeBaseArticle` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `course` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `topic` VARCHAR(191) NOT NULL,
    `year` INTEGER NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `summary` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sourceUrl` VARCHAR(191) NULL,
    `sourceTitle` VARCHAR(191) NULL,
    `officialUrl` VARCHAR(191) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `confidence` DOUBLE NOT NULL DEFAULT 0.5,
    `lastVerifiedAt` DATETIME(3) NULL,
    `nextVerificationAt` DATETIME(3) NULL,
    `contentHash` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `approvedBy` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `aiGenerated` BOOLEAN NOT NULL DEFAULT false,
    `aiAgentId` VARCHAR(191) NULL,
    `humanReviewed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `KnowledgeBaseArticle_slug_key`(`slug`),
    INDEX `KnowledgeBaseArticle_country_idx`(`country`),
    INDEX `KnowledgeBaseArticle_topic_idx`(`topic`),
    INDEX `KnowledgeBaseArticle_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KnowledgeCategory_slug_key`(`slug`),
    INDEX `KnowledgeCategory_parentId_idx`(`parentId`),
    INDEX `KnowledgeCategory_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeDocument` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `fileType` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NULL,
    `fileUrl` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `uploadDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiryDate` DATETIME(3) NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'EMPLOYEE',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'APPROVED',
    `approvedBy` VARCHAR(191) NULL,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `aiSummary` VARCHAR(191) NULL,
    `aiTags` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeDocument_categoryId_idx`(`categoryId`),
    INDEX `KnowledgeDocument_fileType_idx`(`fileType`),
    INDEX `KnowledgeDocument_visibility_idx`(`visibility`),
    INDEX `KnowledgeDocument_approvalStatus_idx`(`approvalStatus`),
    INDEX `KnowledgeDocument_isFeatured_idx`(`isFeatured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeNews` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `authorId` VARCHAR(191) NULL,
    `attachments` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeNews_category_idx`(`category`),
    INDEX `KnowledgeNews_country_idx`(`country`),
    INDEX `KnowledgeNews_status_idx`(`status`),
    INDEX `KnowledgeNews_isPinned_idx`(`isPinned`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeObject` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entitySlug` VARCHAR(191) NOT NULL,
    `fieldName` VARCHAR(191) NOT NULL,
    `fieldValue` VARCHAR(191) NOT NULL,
    `evidenceId` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `sourceTitle` VARCHAR(191) NULL,
    `retrievedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contentHash` VARCHAR(191) NULL,
    `confidence` DOUBLE NOT NULL DEFAULT 0.5,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `version` INTEGER NOT NULL DEFAULT 1,
    `previousValue` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KnowledgeObject_entityType_entitySlug_idx`(`entityType`, `entitySlug`),
    INDEX `KnowledgeObject_verificationStatus_idx`(`verificationStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeadOutreach` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NULL,
    `sourceName` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `consentStatus` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `outreachHistory` VARCHAR(191) NULL,
    `optOutDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeadOutreach_leadId_idx`(`leadId`),
    INDEX `LeadOutreach_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LearningPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL DEFAULT 'TEXT',
    `mediaUrl` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LearningPost_category_idx`(`category`),
    INDEX `LearningPost_visibility_idx`(`visibility`),
    INDEX `LearningPost_isApproved_idx`(`isApproved`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `leaveType` VARCHAR(191) NOT NULL,
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `days` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `reviewNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LeaveRequest_employeeId_idx`(`employeeId`),
    INDEX `LeaveRequest_status_idx`(`status`),
    INDEX `LeaveRequest_leaveType_idx`(`leaveType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LiveEditOverride` (
    `id` VARCHAR(191) NOT NULL,
    `pageRoute` VARCHAR(191) NOT NULL,
    `selector` VARCHAR(191) NOT NULL,
    `selectorIndex` INTEGER NOT NULL DEFAULT 0,
    `attribute` VARCHAR(191) NOT NULL DEFAULT 'textContent',
    `originalValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NOT NULL,
    `editedBy` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `previewOnly` BOOLEAN NOT NULL DEFAULT false,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LiveEditOverride_pageRoute_status_idx`(`pageRoute`, `status`),
    INDEX `LiveEditOverride_selector_idx`(`selector`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginSecurity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL,
    `browser` VARCHAR(191) NULL,
    `operatingSystem` VARCHAR(191) NULL,
    `deviceFingerprint` VARCHAR(191) NULL,
    `location` VARCHAR(191) NULL,
    `loginTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutTime` DATETIME(3) NULL,
    `sessionStatus` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `failedAttempts` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoginSecurity_userId_idx`(`userId`),
    INDEX `LoginSecurity_sessionStatus_idx`(`sessionStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingUserAccess` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessLevel` VARCHAR(191) NOT NULL DEFAULT 'LIMITED',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `permissions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MarketingUserAccess_status_idx`(`status`),
    UNIQUE INDEX `MarketingUserAccess_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonitoringJob` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `schedule` VARCHAR(191) NOT NULL DEFAULT '0 3 * * 1',
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `lockedBy` VARCHAR(191) NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockExpiresAt` DATETIME(3) NULL,
    `lastRunId` VARCHAR(191) NULL,
    `lastRunStartedAt` DATETIME(3) NULL,
    `lastRunCompletedAt` DATETIME(3) NULL,
    `lastRunStatus` VARCHAR(191) NULL,
    `nextRunAt` DATETIME(3) NULL,
    `totalRuns` INTEGER NOT NULL DEFAULT 0,
    `successfulRuns` INTEGER NOT NULL DEFAULT 0,
    `failedRuns` INTEGER NOT NULL DEFAULT 0,
    `maxRetries` INTEGER NOT NULL DEFAULT 3,
    `retryDelayMs` INTEGER NOT NULL DEFAULT 60000,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MonitoringJob_jobId_key`(`jobId`),
    INDEX `MonitoringJob_enabled_idx`(`enabled`),
    INDEX `MonitoringJob_nextRunAt_idx`(`nextRunAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonitoringLog` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NULL,
    `jobId` VARCHAR(191) NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `message` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entitySlug` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `metadata` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MonitoringLog_runId_idx`(`runId`),
    INDEX `MonitoringLog_jobId_idx`(`jobId`),
    INDEX `MonitoringLog_level_idx`(`level`),
    INDEX `MonitoringLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `N8nWorkflow` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `webhookUrl` VARCHAR(191) NOT NULL,
    `webhookSecret` VARCHAR(191) NULL,
    `triggerType` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastTriggeredAt` DATETIME(3) NULL,
    `triggerCount` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `N8nWorkflow_isActive_idx`(`isActive`),
    INDEX `N8nWorkflow_triggerType_idx`(`triggerType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NewsArticle` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `excerpt` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '[]',
    `coverImage` VARCHAR(191) NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'Announcement',
    `country` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `authorName` VARCHAR(191) NULL,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NewsArticle_slug_key`(`slug`),
    INDEX `NewsArticle_status_idx`(`status`),
    INDEX `NewsArticle_category_idx`(`category`),
    INDEX `NewsArticle_country_idx`(`country`),
    INDEX `NewsArticle_isPinned_idx`(`isPinned`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NoticeManagement` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `noticeType` VARCHAR(191) NOT NULL,
    `noticeDate` VARCHAR(191) NOT NULL,
    `noticePeriodDays` INTEGER NOT NULL DEFAULT 90,
    `remainingDays` INTEGER NOT NULL,
    `lastWorkingDay` VARCHAR(191) NULL,
    `handoverChecklist` VARCHAR(191) NULL,
    `assetReturnStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `clearanceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `finalSettlementStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NoticeManagement_employeeId_idx`(`employeeId`),
    INDEX `NoticeManagement_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationEngine` (
    `id` VARCHAR(191) NOT NULL,
    `recipientType` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NULL,
    `channel` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NULL,
    `metadata` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `NotificationEngine_recipientType_idx`(`recipientType`),
    INDEX `NotificationEngine_recipientId_idx`(`recipientId`),
    INDEX `NotificationEngine_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Office` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Office_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfficialDocument` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NULL,
    `courseSlug` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NOT NULL,
    `publicationDate` VARCHAR(191) NULL,
    `discoveredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastCheckedAt` DATETIME(3) NULL,
    `fileHash` VARCHAR(191) NULL,
    `fileSizeBytes` INTEGER NULL,
    `mimeType` VARCHAR(191) NULL,
    `version` VARCHAR(191) NULL,
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCOVERED',
    `storageLocation` VARCHAR(191) NULL,
    `supersededBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OfficialDocument_sourceId_idx`(`sourceId`),
    INDEX `OfficialDocument_universitySlug_idx`(`universitySlug`),
    INDEX `OfficialDocument_courseSlug_idx`(`courseSlug`),
    INDEX `OfficialDocument_documentType_idx`(`documentType`),
    INDEX `OfficialDocument_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OfficialEmail` (
    `id` VARCHAR(191) NOT NULL,
    `emailType` VARCHAR(191) NOT NULL,
    `recipient` VARCHAR(191) NOT NULL,
    `recipientName` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `senderIdentity` VARCHAR(191) NOT NULL DEFAULT 'noreply@aloeducation.com',
    `attachments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `relatedCrmId` VARCHAR(191) NULL,
    `relatedCrmType` VARCHAR(191) NULL,
    `sentAt` DATETIME(3) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OfficialEmail_status_idx`(`status`),
    INDEX `OfficialEmail_emailType_idx`(`emailType`),
    INDEX `OfficialEmail_recipient_idx`(`recipient`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `method` VARCHAR(191) NULL,
    `partnerId` VARCHAR(191) NULL,
    `commissionAmount` DOUBLE NULL,
    `commissionStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_paymentId_key`(`paymentId`),
    INDEX `Payment_studentId_idx`(`studentId`),
    INDEX `Payment_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payroll` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `monthYear` VARCHAR(191) NOT NULL,
    `basicSalary` DOUBLE NOT NULL,
    `allowances` DOUBLE NOT NULL DEFAULT 0,
    `bonus` DOUBLE NOT NULL DEFAULT 0,
    `overtime` DOUBLE NOT NULL DEFAULT 0,
    `loanDeduction` DOUBLE NOT NULL DEFAULT 0,
    `advanceDeduction` DOUBLE NOT NULL DEFAULT 0,
    `taxDeduction` DOUBLE NOT NULL DEFAULT 0,
    `providentFund` DOUBLE NOT NULL DEFAULT 0,
    `insuranceDeduction` DOUBLE NOT NULL DEFAULT 0,
    `totalEarnings` DOUBLE NOT NULL,
    `totalDeductions` DOUBLE NOT NULL,
    `netPay` DOUBLE NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `approvedBy` VARCHAR(191) NULL,
    `paidAt` DATETIME(3) NULL,
    `salarySlipPath` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Payroll_employeeId_idx`(`employeeId`),
    INDEX `Payroll_status_idx`(`status`),
    INDEX `Payroll_monthYear_idx`(`monthYear`),
    UNIQUE INDEX `Payroll_employeeId_monthYear_key`(`employeeId`, `monthYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuickReply` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `channel` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `shortcut` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `QuickReply_channel_idx`(`channel`),
    INDEX `QuickReply_category_idx`(`category`),
    INDEX `QuickReply_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Referral` (
    `id` VARCHAR(191) NOT NULL,
    `referralCode` VARCHAR(191) NOT NULL,
    `referrerStudentId` VARCHAR(191) NOT NULL,
    `referredLeadId` VARCHAR(191) NULL,
    `referredName` VARCHAR(191) NULL,
    `referredPhone` VARCHAR(191) NULL,
    `referredEmail` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `campaign` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `rewardOffered` VARCHAR(191) NULL,
    `rewardStatus` VARCHAR(191) NULL,
    `qualifiedAt` DATETIME(3) NULL,
    `enrolledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Referral_referralCode_key`(`referralCode`),
    INDEX `Referral_referrerStudentId_idx`(`referrerStudentId`),
    INDEX `Referral_status_idx`(`status`),
    INDEX `Referral_referralCode_idx`(`referralCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeoOpportunity` (
    `id` VARCHAR(191) NOT NULL,
    `opportunityType` VARCHAR(191) NOT NULL,
    `targetUrl` VARCHAR(191) NULL,
    `targetQuery` VARCHAR(191) NULL,
    `impressions` INTEGER NOT NULL DEFAULT 0,
    `clicks` INTEGER NOT NULL DEFAULT 0,
    `ctr` DOUBLE NOT NULL DEFAULT 0,
    `position` DOUBLE NOT NULL DEFAULT 0,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `suggestedAction` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SeoOpportunity_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SeoTask` (
    `id` VARCHAR(191) NOT NULL,
    `opportunityId` VARCHAR(191) NULL,
    `taskType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `targetUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `assignedTo` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SeoTask_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlaIncidentCounter` (
    `id` VARCHAR(191) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `totalAssigned` INTEGER NOT NULL DEFAULT 0,
    `requiredResponses` INTEGER NOT NULL DEFAULT 0,
    `slaBreaches` INTEGER NOT NULL DEFAULT 0,
    `validExclusions` INTEGER NOT NULL DEFAULT 0,
    `avgResponseTime` INTEGER NOT NULL DEFAULT 0,
    `worstDelay` INTEGER NOT NULL DEFAULT 0,
    `warningIssued` BOOLEAN NOT NULL DEFAULT false,
    `warningAt` DATETIME(3) NULL,
    `relatedMessageIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SlaIncidentCounter_counselorId_idx`(`counselorId`),
    UNIQUE INDEX `SlaIncidentCounter_counselorId_period_key`(`counselorId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlaJustification` (
    `id` VARCHAR(191) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `slaEventId` VARCHAR(191) NULL,
    `period` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `explanation` VARCHAR(191) NOT NULL,
    `evidence` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SlaJustification_counselorId_idx`(`counselorId`),
    INDEX `SlaJustification_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SlaPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `studentType` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `applicationStage` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `messageIntent` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `slaMinutes` INTEGER NOT NULL DEFAULT 30,
    `warningMinutes` INTEGER NOT NULL DEFAULT 20,
    `urgentMinutes` INTEGER NOT NULL DEFAULT 28,
    `overdueMinutes` INTEGER NOT NULL DEFAULT 30,
    `escalationMinutes` INTEGER NOT NULL DEFAULT 45,
    `businessHoursOnly` BOOLEAN NOT NULL DEFAULT false,
    `holidayCalendar` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SlaPolicy_channel_idx`(`channel`),
    INDEX `SlaPolicy_priority_idx`(`priority`),
    INDEX `SlaPolicy_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocialAccountOwnership` (
    `id` VARCHAR(191) NOT NULL,
    `connectedAccountId` VARCHAR(191) NULL,
    `platform` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NULL,
    `accountName` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL DEFAULT 'OFFICIAL',
    `ownerEmployeeId` VARCHAR(191) NULL,
    `organization` VARCHAR(191) NOT NULL DEFAULT 'ALO Education',
    `connectionStatus` VARCHAR(191) NOT NULL DEFAULT 'DISCONNECTED',
    `permissions` VARCHAR(191) NOT NULL DEFAULT '[]',
    `tokenStatus` VARCHAR(191) NOT NULL DEFAULT 'NONE',
    `webhookStatus` VARCHAR(191) NOT NULL DEFAULT 'INACTIVE',
    `lastSync` DATETIME(3) NULL,
    `requiresConfig` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SocialAccountOwnership_platform_idx`(`platform`),
    INDEX `SocialAccountOwnership_ownerEmployeeId_idx`(`ownerEmployeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SourceSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `capturedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `httpStatus` INTEGER NOT NULL,
    `contentHash` VARCHAR(191) NOT NULL,
    `contentLength` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(191) NULL,
    `contentType` VARCHAR(191) NULL,
    `textExtract` VARCHAR(191) NOT NULL,
    `aiSummary` VARCHAR(191) NULL,
    `aiKeyFacts` VARCHAR(191) NOT NULL DEFAULT '{}',
    `captureDurationMs` INTEGER NOT NULL DEFAULT 0,
    `fetchError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SourceSnapshot_sourceId_idx`(`sourceId`),
    INDEX `SourceSnapshot_capturedAt_idx`(`capturedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoragePool` (
    `id` VARCHAR(191) NOT NULL,
    `poolKey` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `mountPath` VARCHAR(191) NOT NULL,
    `capacityBytes` BIGINT NOT NULL DEFAULT 0,
    `usedBytes` BIGINT NOT NULL DEFAULT 0,
    `fileCount` INTEGER NOT NULL DEFAULT 0,
    `warningThreshold` INTEGER NOT NULL DEFAULT 70,
    `highThreshold` INTEGER NOT NULL DEFAULT 85,
    `criticalThreshold` INTEGER NOT NULL DEFAULT 95,
    `status` VARCHAR(191) NOT NULL DEFAULT 'HEALTHY',
    `lastHealthCheck` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StoragePool_poolKey_key`(`poolKey`),
    INDEX `StoragePool_poolKey_idx`(`poolKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentNotification` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `relatedId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentNotification_studentId_idx`(`studentId`),
    INDEX `StudentNotification_isRead_idx`(`isRead`),
    INDEX `StudentNotification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrainingMaterial` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `videoUrl` VARCHAR(191) NULL,
    `documentPath` VARCHAR(191) NULL,
    `duration` INTEGER NULL,
    `trainerId` VARCHAR(191) NULL,
    `passScore` INTEGER NULL,
    `certificateEnabled` BOOLEAN NOT NULL DEFAULT false,
    `enrolledCount` INTEGER NOT NULL DEFAULT 0,
    `completedCount` INTEGER NOT NULL DEFAULT 0,
    `tags` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TrainingMaterial_type_idx`(`type`),
    INDEX `TrainingMaterial_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityAgreement` (
    `id` VARCHAR(191) NOT NULL,
    `agreementCode` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL,
    `countrySlug` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `partnershipType` VARCHAR(191) NULL,
    `commissionTerms` VARCHAR(191) NULL,
    `agreementUrl` VARCHAR(191) NULL,
    `contactName` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `contactPhone` VARCHAR(191) NULL,
    `officialWebsite` VARCHAR(191) NULL,
    `researchData` VARCHAR(191) NULL DEFAULT '{}',
    `notes` VARCHAR(191) NULL,
    `requestedById` VARCHAR(191) NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UniversityAgreement_agreementCode_key`(`agreementCode`),
    INDEX `UniversityAgreement_universitySlug_idx`(`universitySlug`),
    INDEX `UniversityAgreement_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityDigitalTwin` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `totalCourses` INTEGER NOT NULL DEFAULT 0,
    `totalScholarships` INTEGER NOT NULL DEFAULT 0,
    `totalIntakes` INTEGER NOT NULL DEFAULT 0,
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `recentChangeCount` INTEGER NOT NULL DEFAULT 0,
    `lastChangeAt` DATETIME(3) NULL,
    `relatedContentCount` INTEGER NOT NULL DEFAULT 0,
    `intelligenceSummary` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `UniversityDigitalTwin_universitySlug_key`(`universitySlug`),
    INDEX `UniversityDigitalTwin_universitySlug_idx`(`universitySlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityFaculty` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `facultyName` VARCHAR(191) NOT NULL,
    `facultyType` VARCHAR(191) NOT NULL DEFAULT 'FACULTY',
    `parentFacultyId` VARCHAR(191) NULL,
    `officialUrl` VARCHAR(191) NULL,
    `programmeCount` INTEGER NOT NULL DEFAULT 0,
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'UNVERIFIED',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UniversityFaculty_universitySlug_idx`(`universitySlug`),
    INDEX `UniversityFaculty_facultyType_idx`(`facultyType`),
    INDEX `UniversityFaculty_approvalStatus_idx`(`approvalStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityPage` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `countrySlug` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `overview` VARCHAR(191) NOT NULL,
    `strengths` VARCHAR(191) NOT NULL DEFAULT '[]',
    `quickFacts` VARCHAR(191) NOT NULL DEFAULT '{}',
    `entryRequirements` VARCHAR(191) NOT NULL DEFAULT '{}',
    `tuition` VARCHAR(191) NOT NULL DEFAULT '{}',
    `applicationSteps` VARCHAR(191) NOT NULL DEFAULT '[]',
    `documents` VARCHAR(191) NOT NULL DEFAULT '[]',
    `faqs` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sourceUrl` VARCHAR(191) NULL,
    `lastVerifiedAt` DATETIME(3) NULL,
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'VERIFIED',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UniversityPage_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationRun` (
    `id` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `universitiesChecked` INTEGER NOT NULL DEFAULT 0,
    `coursesChecked` INTEGER NOT NULL DEFAULT 0,
    `sourcesChecked` INTEGER NOT NULL DEFAULT 0,
    `changesDetected` INTEGER NOT NULL DEFAULT 0,
    `newUniversities` INTEGER NOT NULL DEFAULT 0,
    `newCourses` INTEGER NOT NULL DEFAULT 0,
    `updatedCourses` INTEGER NOT NULL DEFAULT 0,
    `closedCourses` INTEGER NOT NULL DEFAULT 0,
    `feeChanges` INTEGER NOT NULL DEFAULT 0,
    `intakeChanges` INTEGER NOT NULL DEFAULT 0,
    `deadlineChanges` INTEGER NOT NULL DEFAULT 0,
    `requirementChanges` INTEGER NOT NULL DEFAULT 0,
    `scholarshipChanges` INTEGER NOT NULL DEFAULT 0,
    `governmentChanges` INTEGER NOT NULL DEFAULT 0,
    `criticalChanges` INTEGER NOT NULL DEFAULT 0,
    `failedSources` INTEGER NOT NULL DEFAULT 0,
    `conflicts` INTEGER NOT NULL DEFAULT 0,
    `manualReviewItems` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` VARCHAR(191) NULL,
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `aiReportSummary` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VerificationRun_runId_key`(`runId`),
    INDEX `VerificationRun_jobId_idx`(`jobId`),
    INDEX `VerificationRun_status_idx`(`status`),
    INDEX `VerificationRun_startedAt_idx`(`startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaReadinessAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NULL,
    `overallScore` INTEGER NOT NULL DEFAULT 0,
    `documentsScore` INTEGER NOT NULL DEFAULT 0,
    `financialScore` INTEGER NOT NULL DEFAULT 0,
    `academicScore` INTEGER NOT NULL DEFAULT 0,
    `courseKnowledgeScore` INTEGER NOT NULL DEFAULT 0,
    `universityKnowledgeScore` INTEGER NOT NULL DEFAULT 0,
    `studyPlanScore` INTEGER NOT NULL DEFAULT 0,
    `interviewReadinessScore` INTEGER NOT NULL DEFAULT 0,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `riskFlags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `recommendations` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assessedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VisaReadinessAssessment_studentId_idx`(`studentId`),
    INDEX `VisaReadinessAssessment_riskLevel_idx`(`riskLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NOT NULL DEFAULT '',
    `color` VARCHAR(191) NOT NULL DEFAULT '',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `AgentDepartment_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentEngineType` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `AgentEngineType_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentDefinition` (
    `id` VARCHAR(191) NOT NULL,
    `agentCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `departmentId` VARCHAR(191) NOT NULL,
    `engineTypeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentDefinition_agentCode_key`(`agentCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentRuntime` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'idle',
    `lastHeartbeatAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentRuntime_agentId_key`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentTask` (
    `id` VARCHAR(191) NOT NULL,
    `taskCode` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `triggeredBy` VARCHAR(191) NOT NULL,
    `triggerType` VARCHAR(191) NOT NULL,
    `input` VARCHAR(191) NOT NULL,
    `output` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `errorMessage` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentTask_taskCode_key`(`taskCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentApprovalQueue` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedById` VARCHAR(191) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentMemory` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `memoryType` VARCHAR(191) NOT NULL DEFAULT 'context',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AgentMemory_agentId_key_key`(`agentId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL DEFAULT 'system',
    `before` LONGTEXT NOT NULL DEFAULT '',
    `after` LONGTEXT NOT NULL DEFAULT '',
    `metadata` LONGTEXT NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `cronExpression` VARCHAR(191) NOT NULL,
    `inputPayload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `name` VARCHAR(191) NOT NULL,
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Dhaka',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `nextRunAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmEmployeeExperience` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL DEFAULT '',
    `designation` VARCHAR(191) NOT NULL DEFAULT '',
    `fromDate` VARCHAR(191) NOT NULL DEFAULT '',
    `toDate` VARCHAR(191) NOT NULL DEFAULT '',
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `description` TEXT NOT NULL DEFAULT '',
    `certificatePath` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HrmEmployeeExperience_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmEmployeeSkill` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `level` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HrmEmployeeSkill_employeeId_idx`(`employeeId`),
    UNIQUE INDEX `HrmEmployeeSkill_employeeId_name_key`(`employeeId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmEmployeeLanguage` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `reading` VARCHAR(191) NOT NULL DEFAULT 'good',
    `writing` VARCHAR(191) NOT NULL DEFAULT 'good',
    `speaking` VARCHAR(191) NOT NULL DEFAULT 'good',
    `overall` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
    `certificatePath` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HrmEmployeeLanguage_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmAttendanceHoliday` (
    `id` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'public',
    `isHoliday` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HrmAttendanceHoliday_date_key`(`date`),
    INDEX `HrmAttendanceHoliday_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmPayrollConfig` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `salaryGrade` VARCHAR(191) NOT NULL DEFAULT 'G7',
    `grossSalary` DOUBLE NOT NULL DEFAULT 0,
    `basicPercent` DOUBLE NOT NULL DEFAULT 60,
    `houseRentPercent` DOUBLE NOT NULL DEFAULT 30,
    `medicalPercent` DOUBLE NOT NULL DEFAULT 10,
    `taxSlab` VARCHAR(191) NOT NULL DEFAULT 'general',
    `pfEnabled` BOOLEAN NOT NULL DEFAULT true,
    `pfRate` DOUBLE NOT NULL DEFAULT 8,
    `insuranceAmount` DOUBLE NOT NULL DEFAULT 0,
    `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HrmPayrollConfig_employeeId_key`(`employeeId`),
    INDEX `HrmPayrollConfig_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmPayrollRun` (
    `id` VARCHAR(191) NOT NULL,
    `monthYear` VARCHAR(191) NOT NULL,
    `totalEmployees` INTEGER NOT NULL DEFAULT 0,
    `totalGross` DOUBLE NOT NULL DEFAULT 0,
    `totalDeductions` DOUBLE NOT NULL DEFAULT 0,
    `totalNet` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `preparedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `paidAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HrmPayrollRun_status_idx`(`status`),
    UNIQUE INDEX `HrmPayrollRun_monthYear_key`(`monthYear`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmNotice` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `noticeType` VARCHAR(191) NOT NULL,
    `noticeDate` VARCHAR(191) NOT NULL,
    `noticePeriodDays` INTEGER NOT NULL DEFAULT 90,
    `lastWorkingDay` VARCHAR(191) NOT NULL,
    `remainingDays` INTEGER NOT NULL DEFAULT 90,
    `reason` TEXT NOT NULL DEFAULT '',
    `handoverChecklist` VARCHAR(191) NOT NULL DEFAULT '[]',
    `assetReturnStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `clearanceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `finalSettlementStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `finalSettlementAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HrmNotice_employeeId_idx`(`employeeId`),
    INDEX `HrmNotice_status_idx`(`status`),
    INDEX `HrmNotice_noticeDate_idx`(`noticeDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmExit` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `exitType` VARCHAR(191) NOT NULL,
    `exitDate` VARCHAR(191) NOT NULL,
    `exitInterviewDate` VARCHAR(191) NOT NULL DEFAULT '',
    `exitInterviewNotes` TEXT NOT NULL DEFAULT '',
    `exitInterviewConducted` BOOLEAN NOT NULL DEFAULT false,
    `clearanceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `clearanceChecklist` VARCHAR(191) NOT NULL DEFAULT '[]',
    `finalSettlement` DOUBLE NOT NULL DEFAULT 0,
    `experienceLetterPath` VARCHAR(191) NOT NULL DEFAULT '',
    `relievingLetterPath` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `HrmExit_employeeId_key`(`employeeId`),
    INDEX `HrmExit_exitType_idx`(`exitType`),
    INDEX `HrmExit_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmDeviceLog` (
    `id` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `condition` VARCHAR(191) NOT NULL DEFAULT 'good',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `actedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HrmDeviceLog_deviceId_idx`(`deviceId`),
    INDEX `HrmDeviceLog_employeeId_idx`(`employeeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmLoginSecurityExtended` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL,
    `browser` VARCHAR(191) NOT NULL DEFAULT '',
    `operatingSystem` VARCHAR(191) NOT NULL DEFAULT '',
    `deviceFingerprint` VARCHAR(191) NOT NULL DEFAULT '',
    `device` VARCHAR(191) NOT NULL DEFAULT '',
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `logoutAt` DATETIME(3) NULL,
    `success` BOOLEAN NOT NULL DEFAULT true,
    `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
    `sessionId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HrmLoginSecurityExtended_userId_idx`(`userId`),
    INDEX `HrmLoginSecurityExtended_employeeId_idx`(`employeeId`),
    INDEX `HrmLoginSecurityExtended_ipAddress_idx`(`ipAddress`),
    INDEX `HrmLoginSecurityExtended_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorId` VARCHAR(191) NOT NULL,
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `oldValue` LONGTEXT NOT NULL DEFAULT '{}',
    `newValue` LONGTEXT NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HrmAuditLog_employeeId_idx`(`employeeId`),
    INDEX `HrmAuditLog_actorId_idx`(`actorId`),
    INDEX `HrmAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `HrmAuditLog_action_idx`(`action`),
    INDEX `HrmAuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmNotification` (
    `id` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `recipientRole` VARCHAR(191) NOT NULL DEFAULT 'EMPLOYEE',
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'HR',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `actionUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HrmNotification_recipientId_idx`(`recipientId`),
    INDEX `HrmNotification_isRead_idx`(`isRead`),
    INDEX `HrmNotification_category_idx`(`category`),
    INDEX `HrmNotification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HrmHrPolicy` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `HrmHrPolicy_category_idx`(`category`),
    INDEX `HrmHrPolicy_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationPaymentInstruction` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `instruction` VARCHAR(191) NOT NULL DEFAULT '',
    `dueDate` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApplicationPaymentInstruction_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationSerial` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `serialNumber` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ApplicationSerial_applicationId_key`(`applicationId`),
    UNIQUE INDEX `ApplicationSerial_serialNumber_key`(`serialNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationSubmissionReceipt` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT '',
    `receiptNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationSubmissionReceipt_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationSlaIncident` (
    `id` VARCHAR(191) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `slaEventId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `severity` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CommunicationSlaIncident_counselorId_idx`(`counselorId`),
    INDEX `CommunicationSlaIncident_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommunicationSlaJustification` (
    `id` VARCHAR(191) NOT NULL,
    `incidentId` VARCHAR(191) NULL,
    `slaEventId` VARCHAR(191) NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT '',
    `explanation` VARCHAR(191) NOT NULL DEFAULT '',
    `evidence` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedBy` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `reviewDecision` VARCHAR(191) NULL,
    `reviewNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CommunicationSlaJustification_incidentId_key`(`incidentId`),
    INDEX `CommunicationSlaJustification_counselorId_idx`(`counselorId`),
    INDEX `CommunicationSlaJustification_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CounselorResponseMetric` (
    `id` VARCHAR(191) NOT NULL,
    `counselorId` VARCHAR(191) NOT NULL,
    `periodMonth` VARCHAR(191) NOT NULL,
    `totalReceived` INTEGER NOT NULL DEFAULT 0,
    `totalResponded` INTEGER NOT NULL DEFAULT 0,
    `averageResponseMinutes` DOUBLE NOT NULL DEFAULT 0,
    `slaCompliance` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CounselorResponseMetric_counselorId_periodMonth_key`(`counselorId`, `periodMonth`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentChecklist` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `requiredDocuments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `completedDocuments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DocumentChecklist_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinderEligibilityResult` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `assessmentId` VARCHAR(191) NULL,
    `result` VARCHAR(191) NOT NULL DEFAULT '{}',
    `eligibleCourses` VARCHAR(191) NOT NULL DEFAULT '[]',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FinderEligibilityResult_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PhoneCallRecord` (
    `id` VARCHAR(191) NOT NULL,
    `callCode` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL DEFAULT 'outbound',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentName` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `outcome` VARCHAR(191) NOT NULL DEFAULT '',
    `durationSeconds` INTEGER NOT NULL DEFAULT 0,
    `recordingConsent` BOOLEAN NOT NULL DEFAULT false,
    `studentVisibleNote` VARCHAR(191) NOT NULL DEFAULT '',
    `internalNote` VARCHAR(191) NOT NULL DEFAULT '',
    `startedAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PhoneCallRecord_callCode_key`(`callCode`),
    INDEX `PhoneCallRecord_studentId_idx`(`studentId`),
    INDEX `PhoneCallRecord_counselorId_idx`(`counselorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentEvent` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentEvent_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentNextBestAction` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `actionType` VARCHAR(191) NOT NULL DEFAULT '',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentNextBestAction_studentId_idx`(`studentId`),
    INDEX `StudentNextBestAction_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentSession` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `deviceInfo` VARCHAR(191) NOT NULL DEFAULT '',
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `revokedReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `StudentSession_token_key`(`token`),
    INDEX `StudentSession_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoProject` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT 'promo',
    `providerId` VARCHAR(191) NOT NULL DEFAULT 'remotion',
    `templateId` VARCHAR(191) NULL,
    `aspectRatio` VARCHAR(191) NOT NULL DEFAULT '16:9',
    `resolution` VARCHAR(191) NOT NULL DEFAULT '1080p',
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `durationSec` INTEGER NOT NULL DEFAULT 30,
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `script` TEXT NOT NULL DEFAULT '',
    `voiceoverScript` TEXT NOT NULL DEFAULT '',
    `scenes` LONGTEXT NOT NULL DEFAULT '[]',
    `assets` LONGTEXT NOT NULL DEFAULT '[]',
    `brandOverlay` BOOLEAN NOT NULL DEFAULT true,
    `subtitle` BOOLEAN NOT NULL DEFAULT true,
    `thumbnailConcept` TEXT NOT NULL DEFAULT '',
    `prompt` TEXT NOT NULL DEFAULT '',
    `negativePrompt` TEXT NOT NULL DEFAULT '',
    `referenceImageUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `audioUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` LONGTEXT NOT NULL DEFAULT '{}',
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `outputUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `thumbnailUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitleUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `durationActualSec` INTEGER NOT NULL DEFAULT 0,
    `renderJobId` VARCHAR(191) NOT NULL DEFAULT '',
    `providerResponse` LONGTEXT NOT NULL DEFAULT '{}',
    `createdById` VARCHAR(191) NOT NULL,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoProject_providerId_idx`(`providerId`),
    INDEX `VideoProject_category_idx`(`category`),
    INDEX `VideoProject_status_idx`(`status`),
    INDEX `VideoProject_createdById_idx`(`createdById`),
    INDEX `VideoProject_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoEngineJob` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL DEFAULT 'remotion',
    `jobType` VARCHAR(191) NOT NULL DEFAULT 'render',
    `status` VARCHAR(191) NOT NULL DEFAULT 'queued',
    `progress` INTEGER NOT NULL DEFAULT 0,
    `logs` LONGTEXT NOT NULL DEFAULT '[]',
    `outputUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `thumbnailUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `subtitleUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `error` TEXT NOT NULL DEFAULT '',
    `inputPayload` LONGTEXT NOT NULL DEFAULT '{}',
    `outputPayload` LONGTEXT NOT NULL DEFAULT '{}',
    `providerJobId` VARCHAR(191) NOT NULL DEFAULT '',
    `costUSD` DOUBLE NOT NULL DEFAULT 0,
    `durationSec` INTEGER NOT NULL DEFAULT 0,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoEngineJob_projectId_idx`(`projectId`),
    INDEX `VideoEngineJob_providerId_idx`(`providerId`),
    INDEX `VideoEngineJob_status_idx`(`status`),
    INDEX `VideoEngineJob_jobType_idx`(`jobType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT 'promo',
    `providerId` VARCHAR(191) NOT NULL DEFAULT 'remotion',
    `durationFrames` INTEGER NOT NULL DEFAULT 900,
    `fps` INTEGER NOT NULL DEFAULT 30,
    `width` INTEGER NOT NULL DEFAULT 1920,
    `height` INTEGER NOT NULL DEFAULT 1080,
    `defaultProps` LONGTEXT NOT NULL DEFAULT '{}',
    `thumbnailUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `code` LONGTEXT NOT NULL DEFAULT '',
    `isSystem` BOOLEAN NOT NULL DEFAULT true,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `usageCount` INTEGER NOT NULL DEFAULT 0,
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VideoTemplate_templateId_key`(`templateId`),
    INDEX `VideoTemplate_category_idx`(`category`),
    INDEX `VideoTemplate_providerId_idx`(`providerId`),
    INDEX `VideoTemplate_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoProviderConfig` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `apiUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `apiKey` VARCHAR(191) NOT NULL DEFAULT '',
    `localPath` VARCHAR(191) NOT NULL DEFAULT '',
    `extraConfig` LONGTEXT NOT NULL DEFAULT '{}',
    `vramRequiredGB` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_configured',
    `lastCheckedAt` DATETIME(3) NULL,
    `lastError` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VideoProviderConfig_providerId_key`(`providerId`),
    INDEX `VideoProviderConfig_enabled_idx`(`enabled`),
    INDEX `VideoProviderConfig_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoAsset` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'video',
    `url` VARCHAR(191) NOT NULL DEFAULT '',
    `thumbnailUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sizeBytes` BIGINT NOT NULL DEFAULT 0,
    `durationSec` DOUBLE NOT NULL DEFAULT 0,
    `width` INTEGER NOT NULL DEFAULT 0,
    `height` INTEGER NOT NULL DEFAULT 0,
    `format` VARCHAR(191) NOT NULL DEFAULT '',
    `providerId` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` LONGTEXT NOT NULL DEFAULT '{}',
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoAsset_projectId_idx`(`projectId`),
    INDEX `VideoAsset_type_idx`(`type`),
    INDEX `VideoAsset_providerId_idx`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoCaption` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NULL,
    `jobId` VARCHAR(191) NULL,
    `videoUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `language` VARCHAR(191) NOT NULL DEFAULT 'en',
    `srtUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `vttUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `assUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `txtUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `segments` LONGTEXT NOT NULL DEFAULT '[]',
    `translated` LONGTEXT NOT NULL DEFAULT '{}',
    `providerId` VARCHAR(191) NOT NULL DEFAULT 'videocaptioner',
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VideoCaption_projectId_idx`(`projectId`),
    INDEX `VideoCaption_language_idx`(`language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoRecording` (
    `id` VARCHAR(191) NOT NULL,
    `recordingId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'camera',
    `jitsiRoomName` VARCHAR(191) NOT NULL DEFAULT '',
    `counselingSessionId` VARCHAR(191) NOT NULL DEFAULT '',
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `outputUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `durationSec` INTEGER NOT NULL DEFAULT 0,
    `transcriptUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `summary` TEXT NOT NULL DEFAULT '',
    `chapters` LONGTEXT NOT NULL DEFAULT '[]',
    `actionItems` LONGTEXT NOT NULL DEFAULT '[]',
    `complianceChecks` LONGTEXT NOT NULL DEFAULT '[]',
    `status` VARCHAR(191) NOT NULL DEFAULT 'completed',
    `consentGiven` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VideoRecording_recordingId_key`(`recordingId`),
    INDEX `VideoRecording_studentId_idx`(`studentId`),
    INDEX `VideoRecording_counselorId_idx`(`counselorId`),
    INDEX `VideoRecording_counselingSessionId_idx`(`counselingSessionId`),
    INDEX `VideoRecording_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VideoAnalytics` (
    `id` VARCHAR(191) NOT NULL,
    `projectId` VARCHAR(191) NOT NULL,
    `platform` VARCHAR(191) NOT NULL DEFAULT 'facebook',
    `views` INTEGER NOT NULL DEFAULT 0,
    `likes` INTEGER NOT NULL DEFAULT 0,
    `shares` INTEGER NOT NULL DEFAULT 0,
    `comments` INTEGER NOT NULL DEFAULT 0,
    `leadsGenerated` INTEGER NOT NULL DEFAULT 0,
    `ctr` DOUBLE NOT NULL DEFAULT 0,
    `watchTimeSec` INTEGER NOT NULL DEFAULT 0,
    `completionRate` DOUBLE NOT NULL DEFAULT 0,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VideoAnalytics_projectId_idx`(`projectId`),
    INDEX `VideoAnalytics_platform_idx`(`platform`),
    INDEX `VideoAnalytics_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeSharingPost` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `summary` TEXT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
    `fileUrl` VARCHAR(191) NULL,
    `fileType` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL DEFAULT '',
    `authorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `authorEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `upvotes` INTEGER NOT NULL DEFAULT 0,
    `views` INTEGER NOT NULL DEFAULT 0,
    `isPinned` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `universitySlug` VARCHAR(191) NULL,
    `countrySlug` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `KnowledgeSharingPost_slug_key`(`slug`),
    INDEX `KnowledgeSharingPost_category_idx`(`category`),
    INDEX `KnowledgeSharingPost_visibility_idx`(`visibility`),
    INDEX `KnowledgeSharingPost_status_idx`(`status`),
    INDEX `KnowledgeSharingPost_authorId_idx`(`authorId`),
    INDEX `KnowledgeSharingPost_universitySlug_idx`(`universitySlug`),
    INDEX `KnowledgeSharingPost_countrySlug_idx`(`countrySlug`),
    INDEX `KnowledgeSharingPost_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeSharingComment` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `authorName` VARCHAR(191) NOT NULL DEFAULT '',
    `authorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `KnowledgeSharingComment_postId_idx`(`postId`),
    INDEX `KnowledgeSharingComment_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KnowledgeSharingUpvote` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `KnowledgeSharingUpvote_postId_idx`(`postId`),
    INDEX `KnowledgeSharingUpvote_userId_idx`(`userId`),
    UNIQUE INDEX `KnowledgeSharingUpvote_postId_userId_key`(`postId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternationalOfficerProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `officerCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `region` VARCHAR(191) NOT NULL DEFAULT '',
    `specialization` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InternationalOfficerProfile_userId_key`(`userId`),
    UNIQUE INDEX `InternationalOfficerProfile_officerCode_key`(`officerCode`),
    INDEX `InternationalOfficerProfile_region_idx`(`region`),
    INDEX `InternationalOfficerProfile_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityResearchActivity` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL,
    `countrySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `activityType` VARCHAR(191) NOT NULL DEFAULT 'RESEARCH',
    `title` VARCHAR(191) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `researchData` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `assignedOfficerId` VARCHAR(191) NULL,
    `assignedOfficerName` VARCHAR(191) NOT NULL DEFAULT '',
    `evidenceUrls` VARCHAR(191) NOT NULL DEFAULT '[]',
    `nextAction` VARCHAR(191) NOT NULL DEFAULT '',
    `dueDate` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UniversityResearchActivity_universitySlug_idx`(`universitySlug`),
    INDEX `UniversityResearchActivity_countrySlug_idx`(`countrySlug`),
    INDEX `UniversityResearchActivity_activityType_idx`(`activityType`),
    INDEX `UniversityResearchActivity_status_idx`(`status`),
    INDEX `UniversityResearchActivity_assignedOfficerId_idx`(`assignedOfficerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnershipCommunication` (
    `id` VARCHAR(191) NOT NULL,
    `universitySlug` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL,
    `communicationType` VARCHAR(191) NOT NULL DEFAULT 'EMAIL',
    `subject` VARCHAR(191) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `direction` VARCHAR(191) NOT NULL DEFAULT 'OUTBOUND',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `contactName` VARCHAR(191) NOT NULL DEFAULT '',
    `contactEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `contactPhone` VARCHAR(191) NOT NULL DEFAULT '',
    `agreementId` VARCHAR(191) NULL,
    `emailId` VARCHAR(191) NULL,
    `b2bContactId` VARCHAR(191) NULL,
    `attachments` VARCHAR(191) NOT NULL DEFAULT '[]',
    `sentAt` DATETIME(3) NULL,
    `repliedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartnershipCommunication_universitySlug_idx`(`universitySlug`),
    INDEX `PartnershipCommunication_communicationType_idx`(`communicationType`),
    INDEX `PartnershipCommunication_status_idx`(`status`),
    INDEX `PartnershipCommunication_contactEmail_idx`(`contactEmail`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PartnershipBusinessStrategy` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `countrySlug` VARCHAR(191) NOT NULL DEFAULT '',
    `region` VARCHAR(191) NOT NULL DEFAULT '',
    `strategyType` VARCHAR(191) NOT NULL DEFAULT 'RAPID_PARTNERSHIP',
    `description` LONGTEXT NOT NULL,
    `bestMethods` LONGTEXT NOT NULL,
    `bestLocations` LONGTEXT NOT NULL,
    `targetUniversities` VARCHAR(191) NOT NULL DEFAULT '[]',
    `contactStrategy` LONGTEXT NOT NULL,
    `researchLeverage` LONGTEXT NOT NULL,
    `businessExpansion` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnershipBusinessStrategy_slug_key`(`slug`),
    INDEX `PartnershipBusinessStrategy_countrySlug_idx`(`countrySlug`),
    INDEX `PartnershipBusinessStrategy_region_idx`(`region`),
    INDEX `PartnershipBusinessStrategy_strategyType_idx`(`strategyType`),
    INDEX `PartnershipBusinessStrategy_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InternationalOfficerDashboardMetric` (
    `id` VARCHAR(191) NOT NULL,
    `officerId` VARCHAR(191) NULL,
    `metricType` VARCHAR(191) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `period` VARCHAR(191) NOT NULL DEFAULT 'ALL_TIME',
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InternationalOfficerDashboardMetric_officerId_idx`(`officerId`),
    INDEX `InternationalOfficerDashboardMetric_metricType_idx`(`metricType`),
    INDEX `InternationalOfficerDashboardMetric_period_idx`(`period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_EmployeeToOffice` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_EmployeeToOffice_AB_unique`(`A`, `B`),
    INDEX `_EmployeeToOffice_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MarketingApproval` ADD CONSTRAINT `MarketingApproval_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingApproval` ADD CONSTRAINT `MarketingApproval_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingLead` ADD CONSTRAINT `MarketingLead_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingAuditLog` ADD CONSTRAINT `MarketingAuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportStagingStudent` ADD CONSTRAINT `ImportStagingStudent_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `ImportBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisaInterviewQuestion` ADD CONSTRAINT `VisaInterviewQuestion_interviewId_fkey` FOREIGN KEY (`interviewId`) REFERENCES `VisaInterview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisaInterviewAnswer` ADD CONSTRAINT `VisaInterviewAnswer_interviewId_fkey` FOREIGN KEY (`interviewId`) REFERENCES `VisaInterview`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourse` ADD CONSTRAINT `CrmCourse_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourseIntakeFee` ADD CONSTRAINT `CrmCourseIntakeFee_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourseIntakeFee` ADD CONSTRAINT `CrmCourseIntakeFee_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourseRequirement` ADD CONSTRAINT `CrmCourseRequirement_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCourseRequirement` ADD CONSTRAINT `CrmCourseRequirement_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmScholarship` ADD CONSTRAINT `CrmScholarship_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmScholarship` ADD CONSTRAINT `CrmScholarship_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmRanking` ADD CONSTRAINT `CrmRanking_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmDiscoveryRecord` ADD CONSTRAINT `CrmDiscoveryRecord_discoverySourceId_fkey` FOREIGN KEY (`discoverySourceId`) REFERENCES `CrmDiscoverySource`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCommission` ADD CONSTRAINT `CrmCommission_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmCommission` ADD CONSTRAINT `CrmCommission_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CrmImportError` ADD CONSTRAINT `CrmImportError_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `CrmImportBatch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunicationThreadParticipant` ADD CONSTRAINT `CommunicationThreadParticipant_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `CommunicationThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunicationMessage` ADD CONSTRAINT `CommunicationMessage_threadId_fkey` FOREIGN KEY (`threadId`) REFERENCES `CommunicationThread`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalRolePermission` ADD CONSTRAINT `PortalRolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `PortalRole`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalRolePermission` ADD CONSTRAINT `PortalRolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `PortalPermission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalUserRole` ADD CONSTRAINT `PortalUserRole_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PortalUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalUserRole` ADD CONSTRAINT `PortalUserRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `PortalRole`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalSession` ADD CONSTRAINT `PortalSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PortalUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LoginAttempt` ADD CONSTRAINT `LoginAttempt_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PortalUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalStudentProfile` ADD CONSTRAINT `PortalStudentProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PortalUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeProfile` ADD CONSTRAINT `EmployeeProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PortalUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeActivationToken` ADD CONSTRAINT `EmployeeActivationToken_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `EmployeeProfile`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PartnerProfile` ADD CONSTRAINT `PartnerProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `PortalUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalStudentApplication` ADD CONSTRAINT `PortalStudentApplication_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalStudentDocument` ADD CONSTRAINT `PortalStudentDocument_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortalTimelineEvent` ADD CONSTRAINT `PortalTimelineEvent_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEducationRecord` ADD CONSTRAINT `StudentEducationRecord_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentWorkExpRecord` ADD CONSTRAINT `StudentWorkExpRecord_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentEnglishTestRecord` ADD CONSTRAINT `StudentEnglishTestRecord_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentVisaRefusal` ADD CONSTRAINT `StudentVisaRefusal_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentReferral` ADD CONSTRAINT `StudentReferral_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `PortalStudentProfile`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryQuickFact` ADD CONSTRAINT `CountryQuickFact_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryCity` ADD CONSTRAINT `CountryCity_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryEducationPathway` ADD CONSTRAINT `CountryEducationPathway_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryStudyReason` ADD CONSTRAINT `CountryStudyReason_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryEntryRequirement` ADD CONSTRAINT `CountryEntryRequirement_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryEnglishTest` ADD CONSTRAINT `CountryEnglishTest_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryVisaStep` ADD CONSTRAINT `CountryVisaStep_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryWorkRight` ADD CONSTRAINT `CountryWorkRight_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountryFaq` ADD CONSTRAINT `CountryFaq_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CountrySource` ADD CONSTRAINT `CountrySource_countryId_fkey` FOREIGN KEY (`countryId`) REFERENCES `Country`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SocialAccount` ADD CONSTRAINT `SocialAccount_integrationId_fkey` FOREIGN KEY (`integrationId`) REFERENCES `SocialIntegration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UccMessage` ADD CONSTRAINT `UccMessage_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `UccConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UccAttachment` ADD CONSTRAINT `UccAttachment_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `UccConversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UccAttachment` ADD CONSTRAINT `UccAttachment_messageId_fkey` FOREIGN KEY (`messageId`) REFERENCES `UccMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OcrFieldExtraction` ADD CONSTRAINT `OcrFieldExtraction_ocrJobId_fkey` FOREIGN KEY (`ocrJobId`) REFERENCES `OcrJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormFillSuggestion` ADD CONSTRAINT `FormFillSuggestion_ocrJobId_fkey` FOREIGN KEY (`ocrJobId`) REFERENCES `OcrJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WhatsAppNumberAssignmentAudit` ADD CONSTRAINT `WhatsAppNumberAssignmentAudit_numberId_fkey` FOREIGN KEY (`numberId`) REFERENCES `WhatsAppOfficialNumber`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeePayrollItem` ADD CONSTRAINT `EmployeePayrollItem_payrollId_fkey` FOREIGN KEY (`payrollId`) REFERENCES `EmployeePayroll`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeAgreementAcceptance` ADD CONSTRAINT `EmployeeAgreementAcceptance_agreementId_fkey` FOREIGN KEY (`agreementId`) REFERENCES `EmployeeAgreement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDocumentVersion` ADD CONSTRAINT `EmployeeDocumentVersion_employeeDocumentId_fkey` FOREIGN KEY (`employeeDocumentId`) REFERENCES `EmployeeDocument`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeDocumentVersion` ADD CONSTRAINT `EmployeeDocumentVersion_agreementId_fkey` FOREIGN KEY (`agreementId`) REFERENCES `EmployeeAgreement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_test_modules` ADD CONSTRAINT `english_test_modules_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `english_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_test_acceptance` ADD CONSTRAINT `english_test_acceptance_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `english_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_test_requirements` ADD CONSTRAINT `english_test_requirements_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `english_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_test_faqs` ADD CONSTRAINT `english_test_faqs_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `english_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_test_resources` ADD CONSTRAINT `english_test_resources_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `english_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_test_success_stories` ADD CONSTRAINT `english_test_success_stories_testId_fkey` FOREIGN KEY (`testId`) REFERENCES `english_tests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `b2b_applications` ADD CONSTRAINT `b2b_applications_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `b2b_applications` ADD CONSTRAINT `b2b_applications_b2bProviderId_fkey` FOREIGN KEY (`b2bProviderId`) REFERENCES `b2b_providers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_status_logs` ADD CONSTRAINT `application_status_logs_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_comments` ADD CONSTRAINT `application_comments_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_documents` ADD CONSTRAINT `application_documents_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_deadlines` ADD CONSTRAINT `application_deadlines_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_tasks` ADD CONSTRAINT `application_tasks_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_notifications` ADD CONSTRAINT `application_notifications_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_offers` ADD CONSTRAINT `application_offers_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_cas_i20_coe` ADD CONSTRAINT `application_cas_i20_coe_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_finances` ADD CONSTRAINT `application_finances_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_faqs` ADD CONSTRAINT `service_faqs_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `resource_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resource_faqs` ADD CONSTRAINT `resource_faqs_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scholarship_faqs` ADD CONSTRAINT `scholarship_faqs_scholarshipId_fkey` FOREIGN KEY (`scholarshipId`) REFERENCES `scholarships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_relationships` ADD CONSTRAINT `content_relationships_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_relationships` ADD CONSTRAINT `content_relationships_serviceReverseId_fkey` FOREIGN KEY (`serviceReverseId`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_relationships` ADD CONSTRAINT `content_relationships_scholarshipId_fkey` FOREIGN KEY (`scholarshipId`) REFERENCES `scholarships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_relationships` ADD CONSTRAINT `content_relationships_scholarshipReverseId_fkey` FOREIGN KEY (`scholarshipReverseId`) REFERENCES `scholarships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_relationships` ADD CONSTRAINT `content_relationships_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `content_relationships` ADD CONSTRAINT `content_relationships_resourceReverseId_fkey` FOREIGN KEY (`resourceReverseId`) REFERENCES `resources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campuses` ADD CONSTRAINT `campuses_universityId_fkey` FOREIGN KEY (`universityId`) REFERENCES `CrmUniversity`(`universityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disciplines` ADD CONSTRAINT `disciplines_studyAreaId_fkey` FOREIGN KEY (`studyAreaId`) REFERENCES `study_areas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_tags` ADD CONSTRAINT `course_tags_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_intakes` ADD CONSTRAINT `course_intakes_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `entry_requirements` ADD CONSTRAINT `entry_requirements_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `english_requirements` ADD CONSTRAINT `english_requirements_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `CrmCourse`(`courseId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAction` ADD CONSTRAINT `AiAction_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `AiTask`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApprovalAction` ADD CONSTRAINT `ApprovalAction_changeId_fkey` FOREIGN KEY (`changeId`) REFERENCES `DataChange`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoursePage` ADD CONSTRAINT `CoursePage_universitySlug_fkey` FOREIGN KEY (`universitySlug`) REFERENCES `UniversityPage`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataChange` ADD CONSTRAINT `DataChange_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `official_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DataChangeValue` ADD CONSTRAINT `DataChangeValue_changeId_fkey` FOREIGN KEY (`changeId`) REFERENCES `DataChange`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileEvent` ADD CONSTRAINT `FileEvent_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `FileMetadata`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FileMetadata` ADD CONSTRAINT `FileMetadata_previousVersionId_fkey` FOREIGN KEY (`previousVersionId`) REFERENCES `FileMetadata`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ImportError` ADD CONSTRAINT `ImportError_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `ImportBatch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InterviewSession` ADD CONSTRAINT `InterviewSession_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeadOutreach` ADD CONSTRAINT `LeadOutreach_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MarketingUserAccess` ADD CONSTRAINT `MarketingUserAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OfficialDocument` ADD CONSTRAINT `OfficialDocument_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `official_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerStudentId_fkey` FOREIGN KEY (`referrerStudentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SourceSnapshot` ADD CONSTRAINT `SourceSnapshot_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `official_sources`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentNotification` ADD CONSTRAINT `StudentNotification_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UniversityPage` ADD CONSTRAINT `UniversityPage_countrySlug_fkey` FOREIGN KEY (`countrySlug`) REFERENCES `CountryPage`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VerificationRun` ADD CONSTRAINT `VerificationRun_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `MonitoringJob`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VisaReadinessAssessment` ADD CONSTRAINT `VisaReadinessAssessment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentDefinition` ADD CONSTRAINT `AgentDefinition_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `AgentDepartment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentDefinition` ADD CONSTRAINT `AgentDefinition_engineTypeId_fkey` FOREIGN KEY (`engineTypeId`) REFERENCES `AgentEngineType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentRuntime` ADD CONSTRAINT `AgentRuntime_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentTask` ADD CONSTRAINT `AgentTask_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentApprovalQueue` ADD CONSTRAINT `AgentApprovalQueue_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentMemory` ADD CONSTRAINT `AgentMemory_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentAuditLog` ADD CONSTRAINT `AgentAuditLog_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentSchedule` ADD CONSTRAINT `AgentSchedule_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommunicationSlaJustification` ADD CONSTRAINT `CommunicationSlaJustification_incidentId_fkey` FOREIGN KEY (`incidentId`) REFERENCES `CommunicationSlaIncident`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VideoEngineJob` ADD CONSTRAINT `VideoEngineJob_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `VideoProject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VideoAsset` ADD CONSTRAINT `VideoAsset_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `VideoProject`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeSharingComment` ADD CONSTRAINT `KnowledgeSharingComment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `KnowledgeSharingPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KnowledgeSharingUpvote` ADD CONSTRAINT `KnowledgeSharingUpvote_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `KnowledgeSharingPost`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EmployeeToOffice` ADD CONSTRAINT `_EmployeeToOffice_A_fkey` FOREIGN KEY (`A`) REFERENCES `Employee`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_EmployeeToOffice` ADD CONSTRAINT `_EmployeeToOffice_B_fkey` FOREIGN KEY (`B`) REFERENCES `Office`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

