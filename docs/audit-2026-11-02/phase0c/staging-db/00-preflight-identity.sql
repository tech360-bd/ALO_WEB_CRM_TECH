-- ============================================================================
-- PHASE 0C · STAGING-ONLY PREFLIGHT — READ-ONLY
--
-- PURPOSE: prove a database is NOT production BEFORE any other query runs.
-- Every statement is a SELECT. No INSERT/UPDATE/DELETE/DDL, no LOAD DATA,
-- no CALL, no SET GLOBAL, no temporary tables.
--
-- TABLE NAMES ARE TAKEN FROM prisma/schema.prisma. There is no @@map on the
-- catalogue models, so the table name equals the model name. Note that the
-- catalogue is CrmUniversity / CrmCourse, NOT University / Course.
--
-- RUN ORDER: this file first. If ANY check is 'UNEXPECTED', STOP and do not run
-- 01-recovery-verification.sql.
--
-- THIS FILE HAS NOT BEEN EXECUTED. The audit connected to no database.
-- ============================================================================

-- 0.1 Which server, schema, user and database.
--     If the host or database name contains prod/live/primary/main, STOP.
SELECT
  @@hostname         AS server_hostname,
  @@port             AS server_port,
  DATABASE()         AS current_database,
  CURRENT_USER()     AS current_user,
  VERSION()          AS server_version,
  @@read_only        AS server_read_only,
  @@sql_safe_updates AS sql_safe_updates;

-- 0.2 Replication peers — staging must not stream from a production primary.
SELECT CHANNEL_NAME, HOST AS source_host, PORT AS source_port, SERVICE_STATE
FROM performance_schema.replication_connection_configuration;

-- 0.3 Do the tables this audit expects actually exist?
--     Missing tables abort later queries, so this runs before any COUNT(*).
SELECT
  t.expected_table,
  CASE WHEN s.TABLE_NAME IS NULL THEN 'MISSING' ELSE 'present' END AS status
FROM (
            SELECT 'CrmUniversity'            AS expected_table
  UNION ALL SELECT 'CrmCourse'
  UNION ALL SELECT 'CourseIntake'
  UNION ALL SELECT 'CrmOfficialEvidence'
  UNION ALL SELECT 'CourseMonthCoverage'
  UNION ALL SELECT 'CrmCourseMonthlyCoverage'
  UNION ALL SELECT 'PortalStudentProfile'
  UNION ALL SELECT 'User'
  UNION ALL SELECT 'Lead'
  UNION ALL SELECT 'Application'
  UNION ALL SELECT 'AuditLog'
  UNION ALL SELECT 'SystemSetting'
) t
LEFT JOIN information_schema.TABLES s
       ON s.TABLE_SCHEMA = DATABASE() AND s.TABLE_NAME = t.expected_table
ORDER BY status DESC, t.expected_table;

-- 0.4 Row scale as a production tell. Compare against the figures the owner
--     states for production — do not guess what "small" means.
SELECT 'CrmUniversity'         AS table_name, COUNT(*) AS row_count FROM `CrmUniversity`
UNION ALL SELECT 'CrmCourse',                COUNT(*) FROM `CrmCourse`
UNION ALL SELECT 'CourseIntake',             COUNT(*) FROM `CourseIntake`
UNION ALL SELECT 'CrmOfficialEvidence',      COUNT(*) FROM `CrmOfficialEvidence`
UNION ALL SELECT 'CourseMonthCoverage',      COUNT(*) FROM `CourseMonthCoverage`
UNION ALL SELECT 'CrmCourseMonthlyCoverage', COUNT(*) FROM `CrmCourseMonthlyCoverage`
UNION ALL SELECT 'PortalStudentProfile',     COUNT(*) FROM `PortalStudentProfile`
UNION ALL SELECT 'User',                     COUNT(*) FROM `User`
UNION ALL SELECT 'Lead',                     COUNT(*) FROM `Lead`
UNION ALL SELECT 'Application',              COUNT(*) FROM `Application`
UNION ALL SELECT 'AuditLog',                 COUNT(*) FROM `AuditLog`;

-- 0.5 Real-customer markers. Any non-zero result is a STOP condition and must
--     be REPORTED, never deleted. Deletion is out of scope for Phase 0C.
SELECT
  COUNT(*)                                                         AS users,
  SUM(email LIKE '%@example.%')                                    AS example_domain,
  SUM(email LIKE '%@alo.test%')                                    AS alo_test_domain,
  SUM(email NOT LIKE '%@example.%'
      AND email NOT LIKE '%@alo.test%'
      AND email NOT LIKE '%test%')                                 AS looks_like_real_addresses
FROM `User`;

-- 0.6 Environment marker, where the application records one.
--     Absence of a marker is a finding ("UNKNOWN"), never proof of safety.
SELECT * FROM `SystemSetting`
WHERE `key` REGEXP '(?i)env|environment|stage|production|instance'
LIMIT 50;

-- 0.7 Prove the grants are read-only instead of testing a write (a write is
--     forbidden in this phase).
SELECT GRANTEE, TABLE_SCHEMA, PRIVILEGE_TYPE
FROM information_schema.SCHEMA_PRIVILEGES
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY GRANTEE, PRIVILEGE_TYPE;

SELECT GRANTEE, PRIVILEGE_TYPE, IS_GRANTABLE
FROM information_schema.USER_PRIVILEGES
WHERE GRANTEE = CONCAT("'", SUBSTRING_INDEX(CURRENT_USER(), '@', 1), "'@'%'");

-- 0.8 Verdict — fill in from the answers above. All six must be YES.
--   host/database looks staging ......... YES / NO
--   no replication from production ...... YES / NO
--   row counts plausible for staging .... YES / NO
--   no real-customer markers ............ YES / NO
--   grants are read-only ................ YES / NO
--   OWNER CONFIRMED non-production ...... YES / NO   <-- required, not optional
