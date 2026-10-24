-- Student interview preparation facts (spec §33/§51/§96).
--
-- Additive: a new table only. No existing table is altered or dropped and no
-- row is touched. Facts are written by the student themselves and are the only
-- source the answer framework may quote; clearing a fact removes it from every
-- generated answer.
CREATE TABLE `StudentInterviewFact` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `reasonUniversity` TEXT NOT NULL,
  `reasonCourse` TEXT NOT NULL,
  `fundingSource` TEXT NOT NULL,
  `futurePlan` TEXT NOT NULL,
  `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `StudentInterviewFact_studentId_key` (`studentId`),
  INDEX `StudentInterviewFact_updatedAt_idx` (`updatedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
