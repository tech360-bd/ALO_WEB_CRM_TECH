CREATE DATABASE IF NOT EXISTS `aloeduca_alo_education` DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
USE `aloeduca_alo_education`;

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

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeploymentSequence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `DeploymentSequence_name_key`(`name`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingLeadScore` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL DEFAULT 0,
    `factors` VARCHAR(191) NOT NULL DEFAULT '{}',
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MarketingRagChunk` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `embedding` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

    UNIQUE INDEX `Student_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `level` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `stage` VARCHAR(191) NOT NULL DEFAULT 'counseling',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `counselorId` VARCHAR(191) NOT NULL DEFAULT '',
    `counselorName` VARCHAR(191) NOT NULL DEFAULT '',
    `applicationOfficer` VARCHAR(191) NOT NULL DEFAULT '',
    `visaOfficerId` VARCHAR(191) NOT NULL DEFAULT '',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentDocument` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'not_uploaded',
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewerNote` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseComparison` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `courseIds` VARCHAR(191) NOT NULL DEFAULT '[]',
    `comparisonData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiInterviewSession` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `interviewType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `readinessScore` DOUBLE NOT NULL DEFAULT 0,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'needs_practice',
    `transcript` VARCHAR(191) NOT NULL DEFAULT '[]',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiInterviewAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` VARCHAR(191) NOT NULL DEFAULT '',
    `followUp` VARCHAR(191) NOT NULL DEFAULT '',
    `score` DOUBLE NOT NULL DEFAULT 0,
    `feedback` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `visaRisk` DOUBLE NOT NULL DEFAULT 0,
    `overallReadiness` DOUBLE NOT NULL DEFAULT 0,
    `verdict` VARCHAR(191) NOT NULL DEFAULT 'needs_practice',
    `finalFeedback` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AiInterviewResult_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaChecklistItem` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `item` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `isRequired` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VisaCase_studentId_idx`(`studentId`),
    INDEX `VisaCase_visaOfficerId_idx`(`visaOfficerId`),
    INDEX `VisaCase_counselorId_idx`(`counselorId`),
    INDEX `VisaCase_currentStage_idx`(`currentStage`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `officerNotes` VARCHAR(191) NOT NULL DEFAULT '',
    `studentFeedback` VARCHAR(191) NOT NULL DEFAULT '',
    `officerId` VARCHAR(191) NOT NULL DEFAULT '',
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaInterviewQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `difficulty` VARCHAR(191) NOT NULL DEFAULT 'standard',
    `language` VARCHAR(191) NOT NULL DEFAULT 'english',
    `followUps` VARCHAR(191) NOT NULL DEFAULT '[]',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaOfficerNote` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `officerId` VARCHAR(191) NOT NULL,
    `officerName` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL,
    `visibility` VARCHAR(191) NOT NULL DEFAULT 'internal_only',
    `riskFlag` VARCHAR(191) NOT NULL DEFAULT 'none',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `sourceOfFundExplanation` VARCHAR(191) NOT NULL DEFAULT '',
    `riskWarning` VARCHAR(191) NOT NULL DEFAULT 'none',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaFundingReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaStudyGapReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `hasStudyGap` BOOLEAN NOT NULL DEFAULT false,
    `gapDurationMonths` INTEGER NOT NULL DEFAULT 0,
    `gapPurpose` VARCHAR(191) NOT NULL DEFAULT '',
    `workExpDuringGap` VARCHAR(191) NOT NULL DEFAULT '',
    `explanationClarity` VARCHAR(191) NOT NULL DEFAULT 'clear',
    `riskFlag` VARCHAR(191) NOT NULL DEFAULT 'low',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaStudyGapReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaRefusalReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `hasVisaRefusal` BOOLEAN NOT NULL DEFAULT false,
    `refusalCountry` VARCHAR(191) NOT NULL DEFAULT '',
    `refusalReason` VARCHAR(191) NOT NULL DEFAULT '',
    `refusalLetterUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `improvementPlan` VARCHAR(191) NOT NULL DEFAULT '',
    `humanReviewStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaRefusalReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaSensitiveReview` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `seriousMedicalCondition` BOOLEAN NOT NULL DEFAULT false,
    `medicalExplanation` VARCHAR(191) NOT NULL DEFAULT '',
    `criminalOffense` BOOLEAN NOT NULL DEFAULT false,
    `criminalExplanation` VARCHAR(191) NOT NULL DEFAULT '',
    `officerInternalNote` VARCHAR(191) NOT NULL DEFAULT '',
    `studentSafeNote` VARCHAR(191) NOT NULL DEFAULT '',
    `humanReviewRequired` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VisaSensitiveReview_caseId_key`(`caseId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaTask` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `taskType` VARCHAR(191) NOT NULL DEFAULT 'document_request',
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedTo` VARCHAR(191) NOT NULL DEFAULT '',
    `dueDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VisaReport` (
    `id` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL DEFAULT 'daily_interview',
    `generatedBy` VARCHAR(191) NOT NULL,
    `filters` VARCHAR(191) NOT NULL DEFAULT '{}',
    `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ready',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmUniversity` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `campusName` VARCHAR(191) NOT NULL DEFAULT '',
    `ranking` INTEGER NOT NULL DEFAULT 0,
    `worldRanking` INTEGER NOT NULL DEFAULT 0,
    `type` VARCHAR(191) NOT NULL DEFAULT 'Public',
    `founded` INTEGER NOT NULL DEFAULT 0,
    `students` VARCHAR(191) NOT NULL DEFAULT '',
    `intlStudents` VARCHAR(191) NOT NULL DEFAULT '',
    `ieltsMin` DOUBLE NOT NULL DEFAULT 0,
    `tuitionRange` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarships` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `website` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'needs_official_source',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmUniversity_universityId_key`(`universityId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCourse` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `courseTitle` VARCHAR(191) NOT NULL,
    `studyLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `programLevel` VARCHAR(191) NOT NULL DEFAULT '',
    `subjectArea` VARCHAR(191) NOT NULL DEFAULT '',
    `disciplineArea` VARCHAR(191) NOT NULL DEFAULT '',
    `officialUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `durationMonths` INTEGER NOT NULL DEFAULT 0,
    `publicTags` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'needs_official_source',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CrmCourse_courseId_key`(`courseId`),
    INDEX `CrmCourse_universityId_idx`(`universityId`),
    INDEX `CrmCourse_courseTitle_idx`(`courseTitle`),
    INDEX `CrmCourse_subjectArea_idx`(`subjectArea`),
    INDEX `CrmCourse_studyLevel_idx`(`studyLevel`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    `depositCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `depositAmount` DOUBLE NOT NULL DEFAULT 0,
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmCourseIntakeFee_courseId_idx`(`courseId`),
    INDEX `CrmCourseIntakeFee_universityId_idx`(`universityId`),
    INDEX `CrmCourseIntakeFee_intakeYear_intakeMonth_idx`(`intakeYear`, `intakeMonth`),
    INDEX `CrmCourseIntakeFee_status_idx`(`status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmCourseRequirement` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `academicReq` VARCHAR(191) NOT NULL DEFAULT '',
    `gradingSystem` VARCHAR(191) NOT NULL DEFAULT '',
    `minScore` VARCHAR(191) NOT NULL DEFAULT '',
    `ieltsOverall` DOUBLE NOT NULL DEFAULT 0,
    `ieltsMinBand` DOUBLE NOT NULL DEFAULT 0,
    `pteOverall` DOUBLE NOT NULL DEFAULT 0,
    `pteMinBand` DOUBLE NOT NULL DEFAULT 0,
    `toeflOverall` DOUBLE NOT NULL DEFAULT 0,
    `detOverall` DOUBLE NOT NULL DEFAULT 0,
    `moiAccepted` BOOLEAN NOT NULL DEFAULT false,
    `ownEnglishTest` BOOLEAN NOT NULL DEFAULT false,
    `portfolioRequired` BOOLEAN NOT NULL DEFAULT false,
    `interviewRequired` BOOLEAN NOT NULL DEFAULT false,
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmCourseRequirement_courseId_idx`(`courseId`),
    INDEX `CrmCourseRequirement_universityId_idx`(`universityId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmScholarship` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipName` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipAmount` DOUBLE NOT NULL DEFAULT 0,
    `scholarshipCurrency` VARCHAR(191) NOT NULL DEFAULT '',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CrmScholarship_courseId_idx`(`courseId`),
    INDEX `CrmScholarship_universityId_idx`(`universityId`),
    INDEX `CrmScholarship_status_idx`(`status`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CrmAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `targetCollection` VARCHAR(191) NOT NULL DEFAULT '',
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `batchId` VARCHAR(191) NOT NULL DEFAULT '',
    `beforeData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `afterData` VARCHAR(191) NOT NULL DEFAULT '{}',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `checkIn` VARCHAR(191) NOT NULL DEFAULT '',
    `checkOut` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'present',
    `hoursWorked` DOUBLE NOT NULL DEFAULT 0,
    `note` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `feature` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL DEFAULT 'view',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserRole` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `grantedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalUserRole` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',

    UNIQUE INDEX `PortalUserRole_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortalAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PortalAuditLog_actorUserId_idx`(`actorUserId`),
    INDEX `PortalAuditLog_action_idx`(`action`),
    INDEX `PortalAuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Country` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL DEFAULT '',
    `countryCode` VARCHAR(191) NOT NULL DEFAULT '',
    `capital` VARCHAR(191) NOT NULL DEFAULT '',
    `currency` VARCHAR(191) NOT NULL DEFAULT '',
    `flag` VARCHAR(191) NOT NULL DEFAULT '',
    `heroTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `heroSubtitle` VARCHAR(191) NOT NULL DEFAULT '',
    `overview` VARCHAR(191) NOT NULL DEFAULT '',
    `whyStudySummary` VARCHAR(191) NOT NULL DEFAULT '',
    `visaType` VARCHAR(191) NOT NULL DEFAULT '',
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
    `livingCost` VARCHAR(191) NOT NULL DEFAULT '',
    `workRights` VARCHAR(191) NOT NULL DEFAULT '',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `heroImage` VARCHAR(191) NOT NULL DEFAULT '',
    `heroCity` VARCHAR(191) NOT NULL DEFAULT '',
    `heroIntake` VARCHAR(191) NOT NULL DEFAULT '',
    `seoTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `seoDescription` VARCHAR(191) NOT NULL DEFAULT '',
    `canonicalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `ogTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `ogDescription` VARCHAR(191) NOT NULL DEFAULT '',
    `lastVerifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Country_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeDocument` (
    `id` VARCHAR(191) NOT NULL,
    `employeeId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL DEFAULT '',
    `filePath` VARCHAR(191) NOT NULL DEFAULT '',
    `fileName` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `reviewerId` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewNote` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

    UNIQUE INDEX `EmployeeCommunicationProfile_employeeId_key`(`employeeId`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

