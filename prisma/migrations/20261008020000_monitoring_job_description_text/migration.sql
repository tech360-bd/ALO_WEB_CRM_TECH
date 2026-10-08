-- Monitoring job descriptions contain operator-facing purpose and behavior text,
-- which exceeds the 191-character limit of the original VARCHAR column.
-- Use TEXT to match the Prisma model and support the production description.
ALTER TABLE `MonitoringJob` MODIFY `description` TEXT NULL;
