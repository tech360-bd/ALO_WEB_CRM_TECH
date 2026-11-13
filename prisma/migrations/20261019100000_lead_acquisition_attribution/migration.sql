-- --------------------------------------------------------------------------
-- Lead acquisition attribution (Google Free Stack).
--
-- Purpose: preserve UTM / paid-click attribution from the visitor's landing
-- page all the way through the lead lifecycle, so that reporting can answer
-- "Google Organic -> /uk/student-visa -> 100 leads -> 35 qualified -> 15
-- applications -> 6 enrolments" instead of only "100 leads".
--
-- NON-DESTRUCTIVE. This migration:
--   * adds only NULLable columns to `Lead` (or `''`-defaulted VARCHAR to
--     `LeadForm`, matching that model's existing style),
--   * alters no existing column, renames nothing, drops nothing,
--   * performs no data backfill.
--
-- The absence of a backfill is deliberate. A lead created before this
-- migration genuinely has no recorded attribution; filling it with an inferred
-- source would fabricate business data, which the project's no-mock-data rule
-- forbids. Reporting treats NULL attribution as `unknown`, never as `direct`.
--
-- MySQL notes:
--   * `ADD COLUMN IF NOT EXISTS` is MariaDB-only and is intentionally not used,
--     so this file stays valid on MySQL 8 (the provider in migration_lock.toml).
--   * Every added column is VARCHAR(191) or DATETIME(3). No TEXT/BLOB/JSON
--     column is given a literal default, which MySQL rejects with ERROR 1101.
--   * All indexed columns are VARCHAR(191) = 764 bytes under utf8mb4, inside
--     the 767-byte InnoDB prefix limit, so the indexes build on every MySQL
--     and MariaDB row format rather than only on DYNAMIC.
-- --------------------------------------------------------------------------

-- AlterTable: Lead — canonical CRM lead record
ALTER TABLE `Lead`
  ADD COLUMN `medium` VARCHAR(191) NULL,
  ADD COLUMN `campaign` VARCHAR(191) NULL,
  ADD COLUMN `content` VARCHAR(191) NULL,
  ADD COLUMN `term` VARCHAR(191) NULL,
  ADD COLUMN `utmContent` VARCHAR(191) NULL,
  ADD COLUMN `utmTerm` VARCHAR(191) NULL,
  ADD COLUMN `gclid` VARCHAR(191) NULL,
  ADD COLUMN `fbclid` VARCHAR(191) NULL,
  ADD COLUMN `landingPage` VARCHAR(191) NULL,
  ADD COLUMN `referrer` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchSource` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchMedium` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchCampaign` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchLandingPage` VARCHAR(191) NULL,
  ADD COLUMN `firstTouchAt` DATETIME(3) NULL,
  ADD COLUMN `lastTouchSource` VARCHAR(191) NULL,
  ADD COLUMN `lastTouchMedium` VARCHAR(191) NULL,
  ADD COLUMN `lastTouchAt` DATETIME(3) NULL,
  ADD COLUMN `visitorId` VARCHAR(191) NULL;

-- AlterTable: LeadForm — public web capture record
ALTER TABLE `LeadForm`
  ADD COLUMN `utmSource` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `utmMedium` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `utmCampaign` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `utmContent` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `utmTerm` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `gclid` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `fbclid` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `landingPage` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `referrer` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `visitorId` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateIndex: funnel reporting reads by the attribution triplet, by landing
-- page, and by the paid-click identifiers; the visitor token is the join from
-- an analytics session back to the CRM record.
CREATE INDEX `Lead_utmSource_utmMedium_utmCampaign_idx` ON `Lead`(`utmSource`, `utmMedium`, `utmCampaign`);
CREATE INDEX `Lead_landingPage_idx` ON `Lead`(`landingPage`);
CREATE INDEX `Lead_visitorId_idx` ON `Lead`(`visitorId`);
CREATE INDEX `Lead_gclid_idx` ON `Lead`(`gclid`);
CREATE INDEX `LeadForm_utmSource_utmMedium_utmCampaign_idx` ON `LeadForm`(`utmSource`, `utmMedium`, `utmCampaign`);
CREATE INDEX `LeadForm_landingPage_idx` ON `LeadForm`(`landingPage`);

-- --------------------------------------------------------------------------
-- ROLLBACK STRATEGY
-- --------------------------------------------------------------------------
-- Every statement above is additive, so rollback is a straight inverse and
-- loses no pre-existing data (it discards only attribution captured after this
-- migration was applied). Apply in this order:
--
--   DROP INDEX `LeadForm_landingPage_idx` ON `LeadForm`;
--   DROP INDEX `LeadForm_utmSource_utmMedium_utmCampaign_idx` ON `LeadForm`;
--   DROP INDEX `Lead_gclid_idx` ON `Lead`;
--   DROP INDEX `Lead_visitorId_idx` ON `Lead`;
--   DROP INDEX `Lead_landingPage_idx` ON `Lead`;
--   DROP INDEX `Lead_utmSource_utmMedium_utmCampaign_idx` ON `Lead`;
--
--   ALTER TABLE `LeadForm`
--     DROP COLUMN `utmSource`, DROP COLUMN `utmMedium`, DROP COLUMN `utmCampaign`,
--     DROP COLUMN `utmContent`, DROP COLUMN `utmTerm`, DROP COLUMN `gclid`,
--     DROP COLUMN `fbclid`, DROP COLUMN `landingPage`, DROP COLUMN `referrer`,
--     DROP COLUMN `visitorId`;
--
--   ALTER TABLE `Lead`
--     DROP COLUMN `medium`, DROP COLUMN `campaign`, DROP COLUMN `content`,
--     DROP COLUMN `term`, DROP COLUMN `utmContent`, DROP COLUMN `utmTerm`,
--     DROP COLUMN `gclid`, DROP COLUMN `fbclid`, DROP COLUMN `landingPage`,
--     DROP COLUMN `referrer`, DROP COLUMN `firstTouchSource`,
--     DROP COLUMN `firstTouchMedium`, DROP COLUMN `firstTouchCampaign`,
--     DROP COLUMN `firstTouchLandingPage`, DROP COLUMN `firstTouchAt`,
--     DROP COLUMN `lastTouchSource`, DROP COLUMN `lastTouchMedium`,
--     DROP COLUMN `lastTouchAt`, DROP COLUMN `visitorId`;
--
-- To preserve captured attribution while removing the code path, take a logical
-- dump of the two tables first (mysqldump --no-create-info --tables Lead
-- LeadForm) — but note the existing deployment has no mysqldump credential
-- configured, which is why the `database-backup` cron job is quarantined.
-- --------------------------------------------------------------------------
