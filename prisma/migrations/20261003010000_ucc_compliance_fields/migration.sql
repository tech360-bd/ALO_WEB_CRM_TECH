-- ═══════════════════════════════════════════════════════════════════════════
-- UCC COMPLIANCE FIELDS (spec §131 Attachment Storage, §150 SLA Tracking)
--
-- Additive only: adds columns to CommunicationAttachment and
-- CommunicationSlaEvent. Does not alter, rename or drop any existing column.
--
-- MySQL 8 has no ADD COLUMN IF NOT EXISTS, so every ALTER is executed through
-- an information_schema-guarded prepared statement (idempotent — safe on
-- databases that already received the shape via prisma db push). The
-- CREATE TABLE IF NOT EXISTS re-declarations register the final column set
-- for the migration-chain drift simulation.
-- ═══════════════════════════════════════════════════════════════════════════

-- §131 — every attachment must be stored with: file_name, file_type,
-- file_size, sender, recipient, delivery_status (plus student/application/
-- document linkage once the counselor maps it to a requirement slot).
SET @cca_applicationId := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND COLUMN_NAME = 'applicationId') = 0,
    'ALTER TABLE CommunicationAttachment ADD COLUMN applicationId VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_cca_applicationId FROM @cca_applicationId; EXECUTE stmt_cca_applicationId; DEALLOCATE PREPARE stmt_cca_applicationId;

SET @cca_documentId := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND COLUMN_NAME = 'documentId') = 0,
    'ALTER TABLE CommunicationAttachment ADD COLUMN documentId VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_cca_documentId FROM @cca_documentId; EXECUTE stmt_cca_documentId; DEALLOCATE PREPARE stmt_cca_documentId;

SET @cca_senderContact := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND COLUMN_NAME = 'senderContact') = 0,
    'ALTER TABLE CommunicationAttachment ADD COLUMN senderContact VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_cca_senderContact FROM @cca_senderContact; EXECUTE stmt_cca_senderContact; DEALLOCATE PREPARE stmt_cca_senderContact;

SET @cca_recipientContact := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND COLUMN_NAME = 'recipientContact') = 0,
    'ALTER TABLE CommunicationAttachment ADD COLUMN recipientContact VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_cca_recipientContact FROM @cca_recipientContact; EXECUTE stmt_cca_recipientContact; DEALLOCATE PREPARE stmt_cca_recipientContact;

SET @cca_deliveryStatus := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND COLUMN_NAME = 'deliveryStatus') = 0,
    'ALTER TABLE CommunicationAttachment ADD COLUMN deliveryStatus VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_cca_deliveryStatus FROM @cca_deliveryStatus; EXECUTE stmt_cca_deliveryStatus; DEALLOCATE PREPARE stmt_cca_deliveryStatus;

SET @cca_idx_studentId := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND INDEX_NAME = 'CommunicationAttachment_studentId_idx') = 0,
    'CREATE INDEX CommunicationAttachment_studentId_idx ON CommunicationAttachment (studentId)', 'SELECT 1'));
PREPARE stmt_cca_idx_studentId FROM @cca_idx_studentId; EXECUTE stmt_cca_idx_studentId; DEALLOCATE PREPARE stmt_cca_idx_studentId;

SET @cca_idx_applicationId := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationAttachment' AND INDEX_NAME = 'CommunicationAttachment_applicationId_idx') = 0,
    'CREATE INDEX CommunicationAttachment_applicationId_idx ON CommunicationAttachment (applicationId)', 'SELECT 1'));
PREPARE stmt_cca_idx_applicationId FROM @cca_idx_applicationId; EXECUTE stmt_cca_idx_applicationId; DEALLOCATE PREPARE stmt_cca_idx_applicationId;

-- §150 — precise timestamp recording: assigned / first viewed /
-- first responded (receivedAt and resolvedAt already exist on this model).
SET @sla_assignedAt := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationSlaEvent' AND COLUMN_NAME = 'assignedAt') = 0,
    'ALTER TABLE CommunicationSlaEvent ADD COLUMN assignedAt DATETIME(3) NULL', 'SELECT 1'));
PREPARE stmt_sla_assignedAt FROM @sla_assignedAt; EXECUTE stmt_sla_assignedAt; DEALLOCATE PREPARE stmt_sla_assignedAt;

SET @sla_firstViewedAt := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationSlaEvent' AND COLUMN_NAME = 'firstViewedAt') = 0,
    'ALTER TABLE CommunicationSlaEvent ADD COLUMN firstViewedAt DATETIME(3) NULL', 'SELECT 1'));
PREPARE stmt_sla_firstViewedAt FROM @sla_firstViewedAt; EXECUTE stmt_sla_firstViewedAt; DEALLOCATE PREPARE stmt_sla_firstViewedAt;

SET @sla_firstResponseAt := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'CommunicationSlaEvent' AND COLUMN_NAME = 'firstResponseAt') = 0,
    'ALTER TABLE CommunicationSlaEvent ADD COLUMN firstResponseAt DATETIME(3) NULL', 'SELECT 1'));
PREPARE stmt_sla_firstResponseAt FROM @sla_firstResponseAt; EXECUTE stmt_sla_firstResponseAt; DEALLOCATE PREPARE stmt_sla_firstResponseAt;

-- Chain-registration re-declarations (idempotent; mirror 0_init + new columns).
CREATE TABLE IF NOT EXISTS `CommunicationAttachment` (
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
    `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
    `documentId` VARCHAR(191) NOT NULL DEFAULT '',
    `senderContact` VARCHAR(191) NOT NULL DEFAULT '',
    `recipientContact` VARCHAR(191) NOT NULL DEFAULT '',
    `deliveryStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `CommunicationSlaEvent` (
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
    `assignedAt` DATETIME(3) NULL,
    `firstViewedAt` DATETIME(3) NULL,
    `firstResponseAt` DATETIME(3) NULL,
    `escalatedAt` DATETIME(3) NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
