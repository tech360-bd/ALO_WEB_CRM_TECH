-- AuditLog.userId: '' default + FK to User violated the foreign key on every
-- system-generated audit row (no acting user), turning successful public
-- lead submissions into HTTP 500s. Make the column nullable, then convert
-- any legacy empty-string values (only possible on databases created before
-- the FK existed) to NULL.

ALTER TABLE `audit_logs` MODIFY `userId` VARCHAR(191) NULL;

UPDATE `audit_logs` SET `userId` = NULL WHERE `userId` = '';
