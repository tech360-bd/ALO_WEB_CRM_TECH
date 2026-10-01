-- REVIEW / HANDOFF ONLY. NOT EXECUTED. Use a pre-approved SELECT-only identity.
-- No database/user/host value is invented. No USE, SET, DDL, DML, CALL or migration commands.
-- Query each section only after confirming objects/columns exist. Bound expensive
-- scans through operator/DBA-approved statement timeout/read replica where available.
-- Keep outputs private; do not export customer rows, passwords, token fields or error logs.

-- 1. Identity and TLS of this connection (not proof that the app uses the same identity).
SELECT DATABASE() AS database_name, VERSION() AS engine_version,
       @@version_comment AS engine_distribution, @@sql_mode AS sql_mode,
       @@lower_case_table_names AS lower_case_table_names;
-- Operator may privately inspect CURRENT_USER() to verify grant matching; do not
-- place the result in public artifacts. Obtain app host/user from redacted runtime config.
-- With appropriate metadata visibility (absence does not mean TLS disabled):
SELECT VARIABLE_NAME, VARIABLE_VALUE FROM performance_schema.session_status
WHERE VARIABLE_NAME IN ('Ssl_version', 'Ssl_cipher');
-- Provider must separately confirm whether TLS is REQUIRED and verify its CA policy.

-- 2. Full metadata for the selected approved database only.
SELECT TABLE_NAME, TABLE_TYPE, ENGINE, TABLE_COLLATION
FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;
SELECT TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, COLUMN_TYPE, DATA_TYPE,
       IS_NULLABLE, COLUMN_DEFAULT, EXTRA, CHARACTER_SET_NAME, COLLATION_NAME,
       CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, DATETIME_PRECISION
FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION;
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE, SEQ_IN_INDEX, COLUMN_NAME,
       SUB_PART, INDEX_TYPE, COLLATION, NULLABLE
FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, ORDINAL_POSITION,
       REFERENCED_TABLE_SCHEMA, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION;
SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, UPDATE_RULE, DELETE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, CONSTRAINT_NAME;
-- Check-constraint expressions vary by MySQL/MariaDB version; obtain them using
-- version-appropriate INFORMATION_SCHEMA metadata after version discovery.

-- 3. Run only if _prisma_migrations and these columns are present.
-- Deliberately omit logs: failure logs can contain credentials or business payloads.
SELECT migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations ORDER BY migration_name, started_at;

-- 4. Optional bounded maintenance-window aggregate checks ONLY after columns,
-- table mappings and read costs are verified. No record deletion/survivor selection.
SELECT COUNT(*) AS duplicate_employee_period_groups FROM (
  SELECT employeeId, period FROM EmployeePayroll GROUP BY employeeId, period HAVING COUNT(*) > 1
) AS duplicate_groups;
SELECT COUNT(*) AS duplicate_legacy_payroll_groups FROM (
  SELECT employeeId, monthYear FROM Payroll GROUP BY employeeId, monthYear HAVING COUNT(*) > 1
) AS duplicate_groups;
SELECT COUNT(*) AS duplicate_run_period_groups FROM (
  SELECT monthYear FROM HrmPayrollRun GROUP BY monthYear HAVING COUNT(*) > 1
) AS duplicate_groups;
SELECT COUNT(*) AS duplicate_payment_reference_groups FROM (
  SELECT paymentId FROM Payment GROUP BY paymentId HAVING COUNT(*) > 1
) AS duplicate_groups;
SELECT COUNT(*) AS duplicate_nonempty_mock_transaction_groups FROM (
  SELECT transactionId FROM MockTestPayment WHERE transactionId <> ''
  GROUP BY transactionId HAVING COUNT(*) > 1
) AS duplicate_groups;
SELECT status, COUNT(*) AS records FROM Payment GROUP BY status;
SELECT status, COUNT(*) AS records FROM AloPayment GROUP BY status;
SELECT status, COUNT(*) AS records FROM EmployeePayroll GROUP BY status;
SELECT status, COUNT(*) AS records FROM Commission GROUP BY status;
-- AloPayment has no provider/idempotency reference in this schema: equal amounts
-- are NOT sufficient to call records duplicates. A business reference is required.
