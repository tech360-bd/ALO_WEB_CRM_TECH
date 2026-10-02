-- CmsRevision: Virtual Editor revision history (draft / preview / publish /
-- rollback / audit). Additive and idempotent (IF NOT EXISTS, inline indexes)
-- so databases already shaped by `prisma db push` no-op safely.
CREATE TABLE IF NOT EXISTS `CmsRevision` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `kind` VARCHAR(191) NOT NULL DEFAULT 'AUTO',
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `snapshot` JSON NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,

    INDEX `CmsRevision_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `CmsRevision_kind_createdAt_idx`(`kind`, `createdAt`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
