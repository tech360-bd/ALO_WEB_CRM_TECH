-- Align new interview columns with their declared application defaults.
-- Defaults affect future inserts only. Existing values and history are preserved.
ALTER TABLE `InterviewAssessment`
  ALTER COLUMN `dimensions` SET DEFAULT (_utf8mb4'[]'),
  ALTER COLUMN `strengths` SET DEFAULT (_utf8mb4'[]'),
  ALTER COLUMN `improvements` SET DEFAULT (_utf8mb4'[]'),
  ALTER COLUMN `evidence` SET DEFAULT (_utf8mb4'[]'),
  ALTER COLUMN `limitations` SET DEFAULT (_utf8mb4'[]'),
  ALTER COLUMN `studentMessage` SET DEFAULT (_utf8mb4'');
ALTER TABLE `InterviewPracticeWindow` ALTER COLUMN `extensionReason` SET DEFAULT (_utf8mb4'');
ALTER TABLE `InterviewReviewDecision`
  ALTER COLUMN `studentMessage` SET DEFAULT (_utf8mb4''),
  ALTER COLUMN `internalNotes` SET DEFAULT (_utf8mb4'');
ALTER TABLE `StudentInterviewFact`
  ALTER COLUMN `reasonUniversity` SET DEFAULT (_utf8mb4''),
  ALTER COLUMN `reasonCourse` SET DEFAULT (_utf8mb4''),
  ALTER COLUMN `fundingSource` SET DEFAULT (_utf8mb4''),
  ALTER COLUMN `futurePlan` SET DEFAULT (_utf8mb4'');
