-- Official course titles for research/PhD opportunities can exceed 191 characters.
-- Preserve source titles rather than truncating them during draft staging.
ALTER TABLE `CrmCourse`
  MODIFY COLUMN `courseTitle` VARCHAR(512) NOT NULL;
