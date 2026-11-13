-- CreateTable
CREATE TABLE `FeatureFlag` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL DEFAULT '',
    `description` TEXT NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `rolloutPercent` INTEGER NOT NULL DEFAULT 0,
    `allowRoles` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `allowUserIds` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `denyUserIds` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `environment` VARCHAR(191) NOT NULL DEFAULT 'all',
    `config` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FeatureFlag_key_key`(`key`),
    INDEX `FeatureFlag_module_idx`(`module`),
    INDEX `FeatureFlag_enabled_idx`(`enabled`),
    INDEX `FeatureFlag_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureFlagAudit` (
    `id` VARCHAR(191) NOT NULL,
    `flagId` VARCHAR(191) NOT NULL,
    `flagKey` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `after` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `actorId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorEmail` VARCHAR(191) NOT NULL DEFAULT '',
    `reason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FeatureFlagAudit_flagId_idx`(`flagId`),
    INDEX `FeatureFlagAudit_flagKey_idx`(`flagKey`),
    INDEX `FeatureFlagAudit_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `targetUrl` VARCHAR(191) NOT NULL,
    `secret` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `events` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `active` BOOLEAN NOT NULL DEFAULT true,
    `environment` VARCHAR(191) NOT NULL DEFAULT 'production',
    `partnerId` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NULL,
    `maxRetries` INTEGER NOT NULL DEFAULT 5,
    `timeoutMs` INTEGER NOT NULL DEFAULT 10000,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WebhookSubscription_active_idx`(`active`),
    INDEX `WebhookSubscription_partnerId_idx`(`partnerId`),
    INDEX `WebhookSubscription_environment_idx`(`environment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WebhookDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastAttemptAt` DATETIME(3) NULL,
    `nextAttemptAt` DATETIME(3) NULL,
    `responseStatus` INTEGER NULL,
    `responseBody` TEXT NULL,
    `errorMessage` TEXT NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WebhookDelivery_status_idx`(`status`),
    INDEX `WebhookDelivery_nextAttemptAt_idx`(`nextAttemptAt`),
    INDEX `WebhookDelivery_eventType_idx`(`eventType`),
    UNIQUE INDEX `WebhookDelivery_subscriptionId_eventId_key`(`subscriptionId`, `eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParentGuardian` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `relationship` VARCHAR(191) NOT NULL DEFAULT 'OTHER',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `whatsapp` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `occupation` VARCHAR(191) NOT NULL DEFAULT '',
    `isPrimaryContact` BOOLEAN NOT NULL DEFAULT false,
    `isFinancialSponsor` BOOLEAN NOT NULL DEFAULT false,
    `communicationPrefs` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `notificationPrefs` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `accessLevel` VARCHAR(191) NOT NULL DEFAULT 'LIMITED',
    `portalEnabled` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `notes` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdBy` VARCHAR(191) NULL,
    `updatedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ParentGuardian_userId_key`(`userId`),
    INDEX `ParentGuardian_studentId_idx`(`studentId`),
    INDEX `ParentGuardian_status_idx`(`status`),
    INDEX `ParentGuardian_portalEnabled_idx`(`portalEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParentGuardianConsent` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `consentType` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT false,
    `grantedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `method` VARCHAR(191) NOT NULL DEFAULT '',
    `evidenceRef` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `version` VARCHAR(191) NOT NULL DEFAULT '1.0',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ParentGuardianConsent_parentId_idx`(`parentId`),
    INDEX `ParentGuardianConsent_studentId_idx`(`studentId`),
    INDEX `ParentGuardianConsent_consentType_idx`(`consentType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ParentGuardianPaymentResponsibility` (
    `id` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `scope` VARCHAR(191) NOT NULL DEFAULT 'ALL',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'USD',
    `paidAmount` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `dueDate` DATETIME(3) NULL,
    `notes` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ParentGuardianPaymentResponsibility_parentId_idx`(`parentId`),
    INDEX `ParentGuardianPaymentResponsibility_studentId_idx`(`studentId`),
    INDEX `ParentGuardianPaymentResponsibility_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityPortalAccount` (
    `id` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `jobTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `role` VARCHAR(191) NOT NULL DEFAULT 'UNIVERSITY_REPRESENTATIVE',
    `status` VARCHAR(191) NOT NULL DEFAULT 'INVITED',
    `permissions` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `lastLoginAt` DATETIME(3) NULL,
    `invitedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UniversityPortalAccount_userId_key`(`userId`),
    UNIQUE INDEX `UniversityPortalAccount_email_key`(`email`),
    INDEX `UniversityPortalAccount_universityId_idx`(`universityId`),
    INDEX `UniversityPortalAccount_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UniversityPortalActivity` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `universityId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UniversityPortalActivity_accountId_idx`(`accountId`),
    INDEX `UniversityPortalActivity_universityId_idx`(`universityId`),
    INDEX `UniversityPortalActivity_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationRiskAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'GREEN',
    `score` INTEGER NOT NULL DEFAULT 0,
    `factors` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `missingItems` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `evaluatedBy` VARCHAR(191) NOT NULL DEFAULT 'SYSTEM',
    `evaluatedById` VARCHAR(191) NULL,
    `metadata` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApplicationRiskAssessment_applicationId_idx`(`applicationId`),
    INDEX `ApplicationRiskAssessment_studentId_idx`(`studentId`),
    INDEX `ApplicationRiskAssessment_riskLevel_idx`(`riskLevel`),
    INDEX `ApplicationRiskAssessment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentSuccessAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL DEFAULT 0,
    `band` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_SUPPORT',
    `components` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `nextActions` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `disclaimer` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `evaluatedBy` VARCHAR(191) NOT NULL DEFAULT 'SYSTEM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StudentSuccessAssessment_studentId_idx`(`studentId`),
    INDEX `StudentSuccessAssessment_band_idx`(`band`),
    INDEX `StudentSuccessAssessment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttentionSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL DEFAULT 'GLOBAL',
    `scopeId` VARCHAR(191) NOT NULL DEFAULT '',
    `generatedFor` VARCHAR(191) NOT NULL DEFAULT '',
    `buckets` LONGTEXT NOT NULL,
    `totals` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttentionSnapshot_createdAt_idx`(`createdAt`),
    INDEX `AttentionSnapshot_scope_scopeId_idx`(`scope`, `scopeId`),
    INDEX `AttentionSnapshot_generatedFor_idx`(`generatedFor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
-- The five indexed columns below are VARCHAR(64), not Prisma's VARCHAR(191) default.
-- The @@unique spans all five: at 191 characters under utf8mb4 each needs 764 index
-- bytes, so the key totals 3820 and exceeds InnoDB's absolute 3072-byte per-index
-- ceiling. A fresh MySQL 8 database rejects it with ERROR 1071 ("Specified key was
-- too long"). That ceiling is not a tunable row-format setting, so the columns are
-- narrowed instead. They hold type labels, relation labels and cuids (~25 chars), so
-- 64 is generous and the unique key becomes 1280 bytes. This table has no foreign
-- keys, so no referenced column needs a matching width.
CREATE TABLE `OpportunityGraphEdge` (
    `id` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(64) NOT NULL,
    `sourceId` VARCHAR(64) NOT NULL,
    `targetType` VARCHAR(64) NOT NULL,
    `targetId` VARCHAR(64) NOT NULL,
    `relation` VARCHAR(64) NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 0,
    `evidence` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `computedBy` VARCHAR(191) NOT NULL DEFAULT 'SYSTEM',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OpportunityGraphEdge_sourceType_sourceId_idx`(`sourceType`, `sourceId`),
    INDEX `OpportunityGraphEdge_targetType_targetId_idx`(`targetType`, `targetId`),
    INDEX `OpportunityGraphEdge_relation_idx`(`relation`),
    UNIQUE INDEX `OpportunityGraphEdge_sourceType_sourceId_targetType_targetId_key`(`sourceType`, `sourceId`, `targetType`, `targetId`, `relation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeatureFlagAudit` ADD CONSTRAINT `FeatureFlagAudit_flagId_fkey` FOREIGN KEY (`flagId`) REFERENCES `FeatureFlag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WebhookDelivery` ADD CONSTRAINT `WebhookDelivery_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `WebhookSubscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParentGuardianConsent` ADD CONSTRAINT `ParentGuardianConsent_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `ParentGuardian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ParentGuardianPaymentResponsibility` ADD CONSTRAINT `ParentGuardianPaymentResponsibility_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `ParentGuardian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UniversityPortalActivity` ADD CONSTRAINT `UniversityPortalActivity_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `UniversityPortalAccount`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

