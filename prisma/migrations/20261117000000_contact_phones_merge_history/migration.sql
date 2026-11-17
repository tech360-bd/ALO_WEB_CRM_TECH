-- =============================================================================
-- Contact registry extensions (spec 2026-11-16): secondary contact numbers +
-- merge history. Additive only; no existing column is altered or dropped.
-- =============================================================================

CREATE TABLE `ContactPhone` (
  `id`              VARCHAR(191) NOT NULL,
  `contactId`       VARCHAR(191) NOT NULL,
  `phone`           VARCHAR(191) NOT NULL,
  `normalizedPhone` VARCHAR(191) NOT NULL,
  `label`           VARCHAR(191) NOT NULL DEFAULT 'ALTERNATIVE',
  `isPrimary`       TINYINT(1)   NOT NULL DEFAULT 0,
  `isWhatsApp`      TINYINT(1)   NOT NULL DEFAULT 0,
  `source`          VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
  `createdBy`       VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ContactPhone_contactId_normalizedPhone_key` (`contactId`, `normalizedPhone`),
  KEY `ContactPhone_normalizedPhone_idx` (`normalizedPhone`),
  KEY `ContactPhone_contactId_idx` (`contactId`),
  CONSTRAINT `ContactPhone_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `WhatsAppContact` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ContactMergeHistory` (
  `id`                     VARCHAR(191) NOT NULL,
  `destinationContactId`   VARCHAR(191) NOT NULL,
  `sourceContactId`        VARCHAR(191) NOT NULL,
  `destinationPhone`       VARCHAR(191) NOT NULL DEFAULT '',
  `sourcePhone`            VARCHAR(191) NOT NULL DEFAULT '',
  `mergedById`             VARCHAR(191) NOT NULL DEFAULT '',
  `mergedByRole`           VARCHAR(191) NOT NULL DEFAULT '',
  `preservedGoogleAliases` VARCHAR(191) NOT NULL DEFAULT '[]',
  `mergeReason`            VARCHAR(191) NOT NULL DEFAULT '',
  `mergeAuditId`           VARCHAR(191) NOT NULL DEFAULT '',
  `mergedAt`               DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ContactMergeHistory_destinationContactId_idx` (`destinationContactId`),
  KEY `ContactMergeHistory_sourceContactId_idx` (`sourceContactId`),
  KEY `ContactMergeHistory_mergedAt_idx` (`mergedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
