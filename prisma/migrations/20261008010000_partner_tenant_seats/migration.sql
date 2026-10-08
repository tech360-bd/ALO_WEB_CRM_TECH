-- ═══════════════════════════════════════════════════════════════════════════
-- B2B PARTNER TENANCY, PARTNER-SIDE ROLES AND APPROVED SEAT GRANTS
--
-- Fixes three defects that made the partner user-seat model unusable:
--
--   1. `PartnerProfile.partnerId` was UNIQUE, so a partner company could only
--      ever have ONE user. The Starter package ("1 Partner Super Admin +
--      2 Employees" = 3 seats) was impossible: creating the second user always
--      failed with a unique-constraint error, and every seat count capped at 1.
--      partnerId is a tenant key, so the UNIQUE index becomes a plain index.
--
--   2. There was no notion of a role WITHIN a partner tenant, so any partner
--      user could perform Partner Super Admin actions.
--
--   3. Approving an extra-seat request had nowhere to record the granted
--      limit, so approval had no effect on the enforced seat cap.
--
-- Additive and non-destructive: no table or column is dropped and no row is
-- deleted. Guarded idempotent DDL (MySQL 8 has no ADD COLUMN IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Drop the UNIQUE on PartnerProfile.partnerId (replaced by an index) ──
SET @pp_drop_uniq := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerProfile' AND INDEX_NAME = 'PartnerProfile_partnerId_key') > 0,
    'ALTER TABLE PartnerProfile DROP INDEX PartnerProfile_partnerId_key', 'SELECT 1'));
PREPARE stmt_pp_drop_uniq FROM @pp_drop_uniq; EXECUTE stmt_pp_drop_uniq; DEALLOCATE PREPARE stmt_pp_drop_uniq;

-- ── 2. Role of the user within the partner tenant ──
-- Existing rows are the only user of their tenant, so they become its admin.
SET @pp_role := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerProfile' AND COLUMN_NAME = 'partnerRole') = 0,
    'ALTER TABLE PartnerProfile ADD COLUMN partnerRole VARCHAR(191) NOT NULL DEFAULT ''PARTNER_SUPER_ADMIN''', 'SELECT 1'));
PREPARE stmt_pp_role FROM @pp_role; EXECUTE stmt_pp_role; DEALLOCATE PREPARE stmt_pp_role;

SET @pp_idx := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerProfile' AND INDEX_NAME = 'PartnerProfile_partnerId_idx') = 0,
    'CREATE INDEX PartnerProfile_partnerId_idx ON PartnerProfile (partnerId)', 'SELECT 1'));
PREPARE stmt_pp_idx FROM @pp_idx; EXECUTE stmt_pp_idx; DEALLOCATE PREPARE stmt_pp_idx;

SET @pp_idx_role := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerProfile' AND INDEX_NAME = 'PartnerProfile_partnerId_partnerRole_idx') = 0,
    'CREATE INDEX PartnerProfile_partnerId_partnerRole_idx ON PartnerProfile (partnerId, partnerRole)', 'SELECT 1'));
PREPARE stmt_pp_idx_role FROM @pp_idx_role; EXECUTE stmt_pp_idx_role; DEALLOCATE PREPARE stmt_pp_idx_role;

-- ── 3. ALO-approved seat grant on the package assignment ──
-- NULL keeps the package default, so existing assignments are unchanged.
SET @pa_seat := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerPackageAssignment' AND COLUMN_NAME = 'seatOverride') = 0,
    'ALTER TABLE PartnerPackageAssignment ADD COLUMN seatOverride INTEGER NULL', 'SELECT 1'));
PREPARE stmt_pa_seat FROM @pa_seat; EXECUTE stmt_pa_seat; DEALLOCATE PREPARE stmt_pa_seat;

SET @pa_idx_p := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerPackageAssignment' AND INDEX_NAME = 'PartnerPackageAssignment_partnerId_idx') = 0,
    'CREATE INDEX PartnerPackageAssignment_partnerId_idx ON PartnerPackageAssignment (partnerId)', 'SELECT 1'));
PREPARE stmt_pa_idx_p FROM @pa_idx_p; EXECUTE stmt_pa_idx_p; DEALLOCATE PREPARE stmt_pa_idx_p;

SET @pa_idx_ps := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerPackageAssignment' AND INDEX_NAME = 'PartnerPackageAssignment_partnerId_status_idx') = 0,
    'CREATE INDEX PartnerPackageAssignment_partnerId_status_idx ON PartnerPackageAssignment (partnerId, status)', 'SELECT 1'));
PREPARE stmt_pa_idx_ps FROM @pa_idx_ps; EXECUTE stmt_pa_idx_ps; DEALLOCATE PREPARE stmt_pa_idx_ps;

SET @pa_idx_pk := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerPackageAssignment' AND INDEX_NAME = 'PartnerPackageAssignment_packageId_idx') = 0,
    'CREATE INDEX PartnerPackageAssignment_packageId_idx ON PartnerPackageAssignment (packageId)', 'SELECT 1'));
PREPARE stmt_pa_idx_pk FROM @pa_idx_pk; EXECUTE stmt_pa_idx_pk; DEALLOCATE PREPARE stmt_pa_idx_pk;

-- ── 4. Indexes for the seat-request review queue (partner view + ALO queue) ──
SET @sr_idx_p := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerUserSeatRequest' AND INDEX_NAME = 'PartnerUserSeatRequest_partnerId_idx') = 0,
    'CREATE INDEX PartnerUserSeatRequest_partnerId_idx ON PartnerUserSeatRequest (partnerId)', 'SELECT 1'));
PREPARE stmt_sr_idx_p FROM @sr_idx_p; EXECUTE stmt_sr_idx_p; DEALLOCATE PREPARE stmt_sr_idx_p;

SET @sr_idx_ps := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerUserSeatRequest' AND INDEX_NAME = 'PartnerUserSeatRequest_partnerId_status_idx') = 0,
    'CREATE INDEX PartnerUserSeatRequest_partnerId_status_idx ON PartnerUserSeatRequest (partnerId, status)', 'SELECT 1'));
PREPARE stmt_sr_idx_ps FROM @sr_idx_ps; EXECUTE stmt_sr_idx_ps; DEALLOCATE PREPARE stmt_sr_idx_ps;

SET @sr_idx_sc := (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'PartnerUserSeatRequest' AND INDEX_NAME = 'PartnerUserSeatRequest_status_createdAt_idx') = 0,
    'CREATE INDEX PartnerUserSeatRequest_status_createdAt_idx ON PartnerUserSeatRequest (status, createdAt)', 'SELECT 1'));
PREPARE stmt_sr_idx_sc FROM @sr_idx_sc; EXECUTE stmt_sr_idx_sc; DEALLOCATE PREPARE stmt_sr_idx_sc;

-- ── 5. Chain registration (idempotent; 0_init shape + the new columns) ──
CREATE TABLE IF NOT EXISTS `PartnerProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `partnerRole` VARCHAR(191) NOT NULL DEFAULT 'PARTNER_SUPER_ADMIN',
    `companyName` VARCHAR(191) NOT NULL DEFAULT '',
    `contactPerson` VARCHAR(191) NOT NULL DEFAULT '',
    `businessType` VARCHAR(191) NOT NULL DEFAULT '',
    `city` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `approvalStatus` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `totalLeads` INTEGER NOT NULL DEFAULT 0,
    `activeStudents` INTEGER NOT NULL DEFAULT 0,
    `commissionPending` DOUBLE NOT NULL DEFAULT 0,
    `commissionPaid` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PartnerProfile_userId_key`(`userId`),
    INDEX `PartnerProfile_partnerId_idx`(`partnerId`),
    INDEX `PartnerProfile_partnerId_partnerRole_idx`(`partnerId`, `partnerRole`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PartnerPackageAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `partnerId` VARCHAR(191) NOT NULL,
    `packageId` VARCHAR(191) NOT NULL,
    `assignedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `startsAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `seatOverride` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PartnerPackageAssignment_partnerId_idx`(`partnerId`),
    INDEX `PartnerPackageAssignment_partnerId_status_idx`(`partnerId`, `status`),
    INDEX `PartnerPackageAssignment_packageId_idx`(`packageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
