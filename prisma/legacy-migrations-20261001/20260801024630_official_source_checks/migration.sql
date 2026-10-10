-- CreateTable
CREATE TABLE `CrmOfficialSourceCheck` (
    `id` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL DEFAULT '',
    `universityId` VARCHAR(191) NOT NULL DEFAULT '',
    `courseId` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceType` VARCHAR(191) NOT NULL,
    `requestedUrl` VARCHAR(191) NOT NULL,
    `finalUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `httpStatus` INTEGER NOT NULL DEFAULT 0,
    `redirectStatus` VARCHAR(191) NOT NULL DEFAULT '',
    `pageTitle` VARCHAR(191) NOT NULL DEFAULT '',
    `expectedEntity` VARCHAR(191) NOT NULL DEFAULT '',
    `entityMatchStatus` VARCHAR(191) NOT NULL DEFAULT 'NOT_CHECKED',
    `soft404` BOOLEAN NOT NULL DEFAULT false,
    `contentHash` VARCHAR(191) NOT NULL DEFAULT '',
    `checkedAt` VARCHAR(191) NOT NULL DEFAULT '',
    `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
    `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
    `parserVersion` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CrmOfficialSourceCheck_targetType_targetId_idx` ON `CrmOfficialSourceCheck`(`targetType`, `targetId`);

-- CreateIndex
CREATE INDEX `CrmOfficialSourceCheck_universityId_idx` ON `CrmOfficialSourceCheck`(`universityId`);

-- CreateIndex
CREATE INDEX `CrmOfficialSourceCheck_courseId_idx` ON `CrmOfficialSourceCheck`(`courseId`);

-- CreateIndex
CREATE INDEX `CrmOfficialSourceCheck_sourceType_idx` ON `CrmOfficialSourceCheck`(`sourceType`);

-- CreateIndex
CREATE INDEX `CrmOfficialSourceCheck_verificationStatus_idx` ON `CrmOfficialSourceCheck`(`verificationStatus`);

-- CreateIndex
CREATE INDEX `CrmOfficialSourceCheck_contentHash_idx` ON `CrmOfficialSourceCheck`(`contentHash`);
