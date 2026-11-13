-- Additive widening for the existing staged student-import workflow.
-- Existing row content is preserved; text payloads are widened so an import row
-- can retain its notes, communications and document metadata without truncation.
ALTER TABLE `ImportStagingStudent`
  ADD COLUMN `rowNumber` INTEGER NOT NULL DEFAULT 0,
  MODIFY COLUMN `documentsJson` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `notesJson` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `communicationJson` LONGTEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `errorDetails` LONGTEXT NOT NULL DEFAULT (_utf8mb4'');

ALTER TABLE `ImportError`
  MODIFY COLUMN `rawData` LONGTEXT NULL;

ALTER TABLE `PortalTimelineEvent`
  MODIFY COLUMN `content` LONGTEXT NOT NULL DEFAULT (_utf8mb4'');

CREATE INDEX `ImportStagingStudent_batchId_idx` ON `ImportStagingStudent`(`batchId`);
CREATE INDEX `ImportStagingStudent_oldCrmId_status_idx` ON `ImportStagingStudent`(`oldCrmId`, `status`);
CREATE INDEX `PortalUser_phone_idx` ON `PortalUser`(`phone`);
CREATE INDEX `PortalStudentProfile_passportNumber_idx` ON `PortalStudentProfile`(`passportNumber`);
CREATE INDEX `PortalStudentProfile_altPhone_idx` ON `PortalStudentProfile`(`altPhone`);
CREATE INDEX `PortalStudentProfile_fullName_idx` ON `PortalStudentProfile`(`fullName`);
