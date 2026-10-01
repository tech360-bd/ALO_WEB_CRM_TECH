-- NOT EXECUTED. SELECT only, MySQL syntax. Verify physical tables/columns first.
-- Authorized operator only; bounded aggregates may still require an off-peak window.
SELECT (p1.id IS NOT NULL) AS matches_profile_id,
       (p2.id IS NOT NULL) AS matches_profile_code,
       (s.id IS NOT NULL) AS matches_student_id,
       COUNT(*) AS payment_rows
FROM `AloPayment` a
LEFT JOIN `PortalStudentProfile` p1 ON p1.id = a.studentId
LEFT JOIN `PortalStudentProfile` p2 ON p2.studentId = a.studentId
LEFT JOIN `Student` s ON s.id = a.studentId
GROUP BY (p1.id IS NOT NULL), (p2.id IS NOT NULL), (s.id IS NOT NULL);

-- Independent namespaces can collide even without payment rows today.
SELECT 'profile_id_vs_profile_code' AS comparison, COUNT(*) AS matches
FROM `PortalStudentProfile` a JOIN `PortalStudentProfile` b ON a.id = b.studentId
UNION ALL
SELECT 'profile_id_vs_student_id', COUNT(*)
FROM `PortalStudentProfile` p JOIN `Student` s ON p.id = s.id
UNION ALL
SELECT 'profile_code_vs_student_id', COUNT(*)
FROM `PortalStudentProfile` p JOIN `Student` s ON p.studentId = s.id;

-- Existing authenticated user linkage is a candidate only, not approved mapping.
SELECT canonical_candidates, COUNT(*) AS profiles
FROM (
  SELECT p.id, COUNT(s.id) AS canonical_candidates
  FROM `PortalStudentProfile` p LEFT JOIN `Student` s ON s.userId = p.userId
  GROUP BY p.id
) candidate_counts
GROUP BY canonical_candidates;

-- Never combine currencies into one financial total.
SELECT currency, status, COUNT(*) AS rows_in_group, SUM(amount) AS recorded_amount
FROM `AloPayment` GROUP BY currency, status;
