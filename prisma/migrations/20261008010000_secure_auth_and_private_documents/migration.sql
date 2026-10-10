-- Add safe defaults and backing fields for current OTP, file-storage and appointment flows.
-- Historical migrations remain immutable. Existing valid accounts stay verified;
-- outstanding legacy OTPs are revoked because they were stored as plaintext.
ALTER TABLE `User`
  ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false;
UPDATE `User` SET `emailVerified` = true WHERE UPPER(`status`) = 'ACTIVE';
UPDATE `PortalUser` SET `emailVerified` = true WHERE LOWER(`status`) = 'active';

ALTER TABLE `OtpCode`
  ADD COLUMN `ipAddress` VARCHAR(191) NOT NULL DEFAULT '';
UPDATE `OtpCode` SET `used` = true WHERE `used` = false;
UPDATE `Student` SET `otpCode` = '', `otpExpiresAt` = NULL WHERE `otpCode` <> '';
CREATE INDEX `LoginAttempt_ipAddress_success_createdAt_idx` ON `LoginAttempt` (`ipAddress`, `success`, `createdAt`);
CREATE INDEX `LoginAttempt_email_success_createdAt_idx` ON `LoginAttempt` (`email`, `success`, `createdAt`);
CREATE INDEX `OtpCode_ipAddress_createdAt_idx` ON `OtpCode` (`ipAddress`, `createdAt`);
CREATE INDEX `OtpCode_email_purpose_createdAt_idx` ON `OtpCode` (`email`, `purpose`, `createdAt`);

ALTER TABLE `PortalStudentDocument`
  ADD COLUMN `storagePath` VARCHAR(191) NULL,
  ADD COLUMN `mimeType` VARCHAR(191) NULL,
  ADD COLUMN `fileHash` VARCHAR(191) NULL;
ALTER TABLE `StudentDocument`
  ADD COLUMN `storagePath` VARCHAR(191) NULL,
  ADD COLUMN `mimeType` VARCHAR(191) NULL,
  ADD COLUMN `fileHash` VARCHAR(191) NULL,
  ADD COLUMN `fileSize` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `Document`
  ADD COLUMN `mimeType` VARCHAR(191) NULL,
  ADD COLUMN `fileHash` VARCHAR(191) NULL;

-- Review links remain valid after migration because application code hashes
-- the presented bearer token before looking it up. Raw tokens are no longer
-- retained in the database after this one-time transform.
UPDATE `ReviewInvitation`
  SET `token` = LOWER(SHA2(`token`, 256))
  WHERE `token` IS NOT NULL AND `token` <> '';

ALTER TABLE `Appointment`
  ALTER `status` SET DEFAULT 'REQUESTED';
