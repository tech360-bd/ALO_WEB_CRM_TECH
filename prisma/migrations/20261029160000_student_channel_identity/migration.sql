-- ALO Education — durable inbound channel identity bindings
-- ADDITIVE ONLY: creates one table. No existing table, column, index or row is modified or dropped.
-- Backs src/lib/identity/inbound-provisioning.ts (channel <-> student links, unlink history).
-- Generated with: npx prisma migrate diff --from-schema-datamodel <main> --to-schema-datamodel prisma/schema.prisma --script

-- CreateTable
CREATE TABLE `StudentChannelIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `channel` VARCHAR(191) NOT NULL,
    `channelAccountId` VARCHAR(191) NOT NULL DEFAULT '',
    `externalUserId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `linkedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `linkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unlinkedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `unlinkedAt` DATETIME(3) NULL,
    `unlinkReason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentChannelIdentity_studentId_idx`(`studentId`),
    INDEX `StudentChannelIdentity_active_idx`(`active`),
    UNIQUE INDEX `StudentChannelIdentity_channel_channelAccountId_externalUser_key`(`channel`, `channelAccountId`, `externalUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

