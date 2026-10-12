-- Persist acknowledged provider IDs. NULLs keep legacy and unknown-acceptance
-- messages distinct; do not infer provider IDs from recipients or timestamps.
ALTER TABLE `SmsLog`
  ADD COLUMN `provider` VARCHAR(191) NULL,
  ADD COLUMN `providerMessageId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `SmsLog_provider_providerMessageId_key`
  ON `SmsLog` (`provider`, `providerMessageId`);
-- AuditLog.user relation restored in Prisma is the existing 0_init FK;
-- it introduces no new column or constraint here.
