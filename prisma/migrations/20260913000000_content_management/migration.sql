-- ALO Education content management: services, scholarships, resources,
-- FAQs, and polymorphic cross-content relationships.
-- Safe additive migration: no existing table or row is modified.

CREATE TABLE `Service` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `shortDescription` TEXT NOT NULL,
  `description` TEXT NOT NULL,
  `icon` VARCHAR(191) NOT NULL,
  `heroImage` TEXT NULL,
  `content` LONGTEXT NOT NULL,
  `eligibility` TEXT NULL,
  `requirements` LONGTEXT NULL,
  `documents` LONGTEXT NULL,
  `faqEnabled` BOOLEAN NOT NULL DEFAULT true,
  `ctaLabel` VARCHAR(191) NULL,
  `ctaUrl` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `lastVerifiedAt` DATETIME(3) NULL,
  `sourceUrl` TEXT NULL,
  `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Service_slug_key` (`slug`),
  INDEX `Service_status_idx` (`status`),
  INDEX `Service_sortOrder_idx` (`sortOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ServiceFaq` (
  `id` VARCHAR(191) NOT NULL,
  `serviceId` VARCHAR(191) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ServiceFaq_serviceId_idx` (`serviceId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ServiceFaq_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `Service` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Scholarship` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `scholarshipCode` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `countrySlug` VARCHAR(191) NULL,
  `universitySlug` VARCHAR(191) NULL,
  `courseSlug` VARCHAR(191) NULL,
  `studyLevel` VARCHAR(191) NULL,
  `subject` VARCHAR(191) NULL,
  `fundingType` VARCHAR(191) NOT NULL,
  `amount` VARCHAR(191) NULL,
  `currency` VARCHAR(32) NULL,
  `coverage` LONGTEXT NULL,
  `eligibility` LONGTEXT NULL,
  `minimumRequirements` LONGTEXT NULL,
  `documentsRequired` LONGTEXT NULL,
  `applicationMethod` VARCHAR(191) NULL,
  `applicationUrl` TEXT NULL,
  `openingDate` VARCHAR(64) NULL,
  `deadline` VARCHAR(64) NULL,
  `decisionDate` VARCHAR(64) NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
  `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
  `sourceUrl` TEXT NULL,
  `sourceName` VARCHAR(191) NULL,
  `lastVerifiedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Scholarship_slug_key` (`slug`),
  UNIQUE INDEX `Scholarship_scholarshipCode_key` (`scholarshipCode`),
  INDEX `Scholarship_status_idx` (`status`),
  INDEX `Scholarship_countrySlug_idx` (`countrySlug`),
  INDEX `Scholarship_universitySlug_idx` (`universitySlug`),
  INDEX `Scholarship_studyLevel_idx` (`studyLevel`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ScholarshipFaq` (
  `id` VARCHAR(191) NOT NULL,
  `scholarshipId` VARCHAR(191) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ScholarshipFaq_scholarshipId_idx` (`scholarshipId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ScholarshipFaq_scholarshipId_fkey` FOREIGN KEY (`scholarshipId`) REFERENCES `Scholarship` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ResourceCategory` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `icon` VARCHAR(191) NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  UNIQUE INDEX `ResourceCategory_slug_key` (`slug`),
  INDEX `ResourceCategory_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Resource` (
  `id` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `categoryId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `excerpt` TEXT NULL,
  `content` LONGTEXT NOT NULL,
  `authorId` VARCHAR(191) NULL,
  `featuredImage` TEXT NULL,
  `countrySlug` VARCHAR(191) NULL,
  `studyLevel` VARCHAR(191) NULL,
  `readingTime` INTEGER NOT NULL DEFAULT 5,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PUBLISHED',
  `publishedAt` DATETIME(3) NULL,
  `lastVerifiedAt` DATETIME(3) NULL,
  `sourceUrl` TEXT NULL,
  `sourceName` VARCHAR(191) NULL,
  `verificationStatus` VARCHAR(191) NOT NULL DEFAULT 'NEEDS_REVIEW',
  `seoTitle` VARCHAR(191) NULL,
  `seoDescription` TEXT NULL,
  `tags` VARCHAR(191) NOT NULL DEFAULT '[]',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `Resource_slug_key` (`slug`),
  INDEX `Resource_categoryId_idx` (`categoryId`),
  INDEX `Resource_status_idx` (`status`),
  INDEX `Resource_countrySlug_idx` (`countrySlug`),
  INDEX `Resource_publishedAt_idx` (`publishedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `Resource_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ResourceCategory` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ResourceFaq` (
  `id` VARCHAR(191) NOT NULL,
  `resourceId` VARCHAR(191) NOT NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NOT NULL,
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ResourceFaq_resourceId_idx` (`resourceId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `ResourceFaq_resourceId_fkey` FOREIGN KEY (`resourceId`) REFERENCES `Resource` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContentRelationship` (
  `id` VARCHAR(191) NOT NULL,
  `sourceType` VARCHAR(64) NOT NULL,
  `sourceId` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(64) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `relationshipType` VARCHAR(64) NOT NULL DEFAULT 'RELATED',
  `sortOrder` INTEGER NOT NULL DEFAULT 0,
  `status` VARCHAR(64) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ContentRelationship_unique_key` (`sourceType`, `sourceId`, `targetType`, `targetId`, `relationshipType`),
  INDEX `ContentRelationship_source_idx` (`sourceType`, `sourceId`),
  INDEX `ContentRelationship_target_idx` (`targetType`, `targetId`),
  INDEX `ContentRelationship_status_idx` (`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
