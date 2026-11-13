-- PROPOSED MIGRATION — additive only. Do not run without a signed section F approval.
-- Database: <TO BE FILLED: exact host/database name>
-- Environment: <TO BE FILLED: staging | production>
-- Statement: CREATE TABLE + indexes + FK. Existing tables are not altered.
-- Expected rows written to existing tables: 0
-- Expected rows created: 0 (table is created empty)
-- Backup: mysqldump of CrmCourse + CrmOfficialEvidence + CrmAuditLog before apply.
-- Rollback: 9002-limited-publication.down.sql

CREATE TABLE `CrmCourseLimitedPublication` (
  `id`                    VARCHAR(191) NOT NULL,
  `courseId`              VARCHAR(191) NOT NULL,
  `state`                 VARCHAR(191) NOT NULL DEFAULT 'NOT_REQUESTED',
  `approvedByUserId`      VARCHAR(191) NOT NULL DEFAULT '',
  `approvedByRoles`       VARCHAR(191) NOT NULL DEFAULT '[]',
  `approvedAt`            DATETIME(3)  NULL,
  `revokedByUserId`       VARCHAR(191) NOT NULL DEFAULT '',
  `revokedAt`             DATETIME(3)  NULL,
  `reason`                TEXT         NOT NULL,
  `evidenceSnapshotKeys`  TEXT         NOT NULL,
  `createdAt`             DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `CrmCourseLimitedPublication_courseId_key` (`courseId`),
  INDEX `CrmCourseLimitedPublication_state_idx` (`state`),
  INDEX `CrmCourseLimitedPublication_approvedByUserId_idx` (`approvedByUserId`),
  INDEX `CrmCourseLimitedPublication_approvedAt_idx` (`approvedAt`),
  CONSTRAINT `CrmCourseLimitedPublication_courseId_fkey`
    FOREIGN KEY (`courseId`) REFERENCES `CrmCourse` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verification after apply (read-only):
--   SELECT COUNT(*) FROM `CrmCourseLimitedPublication`;                      -- expect 0
--   SELECT COUNT(*) FROM `CrmCourse` WHERE `verificationStatus` = 'VERIFIED'; -- expect unchanged
