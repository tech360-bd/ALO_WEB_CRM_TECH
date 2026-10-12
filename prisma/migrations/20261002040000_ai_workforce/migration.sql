-- ═══════════════════════════════════════════════════════════════════════════
-- ALO AI WORKFORCE (AWF) — agent registry, versions, skills, tool registry,
-- grants, workflows, runs/telemetry, approvals, scoped memory, knowledge,
-- audit, idempotent events, tests, model runtimes and the automation ledger.
--
-- Additive only: this migration creates 23 new tables. It does not alter,
-- rename, truncate or drop any existing table, and it does not touch the CRM,
-- authentication or RBAC schema.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE `AwfDepartment` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfDepartment_slug_key`(`slug`),
    INDEX `AwfDepartment_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfAgent` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `departmentId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'SPECIALIST',
    `purpose` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `currentVersionId` VARCHAR(191) NULL,
    `activeVersionId` VARCHAR(191) NULL,
    `latestVersionNo` INTEGER NOT NULL DEFAULT 0,
    `ownerUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `allowedRoles` TEXT NOT NULL DEFAULT (_utf8mb4'["SUPER_ADMIN","ADMIN"]'),
    `isProtected` BOOLEAN NOT NULL DEFAULT false,
    `lastRunAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfAgent_slug_key`(`slug`),
    INDEX `AwfAgent_status_idx`(`status`),
    INDEX `AwfAgent_departmentId_idx`(`departmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfAgentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `versionNo` INTEGER NOT NULL,
    `config` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `systemInstructions` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),
    `capabilities` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `tools` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `skills` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `modelPolicy` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `memoryPolicy` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `fallbackPolicy` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `approvalPolicy` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `securityPolicy` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `permissions` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `outputSchema` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `changeReason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `configHash` VARCHAR(191) NOT NULL DEFAULT '',
    `state` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `validationReport` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `testReport` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `approvedById` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `deployedById` VARCHAR(191) NOT NULL DEFAULT '',
    `deployedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AwfAgentVersion_agentId_versionNo_key`(`agentId`, `versionNo`),
    INDEX `AwfAgentVersion_state_idx`(`state`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfPromptVersion` (
    `id` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `agentSlug` VARCHAR(191) NOT NULL,
    `previousText` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),
    `newText` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),
    `reason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `authorId` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedById` VARCHAR(191) NOT NULL DEFAULT '',
    `approvedAt` DATETIME(3) NULL,
    `testPassed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfPromptVersion_agentSlug_idx`(`agentSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfSkill` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `handlerKey` VARCHAR(191) NOT NULL DEFAULT '',
    `inputSchema` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `outputSchema` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `permission` VARCHAR(191) NOT NULL DEFAULT 'SKILL_READ',
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `testsPassed` INTEGER NOT NULL DEFAULT 0,
    `testsTotal` INTEGER NOT NULL DEFAULT 0,
    `lastTestedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfSkill_slug_key`(`slug`),
    INDEX `AwfSkill_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfSkillGrant` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `skillId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `grantedById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AwfSkillGrant_agentId_skillId_key`(`agentId`, `skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfTool` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `handlerKey` VARCHAR(191) NOT NULL DEFAULT '',
    `category` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `inputSchema` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `outputSchema` TEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `permission` VARCHAR(191) NOT NULL DEFAULT 'TOOL_READ',
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    `requiresApproval` BOOLEAN NOT NULL DEFAULT false,
    `timeoutMs` INTEGER NOT NULL DEFAULT 15000,
    `rateLimitPerMin` INTEGER NOT NULL DEFAULT 60,
    `auditPolicy` VARCHAR(191) NOT NULL DEFAULT 'ALWAYS',
    `securityClass` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `mutates` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfTool_slug_key`(`slug`),
    INDEX `AwfTool_status_idx`(`status`),
    INDEX `AwfTool_riskLevel_idx`(`riskLevel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfToolGrant` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NOT NULL,
    `permission` VARCHAR(191) NOT NULL DEFAULT 'TOOL_READ',
    `approvalRequired` BOOLEAN NOT NULL DEFAULT false,
    `maxCallsPerRun` INTEGER NOT NULL DEFAULT 10,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `grantedById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfToolGrant_agentId_toolId_key`(`agentId`, `toolId`),
    INDEX `AwfToolGrant_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfWorkflow` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `departmentId` VARCHAR(191) NULL,
    `triggerType` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `triggerEvent` VARCHAR(191) NOT NULL DEFAULT '',
    `definition` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `version` INTEGER NOT NULL DEFAULT 1,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `eligible` BOOLEAN NOT NULL DEFAULT true,
    `timeoutMs` INTEGER NOT NULL DEFAULT 120000,
    `maxRetries` INTEGER NOT NULL DEFAULT 2,
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfWorkflow_slug_key`(`slug`),
    INDEX `AwfWorkflow_status_idx`(`status`),
    INDEX `AwfWorkflow_triggerEvent_idx`(`triggerEvent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfRun` (
    `id` VARCHAR(191) NOT NULL,
    `runCode` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NULL,
    `versionId` VARCHAR(191) NULL,
    `workflowId` VARCHAR(191) NULL,
    `workflowSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `parentRunId` VARCHAR(191) NULL,
    `trigger` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `triggerEventId` VARCHAR(191) NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'PRODUCTION',
    `actorUserId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `runtimeKey` VARCHAR(191) NOT NULL DEFAULT '',
    `provider` VARCHAR(191) NOT NULL DEFAULT '',
    `model` VARCHAR(191) NOT NULL DEFAULT '',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'QUEUED',
    `toolCallCount` INTEGER NOT NULL DEFAULT 0,
    `fallbackUsed` BOOLEAN NOT NULL DEFAULT false,
    `fallbackChain` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
    `retryCount` INTEGER NOT NULL DEFAULT 0,
    `approvalRequired` BOOLEAN NOT NULL DEFAULT false,
    `errorCategory` VARCHAR(191) NOT NULL DEFAULT '',
    `errorMessage` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `automationMode` VARCHAR(191) NOT NULL DEFAULT 'AUTOMATED',
    `automationCategory` VARCHAR(191) NOT NULL DEFAULT 'ELIGIBLE_ROUTINE',
    `humanIntervened` BOOLEAN NOT NULL DEFAULT false,
    `input` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `output` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `correlationId` VARCHAR(191) NOT NULL DEFAULT '',
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AwfRun_runCode_key`(`runCode`),
    UNIQUE INDEX `AwfRun_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AwfRun_status_idx`(`status`),
    INDEX `AwfRun_agentId_idx`(`agentId`),
    INDEX `AwfRun_workflowSlug_idx`(`workflowSlug`),
    INDEX `AwfRun_mode_idx`(`mode`),
    INDEX `AwfRun_createdAt_idx`(`createdAt`),
    INDEX `AwfRun_automationMode_idx`(`automationMode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfRunStep` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `stepIndex` INTEGER NOT NULL DEFAULT 0,
    `stepKey` VARCHAR(191) NOT NULL DEFAULT '',
    `stepType` VARCHAR(191) NOT NULL DEFAULT 'SKILL',
    `refSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `input` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `output` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `note` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `errorMessage` TEXT NOT NULL DEFAULT (_utf8mb4''),

    INDEX `AwfRunStep_runId_idx`(`runId`),
    INDEX `AwfRunStep_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfToolCall` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `toolId` VARCHAR(191) NULL,
    `toolSlug` VARCHAR(191) NOT NULL,
    `stepId` VARCHAR(191) NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'PRODUCTION',
    `status` VARCHAR(191) NOT NULL DEFAULT 'REQUESTED',
    `decision` VARCHAR(191) NOT NULL DEFAULT '',
    `args` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `result` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `errorMessage` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `approvalId` VARCHAR(191) NULL,
    `mutationCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfToolCall_runId_idx`(`runId`),
    INDEX `AwfToolCall_toolSlug_idx`(`toolSlug`),
    INDEX `AwfToolCall_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfApproval` (
    `id` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NULL,
    `agentSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `toolSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `riskLevel` VARCHAR(191) NOT NULL DEFAULT 'HIGH',
    `reason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `payload` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `requestedById` VARCHAR(191) NOT NULL DEFAULT '',
    `requestedByAgent` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `decidedById` VARCHAR(191) NOT NULL DEFAULT '',
    `decidedAt` DATETIME(3) NULL,
    `decisionNote` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `consumedAt` DATETIME(3) NULL,
    `consumedRunId` VARCHAR(191) NOT NULL DEFAULT '',
    `resultSummary` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfApproval_status_idx`(`status`),
    INDEX `AwfApproval_agentSlug_idx`(`agentSlug`),
    INDEX `AwfApproval_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfMemory` (
    `id` VARCHAR(191) NOT NULL,
    `scope` VARCHAR(191) NOT NULL,
    `ownerKey` VARCHAR(191) NOT NULL,
    `agentSlug` VARCHAR(191) NOT NULL DEFAULT '',
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),
    `confidentiality` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `approvedById` VARCHAR(191) NOT NULL DEFAULT '',
    `sourceRunId` VARCHAR(191) NOT NULL DEFAULT '',
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfMemory_scope_ownerKey_key_key`(`scope`, `ownerKey`, `key`),
    INDEX `AwfMemory_scope_idx`(`scope`),
    INDEX `AwfMemory_agentSlug_idx`(`agentSlug`),
    INDEX `AwfMemory_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfKnowledgeSource` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `sourceType` VARCHAR(191) NOT NULL DEFAULT 'DOCUMENT',
    `sourceUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `confidentiality` VARCHAR(191) NOT NULL DEFAULT 'INTERNAL',
    `allowedRoles` TEXT NOT NULL DEFAULT (_utf8mb4'["SUPER_ADMIN","ADMIN"]'),
    `version` INTEGER NOT NULL DEFAULT 1,
    `freshnessAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfKnowledgeSource_slug_key`(`slug`),
    INDEX `AwfKnowledgeSource_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfKnowledgeChunk` (
    `id` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `chunkIndex` INTEGER NOT NULL DEFAULT 0,
    `content` LONGTEXT NOT NULL DEFAULT (_utf8mb4''),
    `tokens` INTEGER NOT NULL DEFAULT 0,
    `termIndex` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `citation` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfKnowledgeChunk_sourceId_idx`(`sourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NOT NULL DEFAULT '',
    `actorRole` VARCHAR(191) NOT NULL DEFAULT '',
    `action` VARCHAR(191) NOT NULL,
    `objectType` VARCHAR(191) NOT NULL DEFAULT '',
    `objectId` VARCHAR(191) NOT NULL DEFAULT '',
    `before` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `after` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `result` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
    `reason` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `correlationId` VARCHAR(191) NOT NULL DEFAULT '',
    `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfAuditLog_action_idx`(`action`),
    INDEX `AwfAuditLog_objectType_objectId_idx`(`objectType`, `objectId`),
    INDEX `AwfAuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfEvent` (
    `id` VARCHAR(191) NOT NULL,
    `eventKey` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT '',
    `payload` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT 'RECEIVED',
    `runId` VARCHAR(191) NOT NULL DEFAULT '',
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AwfEvent_eventKey_key`(`eventKey`),
    INDEX `AwfEvent_eventType_idx`(`eventType`),
    INDEX `AwfEvent_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfTestCase` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `input` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `expectation` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `critical` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
    `createdById` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AwfTestCase_agentId_idx`(`agentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfTestResult` (
    `id` VARCHAR(191) NOT NULL,
    `testCaseId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL DEFAULT '',
    `runId` VARCHAR(191) NOT NULL DEFAULT '',
    `passed` BOOLEAN NOT NULL DEFAULT false,
    `details` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfTestResult_testCaseId_idx`(`testCaseId`),
    INDEX `AwfTestResult_versionId_idx`(`versionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfModelRuntime` (
    `id` VARCHAR(191) NOT NULL,
    `runtimeKey` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `provider` VARCHAR(191) NOT NULL DEFAULT 'deterministic',
    `model` VARCHAR(191) NOT NULL DEFAULT '',
    `endpoint` VARCHAR(191) NOT NULL DEFAULT '',
    `tier` INTEGER NOT NULL DEFAULT 1,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'DETERMINISTIC',
    `contextTokens` INTEGER NOT NULL DEFAULT 8192,
    `maxConcurrency` INTEGER NOT NULL DEFAULT 2,
    `requiresApiKey` BOOLEAN NOT NULL DEFAULT false,
    `isPaidService` BOOLEAN NOT NULL DEFAULT false,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `status` VARCHAR(191) NOT NULL DEFAULT 'UNKNOWN',
    `lastCheckedAt` DATETIME(3) NULL,
    `lastLatencyMs` INTEGER NOT NULL DEFAULT 0,
    `avgLatencyMs` INTEGER NOT NULL DEFAULT 0,
    `successCount` INTEGER NOT NULL DEFAULT 0,
    `failureCount` INTEGER NOT NULL DEFAULT 0,
    `consecutiveFailures` INTEGER NOT NULL DEFAULT 0,
    `queueDepth` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `notes` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfModelRuntime_runtimeKey_key`(`runtimeKey`),
    INDEX `AwfModelRuntime_tier_idx`(`tier`),
    INDEX `AwfModelRuntime_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfImprovementProposal` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `proposedBy` VARCHAR(191) NOT NULL DEFAULT '',
    `runId` VARCHAR(191) NOT NULL DEFAULT '',
    `title` VARCHAR(191) NOT NULL,
    `rationale` TEXT NOT NULL DEFAULT (_utf8mb4''),
    `diff` LONGTEXT NOT NULL DEFAULT (_utf8mb4'{}'),
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `reviewedById` VARCHAR(191) NOT NULL DEFAULT '',
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AwfImprovementProposal_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AwfTaskLedger` (
    `id` VARCHAR(191) NOT NULL,
    `ledgerKey` VARCHAR(191) NOT NULL,
    `workflowSlug` VARCHAR(191) NOT NULL,
    `department` VARCHAR(191) NOT NULL DEFAULT '',
    `entityType` VARCHAR(191) NOT NULL DEFAULT '',
    `entityId` VARCHAR(191) NOT NULL DEFAULT '',
    `eligible` BOOLEAN NOT NULL DEFAULT true,
    `outcome` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `runId` VARCHAR(191) NOT NULL DEFAULT '',
    `humanTouches` INTEGER NOT NULL DEFAULT 0,
    `durationMs` INTEGER NOT NULL DEFAULT 0,
    `substantive` BOOLEAN NOT NULL DEFAULT true,
    `evidenceId` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AwfTaskLedger_ledgerKey_key`(`ledgerKey`),
    INDEX `AwfTaskLedger_workflowSlug_idx`(`workflowSlug`),
    INDEX `AwfTaskLedger_outcome_idx`(`outcome`),
    INDEX `AwfTaskLedger_eligible_idx`(`eligible`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
