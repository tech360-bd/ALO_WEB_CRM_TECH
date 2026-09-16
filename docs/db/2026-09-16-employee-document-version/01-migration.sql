-- ============================================================================
-- PROPOSED — EmployeeDocumentVersion schema reconciliation (MySQL 8)
-- Status: PROPOSED ONLY. DO NOT RUN until:
--   1. 00-precheck.sql output captured and reviewed (shape A / B / union),
--   2. a VERIFIED, restorable backup of the production DB exists
--      (mysqldump --single-transaction; test-restore into a scratch DB),
--   3. the change owner approved this script,
--   4. 02-rollback.sql is understood (restore-from-backup is the primary
--      rollback; the script there is best-effort reverse only).
--
-- The script is idempotent: every column/index addition is guarded by an
-- INFORMATION_SCHEMA check inside a stored procedure, so re-running is safe
-- and running against either known starting shape converges to the same
-- target (the union shape expected by prisma/schema.prisma).
--
-- Target shape (from prisma/schema.prisma model EmployeeDocumentVersion):
--   id VARCHAR(191) PK
--   documentId        VARCHAR(191) NOT NULL DEFAULT ''   -- legacy alias
--   agreementId       VARCHAR(191) NULL                  -- agreement history link
--   version           INT NOT NULL DEFAULT 1
--   filePath          VARCHAR(191) NOT NULL DEFAULT ''
--   fileName          VARCHAR(191) NOT NULL DEFAULT ''
--   fileHash          VARCHAR(191) NOT NULL DEFAULT ''
--   uploadedBy        VARCHAR(191) NOT NULL DEFAULT ''
--   status            VARCHAR(191) NOT NULL DEFAULT 'current'
--   reviewerId        VARCHAR(191) NOT NULL DEFAULT ''
--   reviewNote        VARCHAR(191) NOT NULL DEFAULT ''
--   effectiveDate     VARCHAR(191) NOT NULL DEFAULT ''
--   supersededDate    VARCHAR(191) NOT NULL DEFAULT ''
--   createdAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
--   employeeDocumentId VARCHAR(191) NULL                 -- canonical FK
--   indexes: documentId, agreementId, status, employeeDocumentId
--
-- NO DATA IS DELETED. NO COLUMN IS DROPPED. NOT NULL constraints are only
-- ever RELAXED (documentId -> DEFAULT '', employeeDocumentId -> NULL), which
-- cannot fail on existing rows.
-- ============================================================================

DROP PROCEDURE IF EXISTS `alo_reconcile_employee_document_version`;

DELIMITER $$

CREATE PROCEDURE `alo_reconcile_employee_document_version`()
BEGIN
  DECLARE v_db VARCHAR(64);
  SET v_db = DATABASE();

  -- ------------------------------------------------------------------
  -- Columns (add only when missing)
  -- ------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'documentId') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `documentId` VARCHAR(191) NOT NULL DEFAULT '' AFTER `id`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'agreementId') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `agreementId` VARCHAR(191) NULL AFTER `documentId`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'version') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `agreementId`;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'filePath') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `filePath` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'fileName') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `fileName` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'fileHash') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `fileHash` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'uploadedBy') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `uploadedBy` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'status') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'current';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'reviewerId') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `reviewerId` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'reviewNote') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `reviewNote` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'effectiveDate') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `effectiveDate` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'supersededDate') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `supersededDate` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'createdAt') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND COLUMN_NAME = 'employeeDocumentId') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD COLUMN `employeeDocumentId` VARCHAR(191) NULL;
  END IF;

  -- ------------------------------------------------------------------
  -- Nullability / defaults — only ever RELAXED, never tightened.
  -- (Shape A: documentId NOT NULL with no default -> add DEFAULT ''.)
  -- (Shape B: employeeDocumentId NOT NULL -> relax to NULL so
  --  agreement-only rows are valid.)
  -- ------------------------------------------------------------------
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
               AND COLUMN_NAME = 'documentId'
               AND (IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL)) THEN
    ALTER TABLE `EmployeeDocumentVersion`
      MODIFY COLUMN `documentId` VARCHAR(191) NOT NULL DEFAULT '';
  END IF;

  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
               AND COLUMN_NAME = 'employeeDocumentId' AND IS_NULLABLE = 'NO') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      MODIFY COLUMN `employeeDocumentId` VARCHAR(191) NULL;
  END IF;

  -- ------------------------------------------------------------------
  -- Data reconciliation (no deletes)
  -- ------------------------------------------------------------------
  -- Shape A carried `versionNumber`; copy it into `version` where the new
  -- column still holds its default. No-op if versionNumber never existed.
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
               AND COLUMN_NAME = 'versionNumber') THEN
    UPDATE `EmployeeDocumentVersion`
       SET `version` = `versionNumber`
     WHERE `version` = 1 AND `versionNumber` IS NOT NULL AND `versionNumber` <> 1;
  END IF;

  -- Backfill canonical FK from the legacy alias, ONLY where the alias
  -- actually references an EmployeeDocument row. Agreement-alias rows and
  -- dangling rows keep employeeDocumentId NULL (visible via precheck 4b/5).
  UPDATE `EmployeeDocumentVersion` v
    JOIN `EmployeeDocument` d ON d.`id` = v.`documentId`
     SET v.`employeeDocumentId` = d.`id`
   WHERE v.`employeeDocumentId` IS NULL
     AND v.`documentId` <> '';

  -- ------------------------------------------------------------------
  -- Indexes (add only when missing)
  -- ------------------------------------------------------------------
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND INDEX_NAME = 'EmployeeDocumentVersion_documentId_idx') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD INDEX `EmployeeDocumentVersion_documentId_idx` (`documentId`);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND INDEX_NAME = 'EmployeeDocumentVersion_agreementId_idx') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD INDEX `EmployeeDocumentVersion_agreementId_idx` (`agreementId`);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND INDEX_NAME = 'EmployeeDocumentVersion_status_idx') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD INDEX `EmployeeDocumentVersion_status_idx` (`status`);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
                 WHERE TABLE_SCHEMA = v_db AND TABLE_NAME = 'EmployeeDocumentVersion'
                   AND INDEX_NAME = 'EmployeeDocumentVersion_employeeDocumentId_idx') THEN
    ALTER TABLE `EmployeeDocumentVersion`
      ADD INDEX `EmployeeDocumentVersion_employeeDocumentId_idx` (`employeeDocumentId`);
  END IF;
END$$

DELIMITER ;

CALL `alo_reconcile_employee_document_version`();
DROP PROCEDURE `alo_reconcile_employee_document_version`;

-- ============================================================================
-- OPTIONAL (run separately, only if precheck queries 4b/5 returned ZERO
-- dangling rows for the respective column). Prisma works without DB-level
-- FKs; `prisma db push` would add them later anyway. Skipped by default
-- because agreementId historically stores values that may not (yet) match
-- EmployeeAgreement rows, and an FK on dangling data fails the ALTER.
-- ============================================================================
-- ALTER TABLE `EmployeeDocumentVersion`
--   ADD CONSTRAINT `EmployeeDocumentVersion_employeeDocumentId_fkey`
--   FOREIGN KEY (`employeeDocumentId`) REFERENCES `EmployeeDocument`(`id`)
--   ON DELETE SET NULL ON UPDATE CASCADE;
--
-- ALTER TABLE `EmployeeDocumentVersion`
--   ADD CONSTRAINT `EmployeeDocumentVersion_agreementId_fkey`
--   FOREIGN KEY (`agreementId`) REFERENCES `EmployeeAgreement`(`id`)
--   ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- POST-RUN VERIFICATION (read-only)
-- ============================================================================
-- Expected: all 15 target columns present; documentId NOT NULL DEFAULT '';
-- employeeDocumentId NULL; 4 new indexes; backfilled count == precheck 4a.
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'EmployeeDocumentVersion'
ORDER BY ORDINAL_POSITION;

SELECT INDEX_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'EmployeeDocumentVersion'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

SELECT COUNT(*) AS total_rows,
       SUM(employeeDocumentId IS NOT NULL) AS fk_populated,
       SUM(agreementId IS NOT NULL)        AS agreement_linked
FROM `EmployeeDocumentVersion`;
