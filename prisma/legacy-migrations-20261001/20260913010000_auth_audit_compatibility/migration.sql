-- Additive authentication/audit compatibility for the existing MySQL schema.
-- No existing rows are deleted or rewritten.

ALTER TABLE `User`
  ADD COLUMN `phone` VARCHAR(191) NULL,
  ADD COLUMN `passwordHash` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `mustChangePwd` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
  ADD COLUMN `partnerId` VARCHAR(191) NULL;

CREATE INDEX `User_status_idx` ON `User` (`status`);
CREATE INDEX `User_role_idx` ON `User` (`role`);

CREATE TABLE `AuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NULL,
  `action` VARCHAR(191) NOT NULL,
  `resource` VARCHAR(191) NULL,
  `resourceId` VARCHAR(191) NULL,
  `details` TEXT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `AuditLog_userId_idx` (`userId`),
  INDEX `AuditLog_action_idx` (`action`),
  PRIMARY KEY (`id`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
