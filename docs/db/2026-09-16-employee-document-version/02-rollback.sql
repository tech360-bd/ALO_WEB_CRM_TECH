-- ============================================================================
-- ROLLBACK — EmployeeDocumentVersion reconciliation (best-effort reverse)
--
-- PRIMARY ROLLBACK = restore the verified pre-change backup:
--   mysql <DB> < /path/to/backup-before-edv-reconcile.sql
-- That is the only rollback guaranteed to be exact. The statements below
-- reverse ONLY what 01-migration.sql adds, and are safe to run against the
-- post-migration shape. They DROP columns/indexes the migration created —
-- which destroys any data written into those columns since the migration.
-- Use only for an immediate revert (same maintenance window), never later.
--
-- Decide which section applies using the precheck output you captured:
--   * Started from shape A (had documentId/versionNumber, NO
--     employeeDocumentId): run SECTION 1 only.
--   * Started from shape B (had employeeDocumentId NOT NULL, NO documentId):
--     run SECTION 2 only.
--   * Unknown / union already: DO NOT guess — restore from backup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1 — revert to shape A (repair-backup / deploy-build shape)
-- ----------------------------------------------------------------------------
-- Drop indexes added by the migration (ignore errors for ones that existed).
ALTER TABLE `EmployeeDocumentVersion` DROP INDEX `EmployeeDocumentVersion_agreementId_idx`;
ALTER TABLE `EmployeeDocumentVersion` DROP INDEX `EmployeeDocumentVersion_status_idx`;
ALTER TABLE `EmployeeDocumentVersion` DROP INDEX `EmployeeDocumentVersion_employeeDocumentId_idx`;
-- documentId index existed in shape A already — keep it.

-- Restore shape-A nullability before dropping columns that reference it: none.
-- Drop columns that shape A did not have:
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `employeeDocumentId`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `agreementId`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `version`;
-- (Shape A used `versionNumber`; if the procedure created `version` and
--  copied values, the original `versionNumber` column was never touched.)

-- Restore documentId to NOT NULL without default (exact shape A):
ALTER TABLE `EmployeeDocumentVersion` MODIFY COLUMN `documentId` VARCHAR(191) NOT NULL;
-- CAUTION: fails if any row has documentId = '' (rows written by the
-- agreement route after the fix). If it fails, STOP — restore from backup.

-- ----------------------------------------------------------------------------
-- SECTION 2 — revert to shape B (migration 20260913050000 shape)
-- ----------------------------------------------------------------------------
-- Backfill-restore: shape B stored the FK in employeeDocumentId NOT NULL.
-- Rows created via the legacy alias only (documentId set, FK NULL) have no
-- shape-B representation. If precheck showed such rows exist, DO NOT run
-- this section — restore from backup instead.
UPDATE `EmployeeDocumentVersion`
   SET `employeeDocumentId` = `documentId`
 WHERE `employeeDocumentId` IS NULL AND `documentId` <> '';

ALTER TABLE `EmployeeDocumentVersion` DROP INDEX `EmployeeDocumentVersion_documentId_idx`;
ALTER TABLE `EmployeeDocumentVersion` DROP INDEX `EmployeeDocumentVersion_agreementId_idx`;
ALTER TABLE `EmployeeDocumentVersion` DROP INDEX `EmployeeDocumentVersion_status_idx`;

ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `documentId`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `agreementId`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `fileHash`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `reviewerId`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `reviewNote`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `effectiveDate`;
ALTER TABLE `EmployeeDocumentVersion` DROP COLUMN `supersededDate`;

ALTER TABLE `EmployeeDocumentVersion` MODIFY COLUMN `employeeDocumentId` VARCHAR(191) NOT NULL;
ALTER TABLE `EmployeeDocumentVersion` MODIFY COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE';
-- CAUTION: MODIFY to NOT NULL fails if any NULL remains — if it does, STOP
-- and restore from backup.

-- ----------------------------------------------------------------------------
-- If the OPTIONAL FK constraints were added, drop them FIRST, before either
-- section (ignore "does not exist" errors):
-- ----------------------------------------------------------------------------
-- ALTER TABLE `EmployeeDocumentVersion` DROP FOREIGN KEY `EmployeeDocumentVersion_employeeDocumentId_fkey`;
-- ALTER TABLE `EmployeeDocumentVersion` DROP FOREIGN KEY `EmployeeDocumentVersion_agreementId_fkey`;
