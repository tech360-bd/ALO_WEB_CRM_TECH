-- Per-user permission overrides (ALLOW / DENY on top of role grants).
-- Additive only: creates one new table and its indexes. Safe to run on a live
-- database; no existing table or column is touched.

CREATE TABLE IF NOT EXISTS `user_permission_overrides` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `permissionKey` VARCHAR(191) NOT NULL,
  `effect` VARCHAR(191) NOT NULL,
  `reason` TEXT NOT NULL,
  `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
  `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `user_permission_overrides_userId_permissionKey_key`(`userId`, `permissionKey`),
  INDEX `user_permission_overrides_userId_effect_idx`(`userId`, `effect`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
