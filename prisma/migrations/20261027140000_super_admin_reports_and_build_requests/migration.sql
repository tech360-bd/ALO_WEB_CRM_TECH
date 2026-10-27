-- Super Admin Operating Dashboard — additive only (2026-10-27, part 2).
-- Adds the two registry tables required by spec §12 (Global Report Center) and
-- §21 (AI System Builder). No existing table is altered or dropped.

CREATE TABLE IF NOT EXISTS `reports` (
  `id`               VARCHAR(191) NOT NULL,
  `reportCode`       VARCHAR(191) NOT NULL,
  `category`         VARCHAR(191) NOT NULL,
  `title`            VARCHAR(191) NOT NULL,
  `filters`          TEXT NOT NULL,
  `format`           VARCHAR(191) NOT NULL DEFAULT 'csv',
  `status`           VARCHAR(191) NOT NULL DEFAULT 'READY',
  `rowCount`         INTEGER NOT NULL DEFAULT 0,
  `payload`          LONGTEXT NOT NULL,
  `generatedBy`      VARCHAR(191) NOT NULL DEFAULT '',
  `generatedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt`        DATETIME(3) NULL,
  `downloadCount`    INTEGER NOT NULL DEFAULT 0,
  `lastDownloadedAt` DATETIME(3) NULL,
  UNIQUE INDEX `reports_reportCode_key` (`reportCode`),
  INDEX `reports_category_idx` (`category`),
  INDEX `reports_generatedBy_idx` (`generatedBy`),
  INDEX `reports_generatedAt_idx` (`generatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `module_build_requests` (
  `id`                    VARCHAR(191) NOT NULL,
  `requestCode`           VARCHAR(191) NOT NULL,
  `taskType`              VARCHAR(191) NOT NULL,
  `targetModule`          VARCHAR(191) NOT NULL,
  `requirement`           TEXT NOT NULL,
  `priority`              VARCHAR(191) NOT NULL DEFAULT 'normal',
  `riskLevel`             VARCHAR(191) NOT NULL DEFAULT 'medium',
  `approvalRequired`      BOOLEAN NOT NULL DEFAULT true,
  `sandboxFirst`          BOOLEAN NOT NULL DEFAULT true,
  `publishAfterApproval`  BOOLEAN NOT NULL DEFAULT false,
  `status`                VARCHAR(191) NOT NULL DEFAULT 'PLAN_REQUESTED',
  `plan`                  LONGTEXT NOT NULL,
  `proposedFiles`         TEXT NOT NULL,
  `patchProposal`         LONGTEXT NOT NULL,
  `sandboxResult`         LONGTEXT NOT NULL,
  `requestedBy`           VARCHAR(191) NOT NULL DEFAULT '',
  `reviewedBy`            VARCHAR(191) NOT NULL DEFAULT '',
  `reviewedAt`            DATETIME(3) NULL,
  `appliedBy`             VARCHAR(191) NOT NULL DEFAULT '',
  `appliedAt`             DATETIME(3) NULL,
  `decisionNote`          TEXT NOT NULL,
  `createdAt`             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`             DATETIME(3) NOT NULL,
  UNIQUE INDEX `module_build_requests_requestCode_key` (`requestCode`),
  INDEX `module_build_requests_status_idx` (`status`),
  INDEX `module_build_requests_taskType_idx` (`taskType`),
  INDEX `module_build_requests_requestedBy_idx` (`requestedBy`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
