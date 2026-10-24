-- Preliminary interview assessment + append-only human review (spec §41).
--
-- Additive: two new tables. No existing table is altered, and the review table
-- is insert-only by design — correcting a decision appends a superseding row
-- rather than overwriting the original.
CREATE TABLE `InterviewAssessment` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
  `engine` VARCHAR(191) NOT NULL DEFAULT 'DETERMINISTIC_RUBRIC',
  `engineVersion` VARCHAR(191) NOT NULL DEFAULT '1.0.0',
  `verdict` VARCHAR(191) NOT NULL,
  `confidence` VARCHAR(191) NOT NULL DEFAULT 'LOW',
  `overallScore` INTEGER NOT NULL DEFAULT 0,
  `dimensions` LONGTEXT NOT NULL,
  `strengths` LONGTEXT NOT NULL,
  `improvements` LONGTEXT NOT NULL,
  `evidence` LONGTEXT NOT NULL,
  `limitations` LONGTEXT NOT NULL,
  `answerCount` INTEGER NOT NULL DEFAULT 0,
  `averageWords` INTEGER NOT NULL DEFAULT 0,
  `reviewStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `finalVerdict` VARCHAR(191) NULL,
  `studentMessage` TEXT NOT NULL,
  `reviewedById` VARCHAR(191) NULL,
  `reviewedByName` VARCHAR(191) NOT NULL DEFAULT '',
  `reviewedAt` DATETIME(3) NULL,
  `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `InterviewAssessment_sessionId_key` (`sessionId`),
  INDEX `InterviewAssessment_studentId_idx` (`studentId`),
  INDEX `InterviewAssessment_reviewStatus_idx` (`reviewStatus`),
  INDEX `InterviewAssessment_reviewedAt_idx` (`reviewedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `InterviewReviewDecision` (
  `id` VARCHAR(191) NOT NULL,
  `assessmentId` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `aiVerdict` VARCHAR(191) NOT NULL,
  `finalVerdict` VARCHAR(191) NOT NULL,
  `overridden` BOOLEAN NOT NULL DEFAULT false,
  `direction` VARCHAR(191) NOT NULL DEFAULT 'AGREED',
  `rationale` TEXT NOT NULL,
  `studentMessage` TEXT NOT NULL,
  `internalNotes` TEXT NOT NULL,
  `reviewerId` VARCHAR(191) NOT NULL,
  `reviewerName` VARCHAR(191) NOT NULL DEFAULT '',
  `reviewerRole` VARCHAR(191) NOT NULL DEFAULT '',
  `supersedesId` VARCHAR(191) NOT NULL DEFAULT '',
  `decidedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `InterviewReviewDecision_assessmentId_idx` (`assessmentId`),
  INDEX `InterviewReviewDecision_studentId_idx` (`studentId`),
  INDEX `InterviewReviewDecision_decidedAt_idx` (`decidedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
