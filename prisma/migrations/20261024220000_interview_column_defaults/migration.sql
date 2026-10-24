-- Align new interview columns with their declared application defaults.
-- Defaults affect future inserts only. Existing values and history are preserved.
ALTER TABLE `InterviewAssessment`
  MODIFY COLUMN `dimensions` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `strengths` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `improvements` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `evidence` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `limitations` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `studentMessage` TEXT NOT NULL DEFAULT (_utf8mb4'');
ALTER TABLE `InterviewPracticeWindow` MODIFY COLUMN `extensionReason` TEXT NOT NULL DEFAULT (_utf8mb4'');
ALTER TABLE `InterviewReviewDecision`
  MODIFY COLUMN `studentMessage` TEXT NOT NULL DEFAULT (_utf8mb4''),
  MODIFY COLUMN `internalNotes` TEXT NOT NULL DEFAULT (_utf8mb4'');
ALTER TABLE `StudentInterviewFact`
  MODIFY COLUMN `reasonUniversity` TEXT NOT NULL DEFAULT (_utf8mb4''),
  MODIFY COLUMN `reasonCourse` TEXT NOT NULL DEFAULT (_utf8mb4''),
  MODIFY COLUMN `fundingSource` TEXT NOT NULL DEFAULT (_utf8mb4''),
  MODIFY COLUMN `futurePlan` TEXT NOT NULL DEFAULT (_utf8mb4'');
