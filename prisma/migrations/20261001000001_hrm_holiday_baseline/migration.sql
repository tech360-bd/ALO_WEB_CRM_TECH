-- Baseline reference holidays for the HRM attendance module.
-- Preserved from the legacy HRMS Enterprise migration (2025-09-15) so the
-- re-baselined chain keeps the same reference data on fresh installs.
-- Idempotent-safe on fresh databases only: `0_init` creates an empty
-- HrmAttendanceHoliday table. For a baselined pre-existing database that
-- already contains these rows, mark this migration as applied with
-- `prisma migrate resolve --applied 20261001000001_hrm_holiday_baseline`
-- instead of re-running it.
INSERT INTO `HrmAttendanceHoliday` (`id`, `date`, `title`, `type`) VALUES
('hol_2025_12_16', '2025-12-16', 'Victory Day', 'public'),
('hol_2026_02_21', '2026-02-21', 'Language Martyrs Day', 'public');
