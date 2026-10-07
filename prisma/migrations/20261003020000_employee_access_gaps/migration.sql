-- ═══════════════════════════════════════════════════════════════════════════
-- EMPLOYEE ACCESS SYSTEM — WHATSAPP CONTACT IDENTITY GAP
-- (spec: WhatsApp contact identity uses phone_normalized + country_code +
--  external_contact_id)
--
-- Additive only: adds columns to WhatsAppContact. Guarded idempotent DDL
-- (MySQL 8 has no native ADD COLUMN IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

SET @wc_countryCode := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'WhatsAppContact' AND COLUMN_NAME = 'countryCode') = 0,
    'ALTER TABLE WhatsAppContact ADD COLUMN countryCode VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_wc_countryCode FROM @wc_countryCode; EXECUTE stmt_wc_countryCode; DEALLOCATE PREPARE stmt_wc_countryCode;

SET @wc_externalContactId := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'WhatsAppContact' AND COLUMN_NAME = 'externalContactId') = 0,
    'ALTER TABLE WhatsAppContact ADD COLUMN externalContactId VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_wc_externalContactId FROM @wc_externalContactId; EXECUTE stmt_wc_externalContactId; DEALLOCATE PREPARE stmt_wc_externalContactId;

SET @wc_idx_cc := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'WhatsAppContact' AND INDEX_NAME = 'WhatsAppContact_countryCode_idx') = 0,
    'CREATE INDEX WhatsAppContact_countryCode_idx ON WhatsAppContact (countryCode)', 'SELECT 1'));
PREPARE stmt_wc_idx_cc FROM @wc_idx_cc; EXECUTE stmt_wc_idx_cc; DEALLOCATE PREPARE stmt_wc_idx_cc;

-- Chain-registration re-declaration (idempotent; 0_init shape + new columns).
CREATE TABLE IF NOT EXISTS `WhatsAppContact` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `normalizedPhone` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL DEFAULT '',
    `externalContactId` VARCHAR(191) NOT NULL DEFAULT '',
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- ── University Payment Instructions: spec bank/verification/provenance fields ──

SET @api_studentId := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'studentId') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN studentId VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_studentId FROM @api_studentId; EXECUTE stmt_api_studentId; DEALLOCATE PREPARE stmt_api_studentId;

SET @api_paymentType := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'paymentType') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN paymentType VARCHAR(191) NOT NULL DEFAULT ''tuition''', 'SELECT 1'));
PREPARE stmt_api_paymentType FROM @api_paymentType; EXECUTE stmt_api_paymentType; DEALLOCATE PREPARE stmt_api_paymentType;

SET @api_deadline := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'deadline') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN deadline VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_deadline FROM @api_deadline; EXECUTE stmt_api_deadline; DEALLOCATE PREPARE stmt_api_deadline;

SET @api_universityName := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'universityName') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN universityName VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_universityName FROM @api_universityName; EXECUTE stmt_api_universityName; DEALLOCATE PREPARE stmt_api_universityName;

SET @api_bankName := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'bankName') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN bankName VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_bankName FROM @api_bankName; EXECUTE stmt_api_bankName; DEALLOCATE PREPARE stmt_api_bankName;

SET @api_accountName := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'accountName') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN accountName VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_accountName FROM @api_accountName; EXECUTE stmt_api_accountName; DEALLOCATE PREPARE stmt_api_accountName;

SET @api_accountNumberMasked := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'accountNumberMasked') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN accountNumberMasked VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_accountNumberMasked FROM @api_accountNumberMasked; EXECUTE stmt_api_accountNumberMasked; DEALLOCATE PREPARE stmt_api_accountNumberMasked;

SET @api_swiftCode := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'swiftCode') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN swiftCode VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_swiftCode FROM @api_swiftCode; EXECUTE stmt_api_swiftCode; DEALLOCATE PREPARE stmt_api_swiftCode;

SET @api_iban := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'iban') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN iban VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_iban FROM @api_iban; EXECUTE stmt_api_iban; DEALLOCATE PREPARE stmt_api_iban;

SET @api_paymentReference := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'paymentReference') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN paymentReference VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_paymentReference FROM @api_paymentReference; EXECUTE stmt_api_paymentReference; DEALLOCATE PREPARE stmt_api_paymentReference;

SET @api_invoiceUrl := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'invoiceUrl') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN invoiceUrl VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_invoiceUrl FROM @api_invoiceUrl; EXECUTE stmt_api_invoiceUrl; DEALLOCATE PREPARE stmt_api_invoiceUrl;

SET @api_paymentLink := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'paymentLink') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN paymentLink VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_paymentLink FROM @api_paymentLink; EXECUTE stmt_api_paymentLink; DEALLOCATE PREPARE stmt_api_paymentLink;

SET @api_paymentMethod := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'paymentMethod') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN paymentMethod VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_paymentMethod FROM @api_paymentMethod; EXECUTE stmt_api_paymentMethod; DEALLOCATE PREPARE stmt_api_paymentMethod;

SET @api_requiredDocuments := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'requiredDocuments') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN requiredDocuments VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_requiredDocuments FROM @api_requiredDocuments; EXECUTE stmt_api_requiredDocuments; DEALLOCATE PREPARE stmt_api_requiredDocuments;

SET @api_preparedBy := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'preparedBy') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN preparedBy VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_preparedBy FROM @api_preparedBy; EXECUTE stmt_api_preparedBy; DEALLOCATE PREPARE stmt_api_preparedBy;

SET @api_verifiedBy := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'verifiedBy') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN verifiedBy VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_api_verifiedBy FROM @api_verifiedBy; EXECUTE stmt_api_verifiedBy; DEALLOCATE PREPARE stmt_api_verifiedBy;

SET @api_verifiedAt := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND COLUMN_NAME = 'verifiedAt') = 0,
    'ALTER TABLE ApplicationPaymentInstruction ADD COLUMN verifiedAt DATETIME(3) NULL', 'SELECT 1'));
PREPARE stmt_api_verifiedAt FROM @api_verifiedAt; EXECUTE stmt_api_verifiedAt; DEALLOCATE PREPARE stmt_api_verifiedAt;

SET @api_idx_status := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ApplicationPaymentInstruction' AND INDEX_NAME = 'ApplicationPaymentInstruction_status_idx') = 0,
    'CREATE INDEX ApplicationPaymentInstruction_status_idx ON ApplicationPaymentInstruction (status)', 'SELECT 1'));
PREPARE stmt_api_idx_status FROM @api_idx_status; EXECUTE stmt_api_idx_status; DEALLOCATE PREPARE stmt_api_idx_status;

-- ── Offer letters: spec provenance fields (table mapped as application_offers) ──

SET @off_universityName := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'universityName') = 0,
    'ALTER TABLE application_offers ADD COLUMN universityName VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_universityName FROM @off_universityName; EXECUTE stmt_off_universityName; DEALLOCATE PREPARE stmt_off_universityName;

SET @off_courseName := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'courseName') = 0,
    'ALTER TABLE application_offers ADD COLUMN courseName VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_courseName FROM @off_courseName; EXECUTE stmt_off_courseName; DEALLOCATE PREPARE stmt_off_courseName;

SET @off_campus := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'campus') = 0,
    'ALTER TABLE application_offers ADD COLUMN campus VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_campus FROM @off_campus; EXECUTE stmt_off_campus; DEALLOCATE PREPARE stmt_off_campus;

SET @off_intake := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'intake') = 0,
    'ALTER TABLE application_offers ADD COLUMN intake VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_intake FROM @off_intake; EXECUTE stmt_off_intake; DEALLOCATE PREPARE stmt_off_intake;

SET @off_receivedSource := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'receivedSource') = 0,
    'ALTER TABLE application_offers ADD COLUMN receivedSource VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_receivedSource FROM @off_receivedSource; EXECUTE stmt_off_receivedSource; DEALLOCATE PREPARE stmt_off_receivedSource;

SET @off_receivedBy := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'receivedBy') = 0,
    'ALTER TABLE application_offers ADD COLUMN receivedBy VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_receivedBy FROM @off_receivedBy; EXECUTE stmt_off_receivedBy; DEALLOCATE PREPARE stmt_off_receivedBy;

SET @off_receivedAt := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'receivedAt') = 0,
    'ALTER TABLE application_offers ADD COLUMN receivedAt DATETIME(3) NULL', 'SELECT 1'));
PREPARE stmt_off_receivedAt FROM @off_receivedAt; EXECUTE stmt_off_receivedAt; DEALLOCATE PREPARE stmt_off_receivedAt;

SET @off_documentVersion := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'documentVersion') = 0,
    'ALTER TABLE application_offers ADD COLUMN documentVersion INTEGER NOT NULL DEFAULT 1', 'SELECT 1'));
PREPARE stmt_off_documentVersion FROM @off_documentVersion; EXECUTE stmt_off_documentVersion; DEALLOCATE PREPARE stmt_off_documentVersion;

SET @off_createdBy := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'application_offers' AND COLUMN_NAME = 'createdBy') = 0,
    'ALTER TABLE application_offers ADD COLUMN createdBy VARCHAR(191) NOT NULL DEFAULT ''''', 'SELECT 1'));
PREPARE stmt_off_createdBy FROM @off_createdBy; EXECUTE stmt_off_createdBy; DEALLOCATE PREPARE stmt_off_createdBy;

CREATE TABLE IF NOT EXISTS `WhatsAppContact` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `normalizedPhone` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL DEFAULT '',
    `externalContactId` VARCHAR(191) NOT NULL DEFAULT '',
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `ApplicationPaymentInstruction` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL DEFAULT '',
    `paymentType` VARCHAR(191) NOT NULL DEFAULT 'tuition',
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `instruction` VARCHAR(191) NOT NULL DEFAULT '',
    `deadline` VARCHAR(191) NOT NULL DEFAULT '',
    `dueDate` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `bankName` VARCHAR(191) NOT NULL DEFAULT '',
    `accountName` VARCHAR(191) NOT NULL DEFAULT '',
    `accountNumberMasked` VARCHAR(191) NOT NULL DEFAULT '',
    `swiftCode` VARCHAR(191) NOT NULL DEFAULT '',
    `iban` VARCHAR(191) NOT NULL DEFAULT '',
    `paymentReference` VARCHAR(191) NOT NULL DEFAULT '',
    `invoiceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `paymentLink` VARCHAR(191) NOT NULL DEFAULT '',
    `paymentMethod` VARCHAR(191) NOT NULL DEFAULT '',
    `requiredDocuments` VARCHAR(191) NOT NULL DEFAULT '',
    `preparedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `verifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS `application_offers` (
    `id` VARCHAR(191) NOT NULL,
    `applicationId` VARCHAR(191) NOT NULL,
    `offerStatus` VARCHAR(191) NOT NULL DEFAULT 'DECISION_PENDING',
    `offerLetterUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `offerConditions` TEXT NOT NULL,
    `conditionDeadline` DATETIME(3) NULL,
    `scholarship` VARCHAR(191) NOT NULL DEFAULT '',
    `scholarshipAmount` DOUBLE NOT NULL DEFAULT 0,
    `depositAmount` DOUBLE NOT NULL DEFAULT 0,
    `depositDeadline` DATETIME(3) NULL,
    `decisionDate` DATETIME(3) NULL,
    `decisionNote` TEXT NOT NULL,
    `studentNotified` BOOLEAN NOT NULL DEFAULT false,
    `partnerNotified` BOOLEAN NOT NULL DEFAULT false,
    `offerType` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `offerDate` VARCHAR(191) NOT NULL DEFAULT '',
    `expiryDate` VARCHAR(191) NOT NULL DEFAULT '',
    `conditions` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `universityName` VARCHAR(191) NOT NULL DEFAULT '',
    `courseName` VARCHAR(191) NOT NULL DEFAULT '',
    `campus` VARCHAR(191) NOT NULL DEFAULT '',
    `intake` VARCHAR(191) NOT NULL DEFAULT '',
    `receivedSource` VARCHAR(191) NOT NULL DEFAULT '',
    `receivedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `receivedAt` DATETIME(3) NULL,
    `documentVersion` INTEGER NOT NULL DEFAULT 1,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
