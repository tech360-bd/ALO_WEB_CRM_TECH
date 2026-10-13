-- ALO Education — cron/job distributed lease (additive).
--
-- Why: cron-definitions.ts declares 15 scheduled jobs, neither the worker nor
-- any /api/cron/* route had a usable cross-process lock, and 14 of the 15
-- declared route paths had no route file at all. `DeploymentSequence` was used
-- as a fallback lock but has no owner/expiry column, so it could not exclude a
-- concurrent runner nor recover from a crashed one.
--
-- This migration is purely additive:
--   * creates one new table,
--   * touches no existing table, column, index, foreign key or row,
--   * is safe to re-run at the schema level (CREATE TABLE IF NOT EXISTS).
--
-- The column, index and constraint lines below are byte-for-byte what
-- `prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma`
-- emits for the CronLock model. That is deliberate: the CI drift gate diffs the
-- migration-derived shadow database against schema.prisma, so hand-written
-- variants are rejected even when they look equivalent. An earlier revision of
-- this file omitted the trailing PRIMARY KEY (`id`) clause, which the gate
-- correctly caught as drift — every Prisma-generated CREATE TABLE carries it.
--
-- To regenerate after changing the model:
--   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script

CREATE TABLE IF NOT EXISTS `CronLock` (
    `id` VARCHAR(191) NOT NULL,
    `jobKey` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL DEFAULT '',
    `lockedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `runCount` INTEGER NOT NULL DEFAULT 0,
    `lastRunAt` DATETIME(3) NULL,
    `lastStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `lastError` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CronLock_jobKey_key`(`jobKey`),
    INDEX `CronLock_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
