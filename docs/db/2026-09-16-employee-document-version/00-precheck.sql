-- ============================================================================
-- PRECHECK (read-only) — EmployeeDocumentVersion drift assessment
-- Run against the PRODUCTION database BEFORE any change. Save the full output
-- and attach it to the change request. Nothing here writes data.
--
-- Background: two known starting shapes exist for `EmployeeDocumentVersion`:
--   A) deploy-build/repair-backup shape (2026-08-19):
--      id, documentId NOT NULL, versionNumber, filePath, fileName, fileHash,
--      status DEFAULT 'pending', uploadedBy, reviewerId, reviewNote,
--      effectiveDate, supersededDate, createdAt   (NO employeeDocumentId)
--   B) migration 20260913050000_benchmark_capabilities shape:
--      id, employeeDocumentId NOT NULL, version, filePath, fileName,
--      uploadedBy, status DEFAULT 'ACTIVE', createdAt   (NO documentId)
-- The Prisma schema in this branch expects the UNION of both, with
-- `documentId NOT NULL DEFAULT ''` (legacy alias) and
-- `employeeDocumentId NULL` (canonical FK).
-- ============================================================================

-- 1) Does the table exist at all?
SELECT TABLE_NAME, TABLE_ROWS, ENGINE, TABLE_COLLATION
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('EmployeeDocumentVersion', 'EmployeeDocument', 'EmployeeAgreement');

-- 2) Exact current columns of EmployeeDocumentVersion (decides shape A vs B).
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'EmployeeDocumentVersion'
ORDER BY ORDINAL_POSITION;

-- 3) Existing indexes (so we only add what is missing).
SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'EmployeeDocumentVersion'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 4) Row counts + how many rows would be affected by the backfill.
SELECT COUNT(*) AS total_rows FROM `EmployeeDocumentVersion`;

-- 4a) Rows whose documentId already matches an EmployeeDocument (safe backfill).
SELECT COUNT(*) AS backfillable_rows
FROM `EmployeeDocumentVersion` v
JOIN `EmployeeDocument` d ON d.`id` = v.`documentId`
WHERE v.`employeeDocumentId` IS NULL;
-- NOTE: if column `documentId` or `employeeDocumentId` does not exist yet
-- (pure shape A or pure shape B), this query errors — that is expected;
-- record "column missing" and skip it.

-- 4b) Rows whose documentId points at an EmployeeAgreement instead
--     (these MUST keep employeeDocumentId NULL — they are agreement history).
SELECT COUNT(*) AS agreement_alias_rows
FROM `EmployeeDocumentVersion` v
JOIN `EmployeeAgreement` a ON a.`id` = v.`documentId`;
-- Same caveat as 4a if the column does not exist yet.

-- 5) Dangling references: documentId values matching NEITHER table.
--    These are data-quality findings — report them, do not delete anything.
SELECT v.`id`, v.`documentId`, v.`createdAt`
FROM `EmployeeDocumentVersion` v
LEFT JOIN `EmployeeDocument` d ON d.`id` = v.`documentId`
LEFT JOIN `EmployeeAgreement` a ON a.`id` = v.`documentId`
WHERE v.`documentId` <> '' AND d.`id` IS NULL AND a.`id` IS NULL
LIMIT 100;

-- 6) Sanity on the parent table (should be complete per migrations
--    20260731000000_init_mysql + 20250915000000_hrms_enterprise).
SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'EmployeeDocument'
ORDER BY ORDINAL_POSITION;
