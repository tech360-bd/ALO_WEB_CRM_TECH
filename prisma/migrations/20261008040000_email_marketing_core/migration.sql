-- Email marketing core: campaigns, DB-backed outbox, suppression list, event log.
-- Handwritten to match the Prisma MySQL output in prisma/schema.prisma (models
-- EmailCampaign, EmailOutboxItem, EmailSuppression, EmailEvent).
-- NOT RUN locally: no MySQL and no working Prisma schema engine in the sandbox.
-- Validate in CI with `prisma migrate deploy` against a disposable database.

CREATE TABLE IF NOT EXISTS `EmailCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `html` LONGTEXT NOT NULL,
    `text` LONGTEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `testMode` BOOLEAN NOT NULL DEFAULT false,
    `broadcastId` VARCHAR(64) NULL,
    `consentAttestedBy` VARCHAR(64) NULL,
    `consentAttestedAt` DATETIME(3) NULL,
    `consentBasis` VARCHAR(200) NULL,
    `recipientCount` INTEGER NOT NULL DEFAULT 0,
    `queuedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `lastErrorCode` VARCHAR(64) NULL,
    `createdById` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailCampaign_broadcastId_key`(`broadcastId`),
    INDEX `EmailCampaign_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EmailOutboxItem` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `recipientVars` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lockedAt` DATETIME(3) NULL,
    `lockToken` VARCHAR(64) NULL,
    `lastErrorCode` VARCHAR(64) NULL,
    `smtpMessageId` VARCHAR(255) NULL,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `EmailOutboxItem_campaignId_email_key`(`campaignId`, `email`),
    INDEX `EmailOutboxItem_status_nextAttemptAt_idx`(`status`, `nextAttemptAt`),
    INDEX `EmailOutboxItem_campaignId_status_idx`(`campaignId`, `status`),
    INDEX `EmailOutboxItem_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EmailSuppression` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `reason` VARCHAR(32) NOT NULL,
    `source` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EmailSuppression_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `EmailEvent` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NULL,
    `email` VARCHAR(254) NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `code` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailEvent_campaignId_type_createdAt_idx`(`campaignId`, `type`, `createdAt`),
    INDEX `EmailEvent_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `EmailOutboxItem` ADD CONSTRAINT `EmailOutboxItem_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `EmailCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `EmailEvent` ADD CONSTRAINT `EmailEvent_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `EmailCampaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
