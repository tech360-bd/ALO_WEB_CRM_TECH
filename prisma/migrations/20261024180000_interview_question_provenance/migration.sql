-- Interview research provenance (spec §31/§53/§54).
--
-- Additive only: every column is nullable or defaulted, no row is rewritten and
-- nothing is deleted. Existing questions stay in place and are treated as
-- UNVERIFIED by the research engine until a source and verification date are
-- recorded — they are never silently presented as current evidence.
ALTER TABLE `InterviewQuestion`
  ADD COLUMN `theme` VARCHAR(191) NULL,
  ADD COLUMN `source` VARCHAR(191) NULL,
  ADD COLUMN `sourceType` VARCHAR(191) NULL,
  ADD COLUMN `sourceUrl` VARCHAR(500) NULL,
  ADD COLUMN `lastVerifiedAt` DATETIME(3) NULL,
  ADD COLUMN `confidence` VARCHAR(191) NULL,
  ADD COLUMN `frequency` INTEGER NOT NULL DEFAULT 0;

CREATE INDEX `InterviewQuestion_lastVerifiedAt_idx` ON `InterviewQuestion` (`lastVerifiedAt`);
