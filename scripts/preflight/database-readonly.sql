-- OPERATOR REVIEW ONLY. SELECT statements; do not execute on an unapproved database.
-- Run sections only after confirming each table/column exists using information_schema.
SELECT VERSION() AS engine_version, DATABASE() AS database_name, @@sql_mode AS sql_mode;
SELECT TABLE_NAME FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN
('_prisma_migrations','EmployeeHR','EmployeeHRProfile','EmployeePayroll','EmployeePayrollItem','HrmPayrollRun');
SELECT migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations ORDER BY migration_name;
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, CHARACTER_SET_NAME, COLLATION_NAME
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('EmployeePayroll','EmployeePayrollItem','PortalAuditLog','CrmAuditLog','AuditLog','AgentAuditLog','HrmAuditLog');
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN ('EmployeePayroll','EmployeeHR','EmployeeHRProfile') ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
-- Only if employeeId and period already exist:
SELECT employeeId, period, COUNT(*) AS duplicate_count
FROM EmployeePayroll GROUP BY employeeId, period HAVING COUNT(*) > 1;
SELECT id, employeeId, period, monthYear, status FROM EmployeePayroll
WHERE period = '' OR period IS NULL OR period NOT REGEXP '^[0-9]{4}-(0[1-9]|1[0-2])$';
-- Empty employeeId is used for aggregate runs; never fill every row with a made-up employee.
SELECT id, employeeId, period, monthYear, status FROM EmployeePayroll WHERE employeeId = '';
SELECT payrollId, COUNT(DISTINCT employeeId) AS represented_employees
FROM EmployeePayrollItem GROUP BY payrollId;

SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH, INDEX_LENGTH FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('CrmAuditLog','PortalAuditLog','AgentAuditLog','EmployeeAuditLog');
SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME, SUB_PART FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('CrmAuditLog','PortalAuditLog','AgentAuditLog','EmployeeAuditLog');
