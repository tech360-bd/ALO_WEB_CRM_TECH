-- Additive donor capabilities consumed by Main source code.
-- Generated from the authoritative MySQL Prisma schema.
-- No existing table or row is dropped, deleted, truncated, or rewritten.

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
  PRIMARY KEY (`id`),
  INDEX `AgentOSExecution_taskId_idx` (`taskId`),
  INDEX `AgentOSExecution_stepType_idx` (`stepType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `AiAction_taskId_idx` (`taskId`),
  INDEX `AiAction_agentName_idx` (`agentName`),
  INDEX `AiAction_actionType_idx` (`actionType`),
  INDEX `AiAction_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `AiDocumentClassification_documentId_idx` (`documentId`),
  INDEX `AiDocumentClassification_detectedType_idx` (`detectedType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AiTask_taskCode_key` (`taskCode`),
  INDEX `AiTask_status_idx` (`status`),
  INDEX `AiTask_agentId_idx` (`agentId`),
  INDEX `AiTask_crmId_idx` (`crmId`),
  INDEX `AiTask_priority_idx` (`priority`),
  INDEX `AiTask_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationComment` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `role` VARCHAR(191) NULL,
  `commentType` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
  `visibility` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
  `commentText` VARCHAR(191) NOT NULL,
  `attachmentPath` VARCHAR(191) NULL,
  `isB2bConfidential` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ApplicationComment_applicationId_idx` (`applicationId`),
  INDEX `ApplicationComment_commentType_idx` (`commentType`),
  INDEX `ApplicationComment_visibility_idx` (`visibility`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationDeadline` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `deadlineType` VARCHAR(191) NOT NULL,
  `deadlineDate` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `assignedTo` VARCHAR(191) NULL,
  `reminderSent` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ApplicationDeadline_applicationId_idx` (`applicationId`),
  INDEX `ApplicationDeadline_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationDocument` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NULL,
  `documentId` VARCHAR(191) NULL,
  `documentType` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'MISSING',
  `reviewerId` VARCHAR(191) NULL,
  `reviewNote` VARCHAR(191) NULL,
  `visibility` VARCHAR(191) NOT NULL DEFAULT 'PUBLIC',
  `version` INTEGER NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ApplicationDocument_applicationId_idx` (`applicationId`),
  INDEX `ApplicationDocument_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationStatusLog` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `oldStatus` VARCHAR(191) NULL,
  `newStatus` VARCHAR(191) NOT NULL,
  `safeStatus` VARCHAR(191) NOT NULL,
  `changedBy` VARCHAR(191) NULL,
  `visibility` VARCHAR(191) NOT NULL DEFAULT 'PUBLIC',
  `note` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ApplicationStatusLog_applicationId_idx` (`applicationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationTask` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `taskTitle` VARCHAR(191) NOT NULL,
  `taskDescription` VARCHAR(191) NULL,
  `assignedTo` VARCHAR(191) NULL,
  `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `dueDate` VARCHAR(191) NULL,
  `createdBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ApplicationTask_applicationId_idx` (`applicationId`),
  INDEX `ApplicationTask_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `ApprovalAction_changeId_idx` (`changeId`),
  INDEX `ApprovalAction_action_idx` (`action`),
  INDEX `ApprovalAction_performedBy_idx` (`performedBy`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ApprovalQueueItem_changeId_key` (`changeId`),
  INDEX `ApprovalQueueItem_status_idx` (`status`),
  INDEX `ApprovalQueueItem_queueType_idx` (`queueType`),
  INDEX `ApprovalQueueItem_priority_idx` (`priority`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `AutomationMetric_category_idx` (`category`),
  INDEX `AutomationMetric_date_idx` (`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `B2BContact_organization_idx` (`organization`),
  INDEX `B2BContact_type_idx` (`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `B2bApplication` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `b2bProviderId` VARCHAR(191) NOT NULL,
  `b2bType` VARCHAR(191) NOT NULL,
  `b2bReference` VARCHAR(191) NULL,
  `submissionRoute` VARCHAR(191) NULL,
  `submittedDate` VARCHAR(191) NULL,
  `acknowledgementNumber` VARCHAR(191) NULL,
  `b2bStatus` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
  `b2bCommissionType` VARCHAR(191) NULL,
  `b2bCommissionAmount` DOUBLE NULL,
  `b2bPaymentCondition` VARCHAR(191) NULL,
  `b2bClaimStage` VARCHAR(191) NULL,
  `b2bInternalNote` VARCHAR(191) NULL,
  `lastFollowupAt` DATETIME(3) NULL,
  `nextFollowupAt` DATETIME(3) NULL,
  `createdBy` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `B2bApplication_b2bProviderId_idx` (`b2bProviderId`),
  INDEX `B2bApplication_b2bType_idx` (`b2bType`),
  INDEX `B2bApplication_b2bStatus_idx` (`b2bStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `B2bProvider` (
  `id` VARCHAR(191) NOT NULL,
  `providerCode` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `providerType` VARCHAR(191) NOT NULL,
  `countryCoverage` VARCHAR(191) NULL,
  `universityCoverage` VARCHAR(191) NULL,
  `contactPerson` VARCHAR(191) NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `portalUrl` VARCHAR(191) NULL,
  `loginNote` VARCHAR(191) NULL,
  `agreementFile` VARCHAR(191) NULL,
  `commissionRule` VARCHAR(191) NULL,
  `paymentCondition` VARCHAR(191) NULL,
  `claimStage` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdBy` VARCHAR(191) NULL,
  `approvedBy` VARCHAR(191) NULL,
  `lastReviewedAt` DATETIME(3) NULL,
  `internalNote` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `B2bProvider_providerCode_key` (`providerCode`),
  INDEX `B2bProvider_status_idx` (`status`),
  INDEX `B2bProvider_providerType_idx` (`providerType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `BlogPost_slug_key` (`slug`),
  INDEX `BlogPost_status_idx` (`status`),
  INDEX `BlogPost_category_idx` (`category`),
  INDEX `BlogPost_featured_idx` (`featured`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `Campaign_channel_idx` (`channel`),
  INDEX `Campaign_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Commission_commissionCode_key` (`commissionCode`),
  INDEX `Commission_type_idx` (`type`),
  INDEX `Commission_status_idx` (`status`),
  INDEX `Commission_universitySlug_idx` (`universitySlug`),
  INDEX `Commission_partnerId_idx` (`partnerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `CommunicationDraft_channel_idx` (`channel`),
  INDEX `CommunicationDraft_studentId_idx` (`studentId`),
  INDEX `CommunicationDraft_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `CommunicationTask_assignedTo_idx` (`assignedTo`),
  INDEX `CommunicationTask_studentId_idx` (`studentId`),
  INDEX `CommunicationTask_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `ConnectedAccount_platform_idx` (`platform`),
  INDEX `ConnectedAccount_connectionStatus_idx` (`connectionStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `ConsentRecord_studentId_idx` (`studentId`),
  INDEX `ConsentRecord_leadId_idx` (`leadId`),
  INDEX `ConsentRecord_consentStatus_idx` (`consentStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ConstitutionalRule_ruleCode_key` (`ruleCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CountryPage_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CoursePage_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseShortlist` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `courseSlug` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CourseShortlist_studentId_courseSlug_key` (`studentId`, `courseSlug`),
  INDEX `CourseShortlist_studentId_idx` (`studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CourseView` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `role` VARCHAR(191) NOT NULL,
  `courseSlug` VARCHAR(191) NOT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CourseView_courseSlug_idx` (`courseSlug`),
  INDEX `CourseView_userId_idx` (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `DataChange_runId_idx` (`runId`),
  INDEX `DataChange_sourceId_idx` (`sourceId`),
  INDEX `DataChange_entityType_idx` (`entityType`),
  INDEX `DataChange_universitySlug_idx` (`universitySlug`),
  INDEX `DataChange_courseSlug_idx` (`courseSlug`),
  INDEX `DataChange_changeType_idx` (`changeType`),
  INDEX `DataChange_status_idx` (`status`),
  INDEX `DataChange_impactLevel_idx` (`impactLevel`),
  INDEX `DataChange_detectedAt_idx` (`detectedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DataChangeValue` (
  `id` VARCHAR(191) NOT NULL,
  `changeId` VARCHAR(191) NOT NULL,
  `fieldName` VARCHAR(191) NOT NULL,
  `oldValue` VARCHAR(191) NULL,
  `newValue` VARCHAR(191) NULL,
  `oldValueHash` VARCHAR(191) NULL,
  `newValueHash` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `DataChangeValue_changeId_idx` (`changeId`),
  INDEX `DataChangeValue_fieldName_idx` (`fieldName`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `DataConflict_entityType_idx` (`entityType`),
  INDEX `DataConflict_universitySlug_idx` (`universitySlug`),
  INDEX `DataConflict_courseSlug_idx` (`courseSlug`),
  INDEX `DataConflict_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `DeviceManagement_employeeId_idx` (`employeeId`),
  INDEX `DeviceManagement_status_idx` (`status`),
  INDEX `DeviceManagement_deviceType_idx` (`deviceType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `Document_studentId_idx` (`studentId`),
  INDEX `Document_status_idx` (`status`),
  INDEX `Document_category_idx` (`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `DocumentVersion_documentId_idx` (`documentId`),
  INDEX `DocumentVersion_reviewStatus_idx` (`reviewStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `EmailSync_studentId_idx` (`studentId`),
  INDEX `EmailSync_leadId_idx` (`leadId`),
  INDEX `EmailSync_fromEmail_idx` (`fromEmail`),
  INDEX `EmailSync_threadId_idx` (`threadId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeHR` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `officialEmail` VARCHAR(191) NOT NULL,
  `officialPhone` VARCHAR(191) NOT NULL,
  `branch` VARCHAR(191) NOT NULL DEFAULT 'Dhaka HQ',
  `designation` VARCHAR(191) NOT NULL,
  `department` VARCHAR(191) NOT NULL,
  `joiningDate` VARCHAR(191) NOT NULL,
  `employmentType` VARCHAR(191) NOT NULL DEFAULT 'FULL_TIME',
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `baseSalary` DOUBLE NOT NULL DEFAULT 0,
  `salaryCurrency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
  `performanceScore` DOUBLE NOT NULL DEFAULT 0,
  `targetLeads` INTEGER NOT NULL DEFAULT 0,
  `achievedLeads` INTEGER NOT NULL DEFAULT 0,
  `targetConversion` DOUBLE NOT NULL DEFAULT 0,
  `achievedConversion` DOUBLE NOT NULL DEFAULT 0,
  `managerId` VARCHAR(191) NULL,
  `documents` VARCHAR(191) NOT NULL DEFAULT '[]',
  `warnings` VARCHAR(191) NOT NULL DEFAULT '[]',
  `managerFeedback` VARCHAR(191) NOT NULL DEFAULT '[]',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EmployeeHR_userId_key` (`userId`),
  UNIQUE INDEX `EmployeeHR_employeeId_key` (`employeeId`),
  INDEX `EmployeeHR_userId_idx` (`userId`),
  INDEX `EmployeeHR_branch_idx` (`branch`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `EscalationEvent_counselorId_idx` (`counselorId`),
  INDEX `EscalationEvent_status_idx` (`status`),
  INDEX `EscalationEvent_type_idx` (`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `EventPage_slug_key` (`slug`),
  INDEX `EventPage_status_idx` (`status`),
  INDEX `EventPage_category_idx` (`category`),
  INDEX `EventPage_eventDate_idx` (`eventDate`),
  INDEX `EventPage_isFeatured_idx` (`isFeatured`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ExamPage_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `ExitManagement_employeeId_idx` (`employeeId`),
  INDEX `ExitManagement_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FeatureUsageLog` (
  `id` VARCHAR(191) NOT NULL,
  `ownerType` VARCHAR(191) NOT NULL,
  `ownerId` VARCHAR(191) NOT NULL,
  `featureKey` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `metadata` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `FeatureUsageLog_ownerType_ownerId_featureKey_idx` (`ownerType`, `ownerId`, `featureKey`),
  INDEX `FeatureUsageLog_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `FileEvent_fileId_idx` (`fileId`),
  INDEX `FileEvent_action_idx` (`action`),
  INDEX `FileEvent_performedBy_idx` (`performedBy`),
  INDEX `FileEvent_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `FileMetadata_uuid_key` (`uuid`),
  INDEX `FileMetadata_storagePool_idx` (`storagePool`),
  INDEX `FileMetadata_entityType_idx` (`entityType`),
  INDEX `FileMetadata_entityId_idx` (`entityId`),
  INDEX `FileMetadata_studentId_idx` (`studentId`),
  INDEX `FileMetadata_partnerId_idx` (`partnerId`),
  INDEX `FileMetadata_employeeId_idx` (`employeeId`),
  INDEX `FileMetadata_applicationId_idx` (`applicationId`),
  INDEX `FileMetadata_uploadedBy_idx` (`uploadedBy`),
  INDEX `FileMetadata_status_idx` (`status`),
  INDEX `FileMetadata_visibility_idx` (`visibility`),
  INDEX `FileMetadata_checksumSha256_idx` (`checksumSha256`),
  INDEX `FileMetadata_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `FormSubmission_submissionCode_key` (`submissionCode`),
  INDEX `FormSubmission_source_idx` (`source`),
  INDEX `FormSubmission_crmId_idx` (`crmId`),
  INDEX `FormSubmission_processingStatus_idx` (`processingStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportError` (
  `id` VARCHAR(191) NOT NULL,
  `batchId` VARCHAR(191) NOT NULL,
  `rowNumber` INTEGER NOT NULL,
  `fieldName` VARCHAR(191) NULL,
  `errorMessage` VARCHAR(191) NOT NULL,
  `rawData` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ImportError_batchId_idx` (`batchId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `InterviewAnswer_studentId_idx` (`studentId`),
  INDEX `InterviewAnswer_questionId_idx` (`questionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `InterviewQuestion_universitySlug_idx` (`universitySlug`),
  INDEX `InterviewQuestion_countrySlug_idx` (`countrySlug`),
  INDEX `InterviewQuestion_category_idx` (`category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `InterviewSession_sessionId_key` (`sessionId`),
  INDEX `InterviewSession_studentId_idx` (`studentId`),
  INDEX `InterviewSession_type_idx` (`type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `KeywordResearch_keyword_idx` (`keyword`),
  INDEX `KeywordResearch_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `KnowledgeBaseArticle_slug_key` (`slug`),
  INDEX `KnowledgeBaseArticle_country_idx` (`country`),
  INDEX `KnowledgeBaseArticle_topic_idx` (`topic`),
  INDEX `KnowledgeBaseArticle_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `KnowledgeCategory_slug_key` (`slug`),
  INDEX `KnowledgeCategory_parentId_idx` (`parentId`),
  INDEX `KnowledgeCategory_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `KnowledgeDocument_categoryId_idx` (`categoryId`),
  INDEX `KnowledgeDocument_fileType_idx` (`fileType`),
  INDEX `KnowledgeDocument_visibility_idx` (`visibility`),
  INDEX `KnowledgeDocument_approvalStatus_idx` (`approvalStatus`),
  INDEX `KnowledgeDocument_isFeatured_idx` (`isFeatured`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `KnowledgeNews_category_idx` (`category`),
  INDEX `KnowledgeNews_country_idx` (`country`),
  INDEX `KnowledgeNews_status_idx` (`status`),
  INDEX `KnowledgeNews_isPinned_idx` (`isPinned`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `KnowledgeObject_entityType_entitySlug_idx` (`entityType`, `entitySlug`),
  INDEX `KnowledgeObject_verificationStatus_idx` (`verificationStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `LeadOutreach_leadId_idx` (`leadId`),
  INDEX `LeadOutreach_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `LearningPost_category_idx` (`category`),
  INDEX `LearningPost_visibility_idx` (`visibility`),
  INDEX `LearningPost_isApproved_idx` (`isApproved`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `LeaveRequest_employeeId_idx` (`employeeId`),
  INDEX `LeaveRequest_status_idx` (`status`),
  INDEX `LeaveRequest_leaveType_idx` (`leaveType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `LiveEditOverride_pageRoute_status_idx` (`pageRoute`, `status`),
  INDEX `LiveEditOverride_selector_idx` (`selector`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `LoginSecurity_userId_idx` (`userId`),
  INDEX `LoginSecurity_sessionStatus_idx` (`sessionStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `MarketingUserAccess_userId_key` (`userId`),
  UNIQUE INDEX `MarketingUserAccess_userId_key` (`userId`),
  INDEX `MarketingUserAccess_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `MonitoringJob_jobId_key` (`jobId`),
  INDEX `MonitoringJob_enabled_idx` (`enabled`),
  INDEX `MonitoringJob_nextRunAt_idx` (`nextRunAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `MonitoringLog_runId_idx` (`runId`),
  INDEX `MonitoringLog_jobId_idx` (`jobId`),
  INDEX `MonitoringLog_level_idx` (`level`),
  INDEX `MonitoringLog_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `N8nWorkflow_isActive_idx` (`isActive`),
  INDEX `N8nWorkflow_triggerType_idx` (`triggerType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `NewsArticle_slug_key` (`slug`),
  INDEX `NewsArticle_status_idx` (`status`),
  INDEX `NewsArticle_category_idx` (`category`),
  INDEX `NewsArticle_country_idx` (`country`),
  INDEX `NewsArticle_isPinned_idx` (`isPinned`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `NoticeManagement_employeeId_idx` (`employeeId`),
  INDEX `NoticeManagement_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `NotificationEngine_recipientType_idx` (`recipientType`),
  INDEX `NotificationEngine_recipientId_idx` (`recipientId`),
  INDEX `NotificationEngine_isRead_idx` (`isRead`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Office_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `OfficialDocument_sourceId_idx` (`sourceId`),
  INDEX `OfficialDocument_universitySlug_idx` (`universitySlug`),
  INDEX `OfficialDocument_courseSlug_idx` (`courseSlug`),
  INDEX `OfficialDocument_documentType_idx` (`documentType`),
  INDEX `OfficialDocument_approvalStatus_idx` (`approvalStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `OfficialEmail_status_idx` (`status`),
  INDEX `OfficialEmail_emailType_idx` (`emailType`),
  INDEX `OfficialEmail_recipient_idx` (`recipient`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `OfficialSource` (
  `id` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `universitySlug` VARCHAR(191) NULL,
  `courseSlug` VARCHAR(191) NULL,
  `countrySlug` VARCHAR(191) NULL,
  `sourceUrl` VARCHAR(191) NOT NULL,
  `sourceName` VARCHAR(191) NOT NULL,
  `sourceType` VARCHAR(191) NOT NULL DEFAULT 'UNIVERSITY_OFFICIAL',
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
  `lastVerifiedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `OfficialSource_sourceUrl_key` (`sourceUrl`),
  INDEX `OfficialSource_entityType_idx` (`entityType`),
  INDEX `OfficialSource_universitySlug_idx` (`universitySlug`),
  INDEX `OfficialSource_courseSlug_idx` (`courseSlug`),
  INDEX `OfficialSource_countrySlug_idx` (`countrySlug`),
  INDEX `OfficialSource_status_idx` (`status`),
  INDEX `OfficialSource_priority_idx` (`priority`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Payment_paymentId_key` (`paymentId`),
  INDEX `Payment_studentId_idx` (`studentId`),
  INDEX `Payment_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Payroll_employeeId_monthYear_key` (`employeeId`, `monthYear`),
  INDEX `Payroll_employeeId_idx` (`employeeId`),
  INDEX `Payroll_status_idx` (`status`),
  INDEX `Payroll_monthYear_idx` (`monthYear`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `QuickReply_channel_idx` (`channel`),
  INDEX `QuickReply_category_idx` (`category`),
  INDEX `QuickReply_isActive_idx` (`isActive`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `Referral_referralCode_key` (`referralCode`),
  INDEX `Referral_referrerStudentId_idx` (`referrerStudentId`),
  INDEX `Referral_status_idx` (`status`),
  INDEX `Referral_referralCode_idx` (`referralCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `SeoOpportunity_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `SeoTask_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `SlaIncidentCounter_counselorId_period_key` (`counselorId`, `period`),
  INDEX `SlaIncidentCounter_counselorId_idx` (`counselorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `SlaJustification_counselorId_idx` (`counselorId`),
  INDEX `SlaJustification_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `SlaPolicy_channel_idx` (`channel`),
  INDEX `SlaPolicy_priority_idx` (`priority`),
  INDEX `SlaPolicy_isActive_idx` (`isActive`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `SocialAccountOwnership_platform_idx` (`platform`),
  INDEX `SocialAccountOwnership_ownerEmployeeId_idx` (`ownerEmployeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `SourceSnapshot_sourceId_idx` (`sourceId`),
  INDEX `SourceSnapshot_capturedAt_idx` (`capturedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StoragePool` (
  `id` VARCHAR(191) NOT NULL,
  `poolKey` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `mountPath` VARCHAR(191) NOT NULL,
  `capacityBytes` BIGINT NOT NULL DEFAULT '0',
  `usedBytes` BIGINT NOT NULL DEFAULT '0',
  `fileCount` INTEGER NOT NULL DEFAULT 0,
  `warningThreshold` INTEGER NOT NULL DEFAULT 70,
  `highThreshold` INTEGER NOT NULL DEFAULT 85,
  `criticalThreshold` INTEGER NOT NULL DEFAULT 95,
  `status` VARCHAR(191) NOT NULL DEFAULT 'HEALTHY',
  `lastHealthCheck` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `StoragePool_poolKey_key` (`poolKey`),
  INDEX `StoragePool_poolKey_idx` (`poolKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `StudentNotification_studentId_idx` (`studentId`),
  INDEX `StudentNotification_isRead_idx` (`isRead`),
  INDEX `StudentNotification_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `TrainingMaterial_type_idx` (`type`),
  INDEX `TrainingMaterial_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UniversityAgreement_agreementCode_key` (`agreementCode`),
  INDEX `UniversityAgreement_universitySlug_idx` (`universitySlug`),
  INDEX `UniversityAgreement_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UniversityDigitalTwin_universitySlug_key` (`universitySlug`),
  INDEX `UniversityDigitalTwin_universitySlug_idx` (`universitySlug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `UniversityFaculty_universitySlug_idx` (`universitySlug`),
  INDEX `UniversityFaculty_facultyType_idx` (`facultyType`),
  INDEX `UniversityFaculty_approvalStatus_idx` (`approvalStatus`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `UniversityPage_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `VerificationRun_runId_key` (`runId`),
  INDEX `VerificationRun_jobId_idx` (`jobId`),
  INDEX `VerificationRun_status_idx` (`status`),
  INDEX `VerificationRun_startedAt_idx` (`startedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `VisaReadinessAssessment_studentId_idx` (`studentId`),
  INDEX `VisaReadinessAssessment_riskLevel_idx` (`riskLevel`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentDepartment` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `icon` VARCHAR(191) NOT NULL DEFAULT '',
  `color` VARCHAR(191) NOT NULL DEFAULT '',
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AgentDepartment_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentEngineType` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AgentEngineType_slug_key` (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AgentDefinition_agentCode_key` (`agentCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentRuntime` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'idle',
  `lastHeartbeatAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AgentRuntime_agentId_key` (`agentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AgentTask_taskCode_key` (`taskCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `AgentMemory` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `key` VARCHAR(191) NOT NULL,
  `value` VARCHAR(191) NOT NULL,
  `memoryType` VARCHAR(191) NOT NULL DEFAULT 'context',
  `expiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `AgentMemory_agentId_key_key` (`agentId`, `key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AgentAuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `actorId` VARCHAR(191) NOT NULL DEFAULT 'system',
  `before` VARCHAR(191) NOT NULL DEFAULT '',
  `after` VARCHAR(191) NOT NULL DEFAULT '',
  `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
  `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

CREATE TABLE `ApplicationOffer` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `offerType` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `offerDate` VARCHAR(191) NOT NULL DEFAULT '',
  `expiryDate` VARCHAR(191) NOT NULL DEFAULT '',
  `conditions` VARCHAR(191) NOT NULL DEFAULT '',
  `notes` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ApplicationOffer_applicationId_idx` (`applicationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `ApplicationPaymentInstruction_applicationId_idx` (`applicationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationSerial` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `serialNumber` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ApplicationSerial_applicationId_key` (`applicationId`),
  UNIQUE INDEX `ApplicationSerial_serialNumber_key` (`serialNumber`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApplicationSubmissionReceipt` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `provider` VARCHAR(191) NOT NULL DEFAULT '',
  `receiptNumber` VARCHAR(191) NOT NULL DEFAULT '',
  `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(191) NOT NULL DEFAULT 'SUBMITTED',
  `metadata` VARCHAR(191) NOT NULL DEFAULT '{}',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `ApplicationSubmissionReceipt_applicationId_idx` (`applicationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `CommunicationSlaIncident` (
  `id` VARCHAR(191) NOT NULL,
  `counselorId` VARCHAR(191) NOT NULL,
  `slaEventId` VARCHAR(191) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
  `severity` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
  `reason` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `CommunicationSlaIncident_counselorId_idx` (`counselorId`),
  INDEX `CommunicationSlaIncident_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CommunicationSlaJustification_incidentId_key` (`incidentId`),
  INDEX `CommunicationSlaJustification_counselorId_idx` (`counselorId`),
  INDEX `CommunicationSlaJustification_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CounselorResponseMetric_counselorId_periodMonth_key` (`counselorId`, `periodMonth`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `DocumentChecklist` (
  `id` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `requiredDocuments` VARCHAR(191) NOT NULL DEFAULT '[]',
  `completedDocuments` VARCHAR(191) NOT NULL DEFAULT '[]',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `DocumentChecklist_applicationId_key` (`applicationId`),
  UNIQUE INDEX `DocumentChecklist_applicationId_key` (`applicationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeDocumentVersion` (
  `id` VARCHAR(191) NOT NULL,
  `employeeDocumentId` VARCHAR(191) NOT NULL,
  `version` INTEGER NOT NULL DEFAULT 1,
  `filePath` VARCHAR(191) NOT NULL DEFAULT '',
  `fileName` VARCHAR(191) NOT NULL DEFAULT '',
  `uploadedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `EmployeeDocumentVersion_employeeDocumentId_idx` (`employeeDocumentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeePayroll` (
  `id` VARCHAR(191) NOT NULL,
  `monthYear` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
  `employeeCount` INTEGER NOT NULL DEFAULT 0,
  `preparedBy` VARCHAR(191) NOT NULL,
  `totalGross` DOUBLE NOT NULL DEFAULT 0,
  `totalDeduction` DOUBLE NOT NULL DEFAULT 0,
  `totalNet` DOUBLE NOT NULL DEFAULT 0,
  `approvedBy` VARCHAR(191) NULL,
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeePayrollItem` (
  `id` VARCHAR(191) NOT NULL,
  `payrollId` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `employeeName` VARCHAR(191) NOT NULL DEFAULT '',
  `basicSalary` DOUBLE NOT NULL DEFAULT 0,
  `allowances` DOUBLE NOT NULL DEFAULT 0,
  `tax` DOUBLE NOT NULL DEFAULT 0,
  `netSalary` DOUBLE NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `EmployeePayrollItem_payrollId_idx` (`payrollId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeReassignment` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `fromDepartment` VARCHAR(191) NOT NULL DEFAULT '',
  `toDepartment` VARCHAR(191) NOT NULL DEFAULT '',
  `fromBranch` VARCHAR(191) NOT NULL DEFAULT '',
  `toBranch` VARCHAR(191) NOT NULL DEFAULT '',
  `reason` VARCHAR(191) NOT NULL DEFAULT '',
  `effectiveDate` VARCHAR(191) NOT NULL DEFAULT '',
  `reassignedBy` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeTemporaryPermission` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `permissionKey` VARCHAR(191) NOT NULL,
  `grantedBy` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `EmployeeTemporaryPermission_employeeId_idx` (`employeeId`),
  INDEX `EmployeeTemporaryPermission_expiresAt_idx` (`expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `FinderEligibilityResult` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NULL,
  `assessmentId` VARCHAR(191) NULL,
  `result` VARCHAR(191) NOT NULL DEFAULT '{}',
  `eligibleCourses` VARCHAR(191) NOT NULL DEFAULT '[]',
  `score` DOUBLE NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `FinderEligibilityResult_studentId_idx` (`studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `PhoneCallRecord_callCode_key` (`callCode`),
  INDEX `PhoneCallRecord_studentId_idx` (`studentId`),
  INDEX `PhoneCallRecord_counselorId_idx` (`counselorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StudentEvent` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `eventType` VARCHAR(191) NOT NULL,
  `payload` VARCHAR(191) NOT NULL DEFAULT '{}',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `StudentEvent_studentId_idx` (`studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  INDEX `StudentNextBestAction_studentId_idx` (`studentId`),
  INDEX `StudentNextBestAction_status_idx` (`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
  PRIMARY KEY (`id`),
  UNIQUE INDEX `StudentSession_token_key` (`token`),
  INDEX `StudentSession_studentId_idx` (`studentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AiAction` ADD CONSTRAINT `fk_AiAction_task` FOREIGN KEY (`taskId`) REFERENCES `AiTask` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ApprovalAction` ADD CONSTRAINT `fk_ApprovalAction_change` FOREIGN KEY (`changeId`) REFERENCES `DataChange` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `B2bApplication` ADD CONSTRAINT `fk_B2bApplication_b2bProvider` FOREIGN KEY (`b2bProviderId`) REFERENCES `B2bProvider` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CoursePage` ADD CONSTRAINT `fk_CoursePage_university` FOREIGN KEY (`universitySlug`) REFERENCES `UniversityPage` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `DataChange` ADD CONSTRAINT `fk_DataChange_source` FOREIGN KEY (`sourceId`) REFERENCES `OfficialSource` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `DataChangeValue` ADD CONSTRAINT `fk_DataChangeValue_change` FOREIGN KEY (`changeId`) REFERENCES `DataChange` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Document` ADD CONSTRAINT `fk_Document_student` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `FileEvent` ADD CONSTRAINT `fk_FileEvent_file` FOREIGN KEY (`fileId`) REFERENCES `FileMetadata` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `FileMetadata` ADD CONSTRAINT `fk_FileMetadata_previousVersion` FOREIGN KEY (`previousVersionId`) REFERENCES `FileMetadata` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ImportError` ADD CONSTRAINT `fk_ImportError_batch` FOREIGN KEY (`batchId`) REFERENCES `ImportBatch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `InterviewSession` ADD CONSTRAINT `fk_InterviewSession_student` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `LeadOutreach` ADD CONSTRAINT `fk_LeadOutreach_lead` FOREIGN KEY (`leadId`) REFERENCES `Lead` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `MarketingUserAccess` ADD CONSTRAINT `fk_MarketingUserAccess_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `OfficialDocument` ADD CONSTRAINT `fk_OfficialDocument_source` FOREIGN KEY (`sourceId`) REFERENCES `OfficialSource` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Payment` ADD CONSTRAINT `fk_Payment_student` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Referral` ADD CONSTRAINT `fk_Referral_referrerStudent` FOREIGN KEY (`referrerStudentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `SourceSnapshot` ADD CONSTRAINT `fk_SourceSnapshot_source` FOREIGN KEY (`sourceId`) REFERENCES `OfficialSource` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `StudentNotification` ADD CONSTRAINT `fk_StudentNotification_student` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UniversityPage` ADD CONSTRAINT `fk_UniversityPage_country` FOREIGN KEY (`countrySlug`) REFERENCES `CountryPage` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `VerificationRun` ADD CONSTRAINT `fk_VerificationRun_job` FOREIGN KEY (`jobId`) REFERENCES `MonitoringJob` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `VisaReadinessAssessment` ADD CONSTRAINT `fk_VisaReadinessAssessment_student` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentDefinition` ADD CONSTRAINT `fk_AgentDefinition_department` FOREIGN KEY (`departmentId`) REFERENCES `AgentDepartment` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AgentDefinition` ADD CONSTRAINT `fk_AgentDefinition_engineType` FOREIGN KEY (`engineTypeId`) REFERENCES `AgentEngineType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AgentRuntime` ADD CONSTRAINT `fk_AgentRuntime_agent` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentTask` ADD CONSTRAINT `fk_AgentTask_agent` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentApprovalQueue` ADD CONSTRAINT `fk_AgentApprovalQueue_agent` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentMemory` ADD CONSTRAINT `fk_AgentMemory_agent` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentAuditLog` ADD CONSTRAINT `fk_AgentAuditLog_agent` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AgentSchedule` ADD CONSTRAINT `fk_AgentSchedule_agent` FOREIGN KEY (`agentId`) REFERENCES `AgentDefinition` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CommunicationSlaJustification` ADD CONSTRAINT `fk_CommunicationSlaJustification_incident` FOREIGN KEY (`incidentId`) REFERENCES `CommunicationSlaIncident` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `EmployeePayrollItem` ADD CONSTRAINT `fk_EmployeePayrollItem_payroll` FOREIGN KEY (`payrollId`) REFERENCES `EmployeePayroll` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Compatibility columns added to existing Main tables while preserving all existing values.
ALTER TABLE `Application`
  ADD COLUMN `isB2b` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `b2bType` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `b2bProviderId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `appTeamOfficerId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `safeStatus` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `casI20CoeStatus` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `TimelineEvent`
  MODIFY COLUMN `studentId` VARCHAR(191) NULL,
  ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `meta` VARCHAR(191) NOT NULL DEFAULT '{}',
  ADD COLUMN `userId` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `CommunicationTemplate`
  ADD COLUMN `isLocked` BOOLEAN NOT NULL DEFAULT false;
