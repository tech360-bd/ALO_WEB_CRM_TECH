-- CreateTable: Virtual Editor site-wide & CRM managed content
-- (backing store for navigation, footer, SEO defaults, announcements,
--  banners, CRM labels, CRM templates, CRM widgets; revision-tracked
--  via CmsRevision.entityType = 'cmsManagedContent' — the CmsRevision
--  table itself is created by 20261002020000_cms_revisions, which
--  precedes this migration)

CREATE TABLE `CmsManagedContent` (
    `id` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL DEFAULT '',
    `section` VARCHAR(191) NOT NULL DEFAULT '',
    `label` VARCHAR(191) NOT NULL DEFAULT '',
    `data` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `publishedAt` DATETIME(3) NULL,
    `publishedBy` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `CmsManagedContent_contentType_status_sortOrder_idx` ON `CmsManagedContent`(`contentType`, `status`, `sortOrder`);
CREATE INDEX `CmsManagedContent_contentType_key_idx` ON `CmsManagedContent`(`contentType`, `key`);
