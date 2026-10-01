-- REVIEW CANDIDATE ONLY, NOT AN AUTOMATIC MIGRATION. Requires MySQL >=8.0.13.
-- Confirm charset/collation/indexes and use matching MODIFY definitions after inspecting live columns.
-- Schema @db.LongText is intended target; existing database capacity remains unverified.
-- Forward-only payload widening. No deletion/backfill; never truncates evidence.
-- APPLIED HISTORY UNKNOWN: do not deploy until the earlier migration chain is reconciled,
-- live column types are checked and backup/restore + staging rehearsal are approved.
ALTER TABLE `CrmAuditLog` MODIFY COLUMN `beforeData` LONGTEXT NOT NULL DEFAULT ('{}');
ALTER TABLE `CrmAuditLog` MODIFY COLUMN `afterData` LONGTEXT NOT NULL DEFAULT ('{}');
ALTER TABLE `PortalAuditLog` MODIFY COLUMN `metadata` LONGTEXT NOT NULL DEFAULT ('{}');
ALTER TABLE `AgentAuditLog` MODIFY COLUMN `metadata` LONGTEXT NOT NULL DEFAULT ('{}');
ALTER TABLE `AgentAuditLog` MODIFY COLUMN `before` LONGTEXT NOT NULL DEFAULT ('');
ALTER TABLE `AgentAuditLog` MODIFY COLUMN `after` LONGTEXT NOT NULL DEFAULT ('');
ALTER TABLE `EmployeeAuditLog` MODIFY COLUMN `oldValue` LONGTEXT NOT NULL DEFAULT ('{}');
ALTER TABLE `EmployeeAuditLog` MODIFY COLUMN `newValue` LONGTEXT NOT NULL DEFAULT ('{}');
