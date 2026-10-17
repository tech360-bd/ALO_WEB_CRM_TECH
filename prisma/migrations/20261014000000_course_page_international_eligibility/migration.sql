-- Persist the explicit international-student eligibility decision on legacy course pages.
-- Existing rows remain non-public for international catalogues until reviewed.
ALTER TABLE `CoursePage`
  ADD COLUMN `internationalEligibility` VARCHAR(191) NOT NULL DEFAULT 'not_verified';
