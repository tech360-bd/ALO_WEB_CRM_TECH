-- Payroll safety schema reconciliation and duplicate-period guard.
--
-- OPERATIONS SAFETY: migrations are intentionally disabled by default in
-- deploy-production.yml. Before enabling this migration, take and verify a
-- database backup, inspect existing EmployeePayroll duplicates, and confirm
-- the target is the expected database. This migration is additive and does
-- not delete, rewrite, or truncate any rows. The unique index deliberately
-- fails if duplicate rows already exist so an operator can resolve them
-- manually rather than silently choosing a payroll record.

ALTER TABLE `EmployeePayroll`
  ADD COLUMN `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `period` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `basicSalary` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `allowances` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `bonus` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `overtime` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `loanDeduction` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `advanceDeduction` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `taxDeduction` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `pfDeduction` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `grossSalary` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `netSalary` DOUBLE NOT NULL DEFAULT 0,
  ADD COLUMN `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `EmployeePayrollItem`
  ADD COLUMN `itemType` VARCHAR(191) NOT NULL DEFAULT 'earning',
  ADD COLUMN `label` VARCHAR(191) NOT NULL DEFAULT '',
  ADD COLUMN `amount` DOUBLE NOT NULL DEFAULT 0;

CREATE INDEX `EmployeePayroll_period_idx` ON `EmployeePayroll` (`period`);
CREATE UNIQUE INDEX `EmployeePayroll_employeeId_period_key` ON `EmployeePayroll` (`employeeId`, `period`);
