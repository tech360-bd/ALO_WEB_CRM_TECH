-- PROPOSED ROLLBACK for 9002. Safe: the table holds only approval rows; no
-- CrmCourse column, value or audit history is touched by dropping it.
-- Approvals are lost, which is the intended effect of a rollback: the pathway
-- stops publishing because it has no approvals.
DROP TABLE IF EXISTS `CrmCourseLimitedPublication`;
