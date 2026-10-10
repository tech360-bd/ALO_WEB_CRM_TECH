-- Procurement, asset management and AI model registry (2026-10-01).
-- Generated from prisma/schema.prisma via:
--   prisma migrate diff --from-schema-datamodel <previous> --to-schema-datamodel prisma/schema.prisma --script
-- Additive only: creates 12 new tables (Vendor, PurchaseRequest(+Line),
-- PurchaseOrder(+Line), VendorInvoice, FixedAsset, AssetAssignment,
-- AssetMaintenance, DepreciationEntry, AiModel, AiModelVersion,
-- AiModelEvaluation, AiModelDeployment, AiModelDepartmentAssignment).
-- No existing table is altered, no data is rewritten.
-- CreateTable
CREATE TABLE `Vendor` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NOT NULL DEFAULT '',
    `taxId` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    `email` VARCHAR(191) NOT NULL DEFAULT '',
    `phone` VARCHAR(191) NOT NULL DEFAULT '',
    `address` VARCHAR(191) NOT NULL DEFAULT '',
    `country` VARCHAR(191) NOT NULL DEFAULT 'Bangladesh',
    `paymentTerms` VARCHAR(191) NOT NULL DEFAULT 'NET-30',
    `bankDetails` VARCHAR(191) NOT NULL DEFAULT '',
    `rating` DOUBLE NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vendor_code_key`(`code`),
    INDEX `Vendor_status_idx`(`status`),
    INDEX `Vendor_category_idx`(`category`),
    INDEX `Vendor_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseRequest` (
    `id` VARCHAR(191) NOT NULL,
    `prNumber` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `requestedById` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL DEFAULT '',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `amount` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `neededBy` DATETIME(3) NULL,
    `decidedById` VARCHAR(191) NULL,
    `decidedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `convertedPoId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PurchaseRequest_prNumber_key`(`prNumber`),
    INDEX `PurchaseRequest_status_idx`(`status`),
    INDEX `PurchaseRequest_requestedById_idx`(`requestedById`),
    INDEX `PurchaseRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseRequestLine` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` INTEGER NOT NULL DEFAULT 0,
    `amount` INTEGER NOT NULL DEFAULT 0,

    INDEX `PurchaseRequestLine_requestId_idx`(`requestId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrder` (
    `id` VARCHAR(191) NOT NULL,
    `poNumber` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `orderDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expectedDelivery` DATETIME(3) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `subtotal` INTEGER NOT NULL DEFAULT 0,
    `taxTotal` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `approvedById` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `journalEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PurchaseOrder_poNumber_key`(`poNumber`),
    UNIQUE INDEX `PurchaseOrder_requestId_key`(`requestId`),
    INDEX `PurchaseOrder_vendorId_idx`(`vendorId`),
    INDEX `PurchaseOrder_status_idx`(`status`),
    INDEX `PurchaseOrder_orderDate_idx`(`orderDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PurchaseOrderLine` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitPrice` INTEGER NOT NULL DEFAULT 0,
    `amount` INTEGER NOT NULL DEFAULT 0,
    `receivedQuantity` INTEGER NOT NULL DEFAULT 0,

    INDEX `PurchaseOrderLine_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VendorInvoice` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceNumber` VARCHAR(191) NOT NULL,
    `vendorId` VARCHAR(191) NOT NULL,
    `poId` VARCHAR(191) NULL,
    `invoiceDate` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `subtotal` INTEGER NOT NULL DEFAULT 0,
    `taxTotal` INTEGER NOT NULL DEFAULT 0,
    `total` INTEGER NOT NULL DEFAULT 0,
    `amountPaid` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RECEIVED',
    `matchedById` VARCHAR(191) NULL,
    `matchedAt` DATETIME(3) NULL,
    `disputeReason` VARCHAR(191) NOT NULL DEFAULT '',
    `journalEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VendorInvoice_status_idx`(`status`),
    INDEX `VendorInvoice_poId_idx`(`poId`),
    INDEX `VendorInvoice_invoiceDate_idx`(`invoiceDate`),
    UNIQUE INDEX `VendorInvoice_vendorId_invoiceNumber_key`(`vendorId`, `invoiceNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FixedAsset` (
    `id` VARCHAR(191) NOT NULL,
    `assetTag` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL DEFAULT 'IT',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `serialNumber` VARCHAR(191) NOT NULL DEFAULT '',
    `purchaseDate` DATETIME(3) NOT NULL,
    `purchaseCost` INTEGER NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'BDT',
    `salvageValue` INTEGER NOT NULL DEFAULT 0,
    `usefulLifeMonths` INTEGER NOT NULL DEFAULT 36,
    `vendorId` VARCHAR(191) NULL,
    `location` VARCHAR(191) NOT NULL DEFAULT '',
    `departmentId` VARCHAR(191) NOT NULL DEFAULT '',
    `assignedToId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_STORAGE',
    `disposalDate` DATETIME(3) NULL,
    `disposalAmount` INTEGER NULL,
    `accumulatedDepreciation` INTEGER NOT NULL DEFAULT 0,
    `notes` VARCHAR(191) NOT NULL DEFAULT '',
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FixedAsset_assetTag_key`(`assetTag`),
    INDEX `FixedAsset_status_idx`(`status`),
    INDEX `FixedAsset_category_idx`(`category`),
    INDEX `FixedAsset_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `assignedToId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `returnedAt` DATETIME(3) NULL,
    `conditionOut` VARCHAR(191) NOT NULL DEFAULT 'GOOD',
    `conditionIn` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NOT NULL DEFAULT '',

    INDEX `AssetAssignment_assetId_idx`(`assetId`),
    INDEX `AssetAssignment_assignedToId_idx`(`assignedToId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssetMaintenance` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `maintenanceDate` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'PREVENTIVE',
    `cost` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `performedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `nextDueAt` DATETIME(3) NULL,

    INDEX `AssetMaintenance_assetId_idx`(`assetId`),
    INDEX `AssetMaintenance_nextDueAt_idx`(`nextDueAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DepreciationEntry` (
    `id` VARCHAR(191) NOT NULL,
    `assetId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `depreciationAmount` INTEGER NOT NULL,
    `accumulatedAfter` INTEGER NOT NULL,
    `journalEntryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DepreciationEntry_period_idx`(`period`),
    UNIQUE INDEX `DepreciationEntry_assetId_period_key`(`assetId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModel` (
    `id` VARCHAR(191) NOT NULL,
    `modelCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `taskType` VARCHAR(191) NOT NULL DEFAULT 'general',
    `description` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'REGISTERED',
    `currentVersionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiModel_modelCode_key`(`modelCode`),
    INDEX `AiModel_status_idx`(`status`),
    INDEX `AiModel_taskType_idx`(`taskType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModelVersion` (
    `id` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `adapterType` VARCHAR(191) NOT NULL DEFAULT 'PROMPT',
    `baseModel` VARCHAR(191) NOT NULL DEFAULT '',
    `datasetVersion` VARCHAR(191) NOT NULL DEFAULT '',
    `trainingNotes` VARCHAR(191) NOT NULL DEFAULT '',
    `artifactRef` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiModelVersion_status_idx`(`status`),
    UNIQUE INDEX `AiModelVersion_modelId_version_key`(`modelId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModelEvaluation` (
    `id` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `benchmark` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `datasetVersion` VARCHAR(191) NOT NULL DEFAULT '',
    `passed` BOOLEAN NOT NULL DEFAULT false,
    `details` VARCHAR(191) NOT NULL DEFAULT '{}',
    `evaluatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiModelEvaluation_versionId_idx`(`versionId`),
    INDEX `AiModelEvaluation_benchmark_idx`(`benchmark`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModelDeployment` (
    `id` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `environment` VARCHAR(191) NOT NULL DEFAULT 'STAGING',
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `activatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `activatedById` VARCHAR(191) NOT NULL,
    `rolledBackAt` DATETIME(3) NULL,
    `rollbackReason` VARCHAR(191) NOT NULL DEFAULT '',
    `notes` VARCHAR(191) NOT NULL DEFAULT '',

    INDEX `AiModelDeployment_versionId_idx`(`versionId`),
    INDEX `AiModelDeployment_environment_status_idx`(`environment`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiModelDepartmentAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `modelId` VARCHAR(191) NOT NULL,
    `departmentId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiModelDepartmentAssignment_departmentId_idx`(`departmentId`),
    UNIQUE INDEX `AiModelDepartmentAssignment_modelId_departmentId_key`(`modelId`, `departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PurchaseRequestLine` ADD CONSTRAINT `PurchaseRequestLine_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `PurchaseRequest`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrder` ADD CONSTRAINT `PurchaseOrder_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrder` ADD CONSTRAINT `PurchaseOrder_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `PurchaseRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PurchaseOrderLine` ADD CONSTRAINT `PurchaseOrderLine_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `PurchaseOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorInvoice` ADD CONSTRAINT `VendorInvoice_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VendorInvoice` ADD CONSTRAINT `VendorInvoice_poId_fkey` FOREIGN KEY (`poId`) REFERENCES `PurchaseOrder`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetAssignment` ADD CONSTRAINT `AssetAssignment_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `FixedAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssetMaintenance` ADD CONSTRAINT `AssetMaintenance_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `FixedAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DepreciationEntry` ADD CONSTRAINT `DepreciationEntry_assetId_fkey` FOREIGN KEY (`assetId`) REFERENCES `FixedAsset`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModelVersion` ADD CONSTRAINT `AiModelVersion_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `AiModel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModelEvaluation` ADD CONSTRAINT `AiModelEvaluation_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `AiModelVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModelDeployment` ADD CONSTRAINT `AiModelDeployment_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `AiModelVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModelDeployment` ADD CONSTRAINT `AiModelDeployment_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `AiModel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiModelDepartmentAssignment` ADD CONSTRAINT `AiModelDepartmentAssignment_modelId_fkey` FOREIGN KEY (`modelId`) REFERENCES `AiModel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

