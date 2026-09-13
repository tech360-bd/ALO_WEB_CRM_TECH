-- Additive keyword automation and lead linkage fields.
-- No rows are deleted or rewritten.

ALTER TABLE `Student`
  ADD COLUMN `leadId` VARCHAR(191) NULL;

ALTER TABLE `TimelineEvent`
  ADD COLUMN `leadId` VARCHAR(191) NULL;

CREATE INDEX `Student_leadId_idx` ON `Student` (`leadId`);
CREATE INDEX `TimelineEvent_leadId_idx` ON `TimelineEvent` (`leadId`);

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
  INDEX `ContactMatchReview_incomingPhone_idx` (`incomingPhone`),
  INDEX `ContactMatchReview_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `KeywordTrigger` (
  `id` VARCHAR(191) NOT NULL,
  `keyword` VARCHAR(191) NOT NULL,
  `keywordType` VARCHAR(191) NOT NULL DEFAULT 'EXACT',
  `platform` VARCHAR(191) NOT NULL DEFAULT 'ALL',
  `autoReplyText` TEXT NOT NULL,
  `autoDmText` TEXT NULL,
  `autoCreateLead` BOOLEAN NOT NULL DEFAULT true,
  `autoAssignCounselor` BOOLEAN NOT NULL DEFAULT true,
  `sendPortalLink` BOOLEAN NOT NULL DEFAULT true,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `triggerCount` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `KeywordTrigger_keyword_key` (`keyword`),
  INDEX `KeywordTrigger_keyword_idx` (`keyword`),
  INDEX `KeywordTrigger_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
