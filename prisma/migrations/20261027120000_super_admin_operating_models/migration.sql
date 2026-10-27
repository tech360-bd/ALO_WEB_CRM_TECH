-- Super Admin Operating Dashboard — additive only.
-- Audit first: Branch/Partner/Message/FollowUp/SecurityLog/Report/AiJob/AiApproval
-- and per-user permission overrides already have equivalent tables in this
-- schema (offices, partner_profiles, communication_messages, etc.) and are NOT
-- re-created here. These three tables were genuinely missing.

CREATE TABLE IF NOT EXISTS `permission_groups` (
  `id`          VARCHAR(191) NOT NULL,
  `key`         VARCHAR(191) NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `department`  VARCHAR(191) NOT NULL DEFAULT '',
  `riskLevel`   VARCHAR(191) NOT NULL DEFAULT 'standard',
  `permissions` TEXT NOT NULL,
  `isSystem`    BOOLEAN NOT NULL DEFAULT false,
  `isActive`    BOOLEAN NOT NULL DEFAULT true,
  `createdBy`   VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3) NOT NULL,
  UNIQUE INDEX `permission_groups_key_key` (`key`),
  INDEX `permission_groups_department_idx` (`department`),
  INDEX `permission_groups_isActive_idx` (`isActive`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `permission_group_grants` (
  `id`        VARCHAR(191) NOT NULL,
  `groupId`   VARCHAR(191) NOT NULL,
  `ownerType` VARCHAR(191) NOT NULL,
  `ownerId`   VARCHAR(191) NOT NULL,
  `grantedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `reason`    TEXT NOT NULL,
  `expiresAt` DATETIME(3) NULL,
  `isActive`  BOOLEAN NOT NULL DEFAULT true,
  `revokedAt` DATETIME(3) NULL,
  `revokedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `permission_group_grants_groupId_ownerType_ownerId_key` (`groupId`, `ownerType`, `ownerId`),
  INDEX `permission_group_grants_ownerType_ownerId_idx` (`ownerType`, `ownerId`),
  INDEX `permission_group_grants_expiresAt_idx` (`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `permission_group_grants`
  ADD CONSTRAINT `permission_group_grants_groupId_fkey`
  FOREIGN KEY (`groupId`) REFERENCES `permission_groups`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `system_settings` (
  `id`          VARCHAR(191) NOT NULL,
  `key`         VARCHAR(191) NOT NULL,
  `value`       TEXT NOT NULL,
  `valueType`   VARCHAR(191) NOT NULL DEFAULT 'string',
  `category`    VARCHAR(191) NOT NULL DEFAULT 'general',
  `label`       VARCHAR(191) NOT NULL DEFAULT '',
  `description` TEXT NOT NULL,
  `isSensitive` BOOLEAN NOT NULL DEFAULT false,
  `updatedBy`   VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3) NOT NULL,
  UNIQUE INDEX `system_settings_key_key` (`key`),
  INDEX `system_settings_category_idx` (`category`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
