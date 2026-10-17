-- Monitoring hardening: retain request provenance, bounded snapshots, and
-- approval evidence; make source/change ingestion idempotent. Existing values
-- and publication/approval states are preserved.

ALTER TABLE `official_sources`
  MODIFY COLUMN `sourceUrl` TEXT NOT NULL,
  MODIFY COLUMN `lastError` TEXT NULL,
  ADD COLUMN `sourceFingerprint` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `official_sources_sourceFingerprint_key`
  ON `official_sources`(`sourceFingerprint`);

ALTER TABLE `DataChange`
  MODIFY COLUMN `sourceUrl` TEXT NOT NULL,
  MODIFY COLUMN `oldValue` TEXT NULL,
  MODIFY COLUMN `newValue` TEXT NULL,
  MODIFY COLUMN `sourcePageTitle` TEXT NULL,
  MODIFY COLUMN `aiExplanation` TEXT NULL,
  MODIFY COLUMN `reviewNotes` TEXT NULL,
  ADD COLUMN `dedupeKey` VARCHAR(191) NULL,
  ADD COLUMN `snapshotId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `DataChange_dedupeKey_key`
  ON `DataChange`(`dedupeKey`);

CREATE INDEX `DataChange_snapshotId_idx`
  ON `DataChange`(`snapshotId`);

ALTER TABLE `DataChange`
  ADD CONSTRAINT `DataChange_snapshotId_fkey`
  FOREIGN KEY (`snapshotId`) REFERENCES `SourceSnapshot`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `DataChangeValue`
  MODIFY COLUMN `oldValue` TEXT NULL,
  MODIFY COLUMN `newValue` TEXT NULL,
  ADD COLUMN `evidenceQuote` TEXT NULL,
  ADD COLUMN `sourceUrl` TEXT NULL;

ALTER TABLE `SourceSnapshot`
  MODIFY COLUMN `title` TEXT NULL,
  MODIFY COLUMN `textExtract` LONGTEXT NOT NULL,
  MODIFY COLUMN `aiSummary` TEXT NULL,
  MODIFY COLUMN `aiKeyFacts` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
  MODIFY COLUMN `fetchError` TEXT NULL,
  ADD COLUMN `finalUrl` TEXT NULL,
  ADD COLUMN `sourcePublishedAt` DATETIME(3) NULL;

ALTER TABLE `VerificationRun`
  MODIFY COLUMN `errorMessage` TEXT NULL,
  MODIFY COLUMN `aiReportSummary` TEXT NULL,
  ADD COLUMN `sourcesDeferred` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `MonitoringLog`
  MODIFY COLUMN `message` TEXT NOT NULL,
  MODIFY COLUMN `sourceUrl` TEXT NULL,
  MODIFY COLUMN `metadata` LONGTEXT NULL;

ALTER TABLE `CrmCourse`
  ADD COLUMN `tuitionPeriod` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `ApprovalAction`
  MODIFY COLUMN `notes` TEXT NULL,
  MODIFY COLUMN `editedOldValue` TEXT NULL,
  MODIFY COLUMN `editedNewValue` TEXT NULL,
  MODIFY COLUMN `metadata` LONGTEXT NULL;

ALTER TABLE `DataConflict`
  MODIFY COLUMN `resolutionNotes` TEXT NULL;

ALTER TABLE `OfficialDocument`
  MODIFY COLUMN `title` TEXT NOT NULL,
  MODIFY COLUMN `sourceUrl` TEXT NOT NULL,
  MODIFY COLUMN `storageLocation` TEXT NULL;
