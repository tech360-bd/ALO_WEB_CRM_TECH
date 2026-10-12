-- Student / partner / employee identifier sequence (additive, no existing data touched).
-- Matches the Prisma MySQL output for model StudentIdSequence in prisma/schema.prisma.
-- NOT RUN locally: no MySQL and no working Prisma schema engine in the sandbox.
-- Validate in CI with `prisma migrate deploy` against a disposable database.

CREATE TABLE IF NOT EXISTS `StudentIdSequence` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(16) NOT NULL,
    `year` INTEGER NOT NULL,
    `lastValue` INTEGER NOT NULL DEFAULT 0,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StudentIdSequence_scope_year_key`(`scope`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
