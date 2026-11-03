-- Non-destructive versioning + archive flags for portal-originated student
-- documents (student portal and B2B partner uploads).
--
-- Why: StudentDocument has carried `version`, `previousVersionId`, `isArchived`
-- and `archivedAt` from the start, but PortalStudentDocument did not. A partner
-- re-uploading a rejected passport therefore created an unrelated row with no
-- link to the file it replaced, so "at least three versions in the same slot"
-- and "preserve previous versions" could not be honoured for that portal.
--
-- Additive and backwards compatible: every new column has a default, so existing
-- rows keep their current behaviour (version 1, not archived). No column, table
-- or row is dropped, renamed or rewritten.

ALTER TABLE `PortalStudentDocument`
  ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `previousVersionId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `archivedAt` DATETIME(3) NULL;

-- The existing rows are the first version of their slot; no backfill is needed.
UPDATE `PortalStudentDocument` SET `version` = 1 WHERE `version` IS NULL OR `version` < 1;

CREATE INDEX `PortalStudentDocument_studentProfileId_category_idx`
  ON `PortalStudentDocument` (`studentProfileId`, `category`);
CREATE INDEX `PortalStudentDocument_isArchived_idx`
  ON `PortalStudentDocument` (`isArchived`);
