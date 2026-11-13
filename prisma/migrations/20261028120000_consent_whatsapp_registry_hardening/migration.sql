-- Additive consent and WhatsApp registry hardening.
-- Existing consent rows are retained and deliberately classified as UNKNOWN
-- purpose: historical, channel-agnostic consent is not promotional consent.
-- Existing retry jobs are classified UNKNOWN so they fail closed until reviewed.

ALTER TABLE `ConsentRecord`
  ADD COLUMN `contactId` VARCHAR(191) NULL,
  ADD COLUMN `normalizedPhone` VARCHAR(32) NULL,
  ADD COLUMN `email` VARCHAR(320) NULL,
  ADD COLUMN `purpose` VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN `consentMethod` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `consentText` VARCHAR(512) NOT NULL DEFAULT '',
  ADD COLUMN `policyVersion` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `evidenceReference` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `recordedById` VARCHAR(191) NOT NULL DEFAULT 'system',
  ADD COLUMN `withdrawalReason` VARCHAR(191) NOT NULL DEFAULT '';

CREATE INDEX `ConsentRecord_normalizedPhone_channel_purpose_createdAt_idx`
  ON `ConsentRecord` (`normalizedPhone`, `channel`, `purpose`, `createdAt`);
CREATE INDEX `ConsentRecord_email_channel_purpose_createdAt_idx`
  ON `ConsentRecord` (`email`, `channel`, `purpose`, `createdAt`);
CREATE INDEX `ConsentRecord_contactId_channel_purpose_createdAt_idx`
  ON `ConsentRecord` (`contactId`, `channel`, `purpose`, `createdAt`);

ALTER TABLE `WhatsAppContact`
  ADD COLUMN `email` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `normalizedEmail` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `assignedCounselorId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `branch` VARCHAR(191) NOT NULL DEFAULT '';
CREATE INDEX `WhatsAppContact_normalizedEmail_idx` ON `WhatsAppContact` (`normalizedEmail`);
CREATE INDEX `WhatsAppContact_assignedCounselorId_idx` ON `WhatsAppContact` (`assignedCounselorId`);
CREATE INDEX `WhatsAppContact_branch_idx` ON `WhatsAppContact` (`branch`);

ALTER TABLE `LeadForm`
  ADD COLUMN `canonicalLeadId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `canonicalStudentId` VARCHAR(191) NOT NULL DEFAULT '';
CREATE INDEX `LeadForm_canonicalLeadId_idx` ON `LeadForm` (`canonicalLeadId`);
CREATE INDEX `LeadForm_canonicalStudentId_idx` ON `LeadForm` (`canonicalStudentId`);

ALTER TABLE `ContactMatchReview`
  ADD COLUMN `conversationId` VARCHAR(191) NOT NULL DEFAULT '';
CREATE INDEX `ContactMatchReview_conversationId_idx` ON `ContactMatchReview` (`conversationId`);

ALTER TABLE `WhatsAppOfficialNumber`
  ADD COLUMN `lastConnectionCheckAt` DATETIME(3) NULL,
  ADD COLUMN `lastConnectionCheckError` VARCHAR(191) NOT NULL DEFAULT '';
CREATE INDEX `WhatsAppOfficialNumber_lastConnectionCheckAt_idx`
  ON `WhatsAppOfficialNumber` (`lastConnectionCheckAt`);

ALTER TABLE `WhatsAppMessageArchive`
  ADD COLUMN `campaignId` VARCHAR(191) NOT NULL DEFAULT '';
CREATE INDEX `WhatsAppMessageArchive_campaignId_receiverPhone_timestamp_idx`
  ON `WhatsAppMessageArchive` (`campaignId`, `receiverPhone`, `timestamp`);

ALTER TABLE `WhatsAppFollowUpTemplate`
  ADD COLUMN `metaLanguage` VARCHAR(191) NOT NULL DEFAULT 'en_US',
  ADD COLUMN `metaTemplateStatus` VARCHAR(191) NOT NULL DEFAULT 'unknown',
  ADD COLUMN `metaTemplateCheckedAt` DATETIME(3) NULL,
  ADD COLUMN `metaTemplateCheckError` VARCHAR(191) NOT NULL DEFAULT '';
ALTER TABLE `WhatsAppFollowUpTemplate`
  ALTER COLUMN `activeStatus` SET DEFAULT 'inactive';

ALTER TABLE `WhatsAppFollowUpSchedule`
  ADD COLUMN `contactId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `conversationId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `senderNumberId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
  ADD COLUMN `lastConsentCheckAt` DATETIME(3) NULL;
CREATE UNIQUE INDEX `WhatsAppFollowUpSchedule_idempotencyKey_key`
  ON `WhatsAppFollowUpSchedule` (`idempotencyKey`);

ALTER TABLE `LeadOutreach`
  ADD COLUMN `purpose` VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN';

ALTER TABLE `BroadcastRecipient`
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `BroadcastRecipient_idempotencyKey_key`
  ON `BroadcastRecipient` (`idempotencyKey`);

ALTER TABLE `WhatsAppRetryQueue`
  ADD COLUMN `purpose` VARCHAR(64) NOT NULL DEFAULT 'unknown',
  ADD COLUMN `campaignId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `approvalId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `conversationId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `actorId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `senderNumber` VARCHAR(32) NOT NULL DEFAULT '';
CREATE INDEX `WhatsAppRetryQueue_purpose_status_idx`
  ON `WhatsAppRetryQueue` (`purpose`, `status`);

ALTER TABLE `MarketingLead`
  ADD COLUMN `canonicalLeadId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `canonicalStudentId` VARCHAR(191) NOT NULL DEFAULT '';
CREATE INDEX `MarketingLead_canonicalLeadId_idx` ON `MarketingLead` (`canonicalLeadId`);
CREATE INDEX `MarketingLead_canonicalStudentId_idx` ON `MarketingLead` (`canonicalStudentId`);

ALTER TABLE `WebhookEvent`
  ADD COLUMN `processingAt` DATETIME(3) NULL,
  ADD COLUMN `processingToken` VARCHAR(191) NULL;
CREATE INDEX `WebhookEvent_processed_processingAt_idx`
  ON `WebhookEvent` (`processed`, `processingAt`);
