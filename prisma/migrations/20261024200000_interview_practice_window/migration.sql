-- 72-hour interview practice window (spec §38).
--
-- Additive: a new table only. No existing table is altered or dropped, and no
-- row is deleted. Expiry stops new practice sessions; recorded sessions and
-- assessments stay exactly where they are.
CREATE TABLE `InterviewPracticeWindow` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL DEFAULT '',
  `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NOT NULL,
  `extendedUntil` DATETIME(3) NULL,
  `extensionCount` INTEGER NOT NULL DEFAULT 0,
  `extendedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `extensionReason` TEXT NOT NULL,
  `packGeneratedAt` DATETIME(3) NULL,
  `closedAt` DATETIME(3) NULL,
  `closedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `InterviewPracticeWindow_studentId_applicationId_key` (`studentId`, `applicationId`),
  INDEX `InterviewPracticeWindow_studentId_idx` (`studentId`),
  INDEX `InterviewPracticeWindow_expiresAt_idx` (`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
