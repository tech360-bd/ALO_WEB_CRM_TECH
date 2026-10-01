-- ALO HRMS Enterprise — Complete Employee HR Management System
-- Generated: 2025-09-15 Asia/Dhaka
-- Extends existing CRM without breaking — normalized tables, foreign keys, indexes, soft delete, audit history

-- Alter EmployeeHR to add enterprise personal + employment + compensation fields
ALTER TABLE `EmployeeHR` ADD COLUMN `photo` VARCHAR(191) NOT NULL DEFAULT '' AFTER `personalEmail`;
ALTER TABLE `EmployeeHR` ADD COLUMN `fatherName` VARCHAR(191) NOT NULL DEFAULT '' AFTER `photo`;
ALTER TABLE `EmployeeHR` ADD COLUMN `motherName` VARCHAR(191) NOT NULL DEFAULT '' AFTER `fatherName`;
ALTER TABLE `EmployeeHR` ADD COLUMN `gender` VARCHAR(191) NOT NULL DEFAULT '' AFTER `motherName`;
ALTER TABLE `EmployeeHR` ADD COLUMN `dob` VARCHAR(191) NOT NULL DEFAULT '' AFTER `gender`;
ALTER TABLE `EmployeeHR` ADD COLUMN `nationality` VARCHAR(191) NOT NULL DEFAULT 'Bangladeshi' AFTER `dob`;
ALTER TABLE `EmployeeHR` ADD COLUMN `religion` VARCHAR(191) NOT NULL DEFAULT '' AFTER `nationality`;
ALTER TABLE `EmployeeHR` ADD COLUMN `bloodGroup` VARCHAR(191) NOT NULL DEFAULT '' AFTER `religion`;
ALTER TABLE `EmployeeHR` ADD COLUMN `maritalStatus` VARCHAR(191) NOT NULL DEFAULT '' AFTER `bloodGroup`;
ALTER TABLE `EmployeeHR` ADD COLUMN `nidNumber` VARCHAR(191) NOT NULL DEFAULT '' AFTER `maritalStatus`;
ALTER TABLE `EmployeeHR` ADD COLUMN `passportNumber` VARCHAR(191) NOT NULL DEFAULT '' AFTER `nidNumber`;
ALTER TABLE `EmployeeHR` ADD COLUMN `passportExpiry` VARCHAR(191) NOT NULL DEFAULT '' AFTER `passportNumber`;
ALTER TABLE `EmployeeHR` ADD COLUMN `tinNumber` VARCHAR(191) NOT NULL DEFAULT '' AFTER `passportExpiry`;
ALTER TABLE `EmployeeHR` ADD COLUMN `drivingLicense` VARCHAR(191) NOT NULL DEFAULT '' AFTER `tinNumber`;
ALTER TABLE `EmployeeHR` ADD COLUMN `presentAddress` TEXT NOT NULL AFTER `drivingLicense`;
ALTER TABLE `EmployeeHR` ADD COLUMN `permanentAddress` TEXT NOT NULL AFTER `presentAddress`;
ALTER TABLE `EmployeeHR` ADD COLUMN `emergencyContactName` VARCHAR(191) NOT NULL DEFAULT '' AFTER `permanentAddress`;
ALTER TABLE `EmployeeHR` ADD COLUMN `emergencyContactPhone` VARCHAR(191) NOT NULL DEFAULT '' AFTER `emergencyContactName`;
ALTER TABLE `EmployeeHR` ADD COLUMN `emergencyRelation` VARCHAR(191) NOT NULL DEFAULT '' AFTER `emergencyContactPhone`;
ALTER TABLE `EmployeeHR` ADD COLUMN `bankBranch` VARCHAR(191) NOT NULL DEFAULT '' AFTER `bankName`;
ALTER TABLE `EmployeeHR` ADD COLUMN `bankRouting` VARCHAR(191) NOT NULL DEFAULT '' AFTER `bankBranch`;
ALTER TABLE `EmployeeHR` ADD COLUMN `mobileBankingType` VARCHAR(191) NOT NULL DEFAULT '' AFTER `bankRouting`;
ALTER TABLE `EmployeeHR` ADD COLUMN `mobileBankingNumber` VARCHAR(191) NOT NULL DEFAULT '' AFTER `mobileBankingType`;
ALTER TABLE `EmployeeHR` ADD COLUMN `officeId` VARCHAR(191) NOT NULL DEFAULT '' AFTER `branch`;
ALTER TABLE `EmployeeHR` ADD COLUMN `employeeType` VARCHAR(191) NOT NULL DEFAULT 'PERMANENT' AFTER `employmentType`;
ALTER TABLE `EmployeeHR` ADD COLUMN `employmentStatus` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE' AFTER `employeeType`;
ALTER TABLE `EmployeeHR` ADD COLUMN `confirmationDate` VARCHAR(191) NOT NULL DEFAULT '' AFTER `joiningDate`;
ALTER TABLE `EmployeeHR` ADD COLUMN `probationEndDate` VARCHAR(191) NOT NULL DEFAULT '' AFTER `confirmationDate`;
ALTER TABLE `EmployeeHR` ADD COLUMN `probationMonths` INT NOT NULL DEFAULT 6 AFTER `probationEndDate`;
ALTER TABLE `EmployeeHR` ADD COLUMN `salaryGrade` VARCHAR(191) NOT NULL DEFAULT 'G7' AFTER `probationMonths`;
ALTER TABLE `EmployeeHR` ADD COLUMN `grossSalary` DOUBLE NOT NULL DEFAULT 0 AFTER `salaryGrade`;
ALTER TABLE `EmployeeHR` ADD COLUMN `allowances` DOUBLE NOT NULL DEFAULT 0 AFTER `baseSalary`;
ALTER TABLE `EmployeeHR` ADD COLUMN `houseRent` DOUBLE NOT NULL DEFAULT 0 AFTER `allowances`;
ALTER TABLE `EmployeeHR` ADD COLUMN `medicalAllowance` DOUBLE NOT NULL DEFAULT 0 AFTER `houseRent`;
ALTER TABLE `EmployeeHR` ADD COLUMN `conveyanceAllowance` DOUBLE NOT NULL DEFAULT 0 AFTER `medicalAllowance`;
ALTER TABLE `EmployeeHR` ADD COLUMN `taxDeduction` DOUBLE NOT NULL DEFAULT 0 AFTER `conveyanceAllowance`;
ALTER TABLE `EmployeeHR` ADD COLUMN `pfRate` DOUBLE NOT NULL DEFAULT 8 AFTER `taxDeduction`;
ALTER TABLE `EmployeeHR` ADD COLUMN `insurance` DOUBLE NOT NULL DEFAULT 0 AFTER `pfRate`;
ALTER TABLE `EmployeeHR` ADD COLUMN `workingHours` VARCHAR(191) NOT NULL DEFAULT '9:00 AM - 6:00 PM' AFTER `salaryCurrency`;
ALTER TABLE `EmployeeHR` ADD COLUMN `shift` VARCHAR(191) NOT NULL DEFAULT 'Day' AFTER `workingHours`;
ALTER TABLE `EmployeeHR` ADD COLUMN `weekOff` VARCHAR(191) NOT NULL DEFAULT 'Friday' AFTER `shift`;
ALTER TABLE `EmployeeHR` ADD COLUMN `reportingManagerId` VARCHAR(191) NOT NULL DEFAULT '' AFTER `managerId`;
ALTER TABLE `EmployeeHR` ADD COLUMN `skills` TEXT NOT NULL DEFAULT '[]' AFTER `reportingManagerId`;
ALTER TABLE `EmployeeHR` ADD COLUMN `languages` TEXT NOT NULL DEFAULT '[]' AFTER `skills`;
ALTER TABLE `EmployeeHR` ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false AFTER `languages`;
ALTER TABLE `EmployeeHR` ADD COLUMN `deletedAt` DATETIME(3) NULL AFTER `isDeleted`;
ALTER TABLE `EmployeeHR` ADD COLUMN `deletedBy` VARCHAR(191) NOT NULL DEFAULT '' AFTER `deletedAt`;
ALTER TABLE `EmployeeHR` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `deletedBy`;
CREATE INDEX `EmployeeHR_employeeId_idx` ON `EmployeeHR`(`employeeId`);
CREATE INDEX `EmployeeHR_department_idx` ON `EmployeeHR`(`department`);
CREATE INDEX `EmployeeHR_status_idx` ON `EmployeeHR`(`status`);
CREATE INDEX `EmployeeHR_employmentStatus_idx` ON `EmployeeHR`(`employmentStatus`);

-- Enhance EmployeeAttendance
ALTER TABLE `EmployeeAttendance` ADD COLUMN `clockIn` VARCHAR(191) NOT NULL DEFAULT '' AFTER `checkIn`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `clockOut` VARCHAR(191) NOT NULL DEFAULT '' AFTER `clockIn`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `workingHours` DOUBLE NOT NULL DEFAULT 8 AFTER `clockOut`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `idleTime` DOUBLE NOT NULL DEFAULT 0 AFTER `workingHours`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `lateMinutes` INT NOT NULL DEFAULT 0 AFTER `idleTime`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `isLate` BOOLEAN NOT NULL DEFAULT false AFTER `lateMinutes`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `isHoliday` BOOLEAN NOT NULL DEFAULT false AFTER `isLate`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `leaveId` VARCHAR(191) NOT NULL DEFAULT '' AFTER `isHoliday`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `ipAddress` VARCHAR(191) NOT NULL DEFAULT '' AFTER `leaveId`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `device` VARCHAR(191) NOT NULL DEFAULT '' AFTER `ipAddress`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `isManual` BOOLEAN NOT NULL DEFAULT false AFTER `device`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `approvedBy` VARCHAR(191) NOT NULL DEFAULT '' AFTER `isManual`;
ALTER TABLE `EmployeeAttendance` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) AFTER `createdAt`;
CREATE INDEX `EmployeeAttendance_employeeId_idx` ON `EmployeeAttendance`(`employeeId`);
CREATE INDEX `EmployeeAttendance_date_idx` ON `EmployeeAttendance`(`date`);
CREATE INDEX `EmployeeAttendance_status_idx` ON `EmployeeAttendance`(`status`);

-- Enhance EmployeeLeaveBalance
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `maternityTotal` INT NOT NULL DEFAULT 120 AFTER `medicalRemaining`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `maternityUsed` INT NOT NULL DEFAULT 0 AFTER `maternityTotal`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `maternityRemaining` INT NOT NULL DEFAULT 120 AFTER `maternityUsed`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `paternityTotal` INT NOT NULL DEFAULT 7 AFTER `maternityRemaining`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `paternityUsed` INT NOT NULL DEFAULT 0 AFTER `paternityTotal`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `paternityRemaining` INT NOT NULL DEFAULT 7 AFTER `paternityUsed`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `compOffRemaining` INT NOT NULL DEFAULT 0 AFTER `compOffUsed`;
ALTER TABLE `EmployeeLeaveBalance` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) AFTER `compOffRemaining`;
CREATE INDEX `EmployeeLeaveBalance_employeeId_idx` ON `EmployeeLeaveBalance`(`employeeId`);
CREATE INDEX `EmployeeLeaveBalance_year_idx` ON `EmployeeLeaveBalance`(`year`);

-- Enhance EmployeeDocument
ALTER TABLE `EmployeeDocument` ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT '' AFTER `documentType`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `fileSize` INT NOT NULL DEFAULT 0 AFTER `fileName`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `fileHash` VARCHAR(191) NOT NULL DEFAULT '' AFTER `fileSize`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `mimeType` VARCHAR(191) NOT NULL DEFAULT '' AFTER `fileHash`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `isMandatory` BOOLEAN NOT NULL DEFAULT false AFTER `mimeType`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false AFTER `isMandatory`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `version` INT NOT NULL DEFAULT 1 AFTER `isVerified`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `expiryDate` VARCHAR(191) NOT NULL DEFAULT '' AFTER `version`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `uploadedBy` VARCHAR(191) NOT NULL DEFAULT '' AFTER `expiryDate`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false AFTER `uploadedBy`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `deletedAt` DATETIME(3) NULL AFTER `isDeleted`;
ALTER TABLE `EmployeeDocument` ADD COLUMN `deletedBy` VARCHAR(191) NOT NULL DEFAULT '' AFTER `deletedAt`;
CREATE INDEX `EmployeeDocument_employeeId_idx` ON `EmployeeDocument`(`employeeId`);
CREATE INDEX `EmployeeDocument_documentType_idx` ON `EmployeeDocument`(`documentType`);
CREATE INDEX `EmployeeDocument_isMandatory_idx` ON `EmployeeDocument`(`isMandatory`);
CREATE INDEX `EmployeeDocument_status_idx` ON `EmployeeDocument`(`status`);

-- New normalized HRMS tables
CREATE TABLE `HrmEmployeeExperience` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `company` VARCHAR(191) NOT NULL DEFAULT '',
  `designation` VARCHAR(191) NOT NULL DEFAULT '',
  `fromDate` VARCHAR(191) NOT NULL DEFAULT '',
  `toDate` VARCHAR(191) NOT NULL DEFAULT '',
  `isCurrent` BOOLEAN NOT NULL DEFAULT false,
  `description` TEXT NOT NULL,
  `certificatePath` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmEmployeeExperience_employeeId_idx`(`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmEmployeeSkill` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `level` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
  `category` VARCHAR(191) NOT NULL DEFAULT 'general',
  `verified` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HrmEmployeeSkill_employeeId_name_key`(`employeeId`,`name`),
  INDEX `HrmEmployeeSkill_employeeId_idx`(`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmEmployeeLanguage` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `reading` VARCHAR(191) NOT NULL DEFAULT 'good',
  `writing` VARCHAR(191) NOT NULL DEFAULT 'good',
  `speaking` VARCHAR(191) NOT NULL DEFAULT 'good',
  `overall` VARCHAR(191) NOT NULL DEFAULT 'intermediate',
  `certificatePath` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmEmployeeLanguage_employeeId_idx`(`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmAttendanceHoliday` (
  `id` VARCHAR(191) NOT NULL,
  `date` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL DEFAULT 'public',
  `isHoliday` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HrmAttendanceHoliday_date_key`(`date`),
  INDEX `HrmAttendanceHoliday_date_idx`(`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmPayrollConfig` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `salaryGrade` VARCHAR(191) NOT NULL DEFAULT 'G7',
  `grossSalary` DOUBLE NOT NULL DEFAULT 0,
  `basicPercent` DOUBLE NOT NULL DEFAULT 60,
  `houseRentPercent` DOUBLE NOT NULL DEFAULT 30,
  `medicalPercent` DOUBLE NOT NULL DEFAULT 10,
  `taxSlab` VARCHAR(191) NOT NULL DEFAULT 'general',
  `pfEnabled` BOOLEAN NOT NULL DEFAULT true,
  `pfRate` DOUBLE NOT NULL DEFAULT 8,
  `insuranceAmount` DOUBLE NOT NULL DEFAULT 0,
  `updatedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HrmPayrollConfig_employeeId_key`(`employeeId`),
  INDEX `HrmPayrollConfig_employeeId_idx`(`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmPayrollRun` (
  `id` VARCHAR(191) NOT NULL,
  `monthYear` VARCHAR(191) NOT NULL,
  `totalEmployees` INT NOT NULL DEFAULT 0,
  `totalGross` DOUBLE NOT NULL DEFAULT 0,
  `totalDeductions` DOUBLE NOT NULL DEFAULT 0,
  `totalNet` DOUBLE NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
  `preparedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `reviewedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `paidAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HrmPayrollRun_monthYear_key`(`monthYear`),
  INDEX `HrmPayrollRun_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmNotice` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `noticeType` VARCHAR(191) NOT NULL,
  `noticeDate` VARCHAR(191) NOT NULL,
  `noticePeriodDays` INT NOT NULL DEFAULT 90,
  `lastWorkingDay` VARCHAR(191) NOT NULL,
  `remainingDays` INT NOT NULL DEFAULT 90,
  `reason` TEXT NOT NULL,
  `handoverChecklist` TEXT NOT NULL DEFAULT '[]',
  `assetReturnStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `clearanceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `finalSettlementStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `finalSettlementAmount` DOUBLE NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
  `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmNotice_employeeId_idx`(`employeeId`),
  INDEX `HrmNotice_status_idx`(`status`),
  INDEX `HrmNotice_noticeDate_idx`(`noticeDate`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmExit` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `exitType` VARCHAR(191) NOT NULL,
  `exitDate` VARCHAR(191) NOT NULL,
  `exitInterviewDate` VARCHAR(191) NOT NULL DEFAULT '',
  `exitInterviewNotes` TEXT NOT NULL,
  `exitInterviewConducted` BOOLEAN NOT NULL DEFAULT false,
  `clearanceStatus` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `clearanceChecklist` TEXT NOT NULL DEFAULT '[]',
  `finalSettlement` DOUBLE NOT NULL DEFAULT 0,
  `experienceLetterPath` VARCHAR(191) NOT NULL DEFAULT '',
  `relievingLetterPath` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `HrmExit_employeeId_key`(`employeeId`),
  INDEX `HrmExit_exitType_idx`(`exitType`),
  INDEX `HrmExit_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmDeviceLog` (
  `id` VARCHAR(191) NOT NULL,
  `deviceId` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(191) NOT NULL,
  `condition` VARCHAR(191) NOT NULL DEFAULT 'good',
  `note` VARCHAR(191) NOT NULL DEFAULT '',
  `actedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmDeviceLog_deviceId_idx`(`deviceId`),
  INDEX `HrmDeviceLog_employeeId_idx`(`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmLoginSecurityExtended` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
  `ipAddress` VARCHAR(191) NOT NULL,
  `browser` VARCHAR(191) NOT NULL DEFAULT '',
  `operatingSystem` VARCHAR(191) NOT NULL DEFAULT '',
  `deviceFingerprint` VARCHAR(191) NOT NULL DEFAULT '',
  `device` VARCHAR(191) NOT NULL DEFAULT '',
  `location` VARCHAR(191) NOT NULL DEFAULT '',
  `city` VARCHAR(191) NOT NULL DEFAULT '',
  `country` VARCHAR(191) NOT NULL DEFAULT '',
  `loginAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `logoutAt` DATETIME(3) NULL,
  `success` BOOLEAN NOT NULL DEFAULT true,
  `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
  `sessionId` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmLoginSecurityExtended_userId_idx`(`userId`),
  INDEX `HrmLoginSecurityExtended_employeeId_idx`(`employeeId`),
  INDEX `HrmLoginSecurityExtended_ipAddress_idx`(`ipAddress`),
  INDEX `HrmLoginSecurityExtended_createdAt_idx`(`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmAuditLog` (
  `id` VARCHAR(191) NOT NULL,
  `employeeId` VARCHAR(191) NOT NULL DEFAULT '',
  `actorId` VARCHAR(191) NOT NULL,
  `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
  `action` VARCHAR(191) NOT NULL,
  `entityType` VARCHAR(191) NOT NULL,
  `entityId` VARCHAR(191) NOT NULL DEFAULT '',
  `oldValue` LONGTEXT NOT NULL,
  `newValue` LONGTEXT NOT NULL,
  `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
  `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmAuditLog_employeeId_idx`(`employeeId`),
  INDEX `HrmAuditLog_actorId_idx`(`actorId`),
  INDEX `HrmAuditLog_entityType_entityId_idx`(`entityType`,`entityId`),
  INDEX `HrmAuditLog_action_idx`(`action`),
  INDEX `HrmAuditLog_createdAt_idx`(`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmNotification` (
  `id` VARCHAR(191) NOT NULL,
  `recipientId` VARCHAR(191) NOT NULL,
  `recipientRole` VARCHAR(191) NOT NULL DEFAULT 'EMPLOYEE',
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `category` VARCHAR(191) NOT NULL DEFAULT 'HR',
  `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `actionUrl` VARCHAR(191) NOT NULL DEFAULT '',
  `metadata` TEXT NOT NULL DEFAULT '{}',
  `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmNotification_recipientId_idx`(`recipientId`),
  INDEX `HrmNotification_isRead_idx`(`isRead`),
  INDEX `HrmNotification_category_idx`(`category`),
  INDEX `HrmNotification_createdAt_idx`(`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `HrmHrPolicy` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `version` INT NOT NULL DEFAULT 1,
  `fileUrl` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `createdBy` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `HrmHrPolicy_category_idx`(`category`),
  INDEX `HrmHrPolicy_status_idx`(`status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed mandatory holidays example (Bangladesh)
INSERT INTO `HrmAttendanceHoliday` (`id`, `date`, `title`, `type`) VALUES
('hol_2025_12_16', '2025-12-16', 'Victory Day', 'public'),
('hol_2026_02_21', '2026-02-21', 'Language Martyrs Day', 'public');

-- Audit: HRMS module must be available for every dashboard except Student (enforced at app layer)
