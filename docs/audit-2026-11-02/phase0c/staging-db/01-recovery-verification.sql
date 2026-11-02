-- ============================================================================
-- PHASE 0C · RECOVERY VERIFICATION — READ-ONLY
--
-- Compares the database against the canonical recovery inventory
-- (../canonical-*.csv, ../recovery-summary.json). One question: does the
-- database still hold catalogue rows the files no longer do?
--
-- PREREQUISITE: 00-preflight-identity.sql returned six YES answers AND the
-- database owner confirmed non-production in writing.
--
-- Table names come from prisma/schema.prisma (no @@map):
--   CrmUniversity, CrmCourse, CourseIntake, CrmOfficialEvidence,
--   CourseMonthCoverage, CrmCourseMonthlyCoverage, CrmCoverageRevision
--
-- Every statement is a SELECT. No writes, seeds, migrations or imports.
-- THIS FILE HAS NOT BEEN EXECUTED.
-- ============================================================================

-- 1. Catalogue scale.
SELECT 'CrmUniversity'  AS entity, COUNT(*) AS total_rows, COUNT(DISTINCT countryId) AS distinct_countries FROM `CrmUniversity`
UNION ALL
SELECT 'CrmCourse',      COUNT(*), COUNT(DISTINCT universityId) FROM `CrmCourse`
UNION ALL
SELECT 'CourseIntake',   COUNT(*), COUNT(DISTINCT courseId)     FROM `CourseIntake`;

-- 2. Verification-status distribution for each entity.
--    Compare with canonical-institutions.csv / canonical-courses.csv,
--    NOT with the retired "8 verified courses" claim.
SELECT 'CrmCourse' AS entity, verificationStatus, COUNT(*) AS rows
FROM `CrmCourse` GROUP BY verificationStatus
UNION ALL
SELECT 'CrmUniversity', verificationStatus, COUNT(*)
FROM `CrmUniversity` GROUP BY verificationStatus
ORDER BY entity, rows DESC;

-- 3. Synthetic contamination. Non-zero means synthetic rows reached the
--    database; quarantine (record ids), do not delete.
SELECT 'CrmCourse' AS entity, COUNT(*) AS synthetic_like_rows
FROM `CrmCourse`
WHERE courseSlug LIKE '%-synthetic%' OR title LIKE '%Synthetic%' OR officialCourseUrl LIKE '%example.%'
UNION ALL
SELECT 'CrmUniversity', COUNT(*)
FROM `CrmUniversity`
WHERE officialWebsite LIKE '%example.%' OR universitySlug LIKE '%-synthetic%';

-- 4. Field-level evidence coverage on the rows claiming verification.
--    The files show fee, English requirement and academic year weakest.
SELECT
  COUNT(*)                                     AS courses,
  SUM(feeAmount IS NOT NULL OR fee IS NOT NULL) AS has_fee,
  SUM(durationMonths IS NOT NULL)              AS has_duration,
  SUM(studyMode IS NOT NULL AND studyMode <> '') AS has_study_mode,
  SUM(campus IS NOT NULL AND campus <> '')     AS has_campus,
  SUM(academicYear IS NOT NULL AND academicYear <> '') AS has_academic_year
FROM `CrmCourse`
WHERE verificationStatus IN ('VERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED_OFFICIAL', 'CROSS_SOURCE_VERIFIED');

-- 5. Evidence records by class. File-level expectation: 30 catalogue, 32
--    universe-source, 14 URL-check.
SELECT
  sourceType,
  COUNT(*)              AS records,
  MIN(retrievedAt)      AS earliest,
  MAX(retrievedAt)      AS latest,
  SUM(httpStatus = 200) AS http_200,
  SUM(httpStatus = 404) AS http_404,
  SUM(httpStatus IS NULL) AS http_unknown
FROM `CrmOfficialEvidence`
GROUP BY sourceType
ORDER BY records DESC;

-- 6. Evidence not linked to any coverage row (the DB analogue of the 7
--    unlinked evidence ids in report 02 §3).
SELECT e.id, e.sourceUrl, e.sourceType, e.entityType
FROM `CrmOfficialEvidence` e
LEFT JOIN `CrmCourseMonthlyCoverage` c
       ON c.courseSlug = e.courseSlug AND c.published = 1
WHERE e.entityType = 'COURSE' AND c.id IS NULL
LIMIT 100;

-- 7. Duplicate institutions — the files hold Auckland x3, Manchester x2,
--    RMIT x2, Sydney x2. The database may hold the same duplicates.
SELECT
  LOWER(TRIM(name))            AS normalised_name,
  COUNT(*)                     AS rows,
  GROUP_CONCAT(id ORDER BY id) AS ids
FROM `CrmUniversity`
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1
ORDER BY rows DESC
LIMIT 50;

-- 8. Universities with contradictory course labels (the file-level
--    VERIFICATION_LABEL_DISAGREEMENT analogue).
SELECT
  u.id, u.name, u.verificationStatus,
  COUNT(c.id)                                 AS courses,
  SUM(c.verificationStatus = 'VERIFIED')      AS verified_courses,
  SUM(c.verificationStatus = 'NEEDS_REVIEW')  AS needs_review_courses
FROM `CrmUniversity` u
LEFT JOIN `CrmCourse` c ON c.universityId = u.id
GROUP BY u.id, u.name, u.verificationStatus
HAVING verified_courses > 0 AND needs_review_courses > 0
ORDER BY courses DESC
LIMIT 50;

-- 9. Coverage-shape audit across ALL FOUR coverage models.
--    Four models exist for one concept; this query is how you learn which are
--    populated and which are vestigial. Do not merge them before the owner
--    says which is authoritative.
SELECT 'CourseMonthCoverage'      AS model, COUNT(*) AS rows, COUNT(DISTINCT courseId) AS courses FROM `CourseMonthCoverage`
UNION ALL SELECT 'CrmCourseMonthlyCoverage', COUNT(*), COUNT(DISTINCT courseSlug) FROM `CrmCourseMonthlyCoverage`
UNION ALL SELECT 'CrmCoverageRevision',      COUNT(*), 0 FROM `CrmCoverageRevision`;

-- 10. Intake coverage shape. File-level expectation: 104 verified + 823 synthetic.
SELECT status, COUNT(*) AS rows
FROM `CourseIntake`
GROUP BY status
ORDER BY rows DESC;

-- ============================================================================
-- INTERPRETATION RULES
-- * DB count > file count  → the database holds catalogue data never exported.
--   That is a recovery win. Hand it over via SELECT output; SELECT INTO OUTFILE
--   writes to disk and needs approval.
-- * DB count < file count  → the files are ahead; nothing is lost.
-- * Synthetic rows in the DB → quarantine task, never a delete task.
-- * Any suggested change goes into a dry-run manifest and waits for approval.
-- ============================================================================
