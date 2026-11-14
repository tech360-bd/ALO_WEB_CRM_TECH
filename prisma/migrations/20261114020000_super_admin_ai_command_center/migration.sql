-- ============================================================================
-- Migration: Super Admin AI Command Center — Enterprise AI Workforce models
-- Task ID: SUPER-ADMIN-AI-COMMAND-CENTER
-- Date: 2026-11-14
-- Branch: feat/super-admin-ai-command-center
-- ============================================================================
-- Adds 13 new tables for enterprise AI governance, certification, and engines:
--   LoopAgent, AgentRelationship, RAGCollection, Plan, Reflection,
--   Certification, DCCAssessment, GovernanceAction, SecurityPolicy,
--   ComplianceCheck, AuditEvent, MCPTool, AgentResourceQuota
--
-- All CREATE TABLE statements use IF NOT EXISTS for idempotency.
-- Rollback: DROP TABLE statements at the bottom (commented out).
-- ============================================================================

CREATE TABLE IF NOT EXISTS `LoopAgent` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `parentAgentId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `purpose` LONGTEXT NOT NULL,
  `specialization` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PROPOSED',
  `depth` INT NOT NULL DEFAULT 2,
  `expectedKpi` FLOAT NOT NULL DEFAULT 0,
  `requiredSkills` LONGTEXT NOT NULL,
  `requiredKnowledge` LONGTEXT NOT NULL,
  `requiredTools` LONGTEXT NOT NULL,
  `securityPolicy` LONGTEXT NOT NULL,
  `sopId` VARCHAR(191) NOT NULL DEFAULT '',
  `testSuiteId` VARCHAR(191) NOT NULL DEFAULT '',
  `budgetTokens` INT NOT NULL DEFAULT 0,
  `budgetCallsPerDay` INT NOT NULL DEFAULT 0,
  `governanceApprovalId` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `LoopAgent_agentId_idx` (`agentId`),
  KEY `LoopAgent_parentAgentId_idx` (`parentAgentId`),
  KEY `LoopAgent_status_idx` (`status`),
  KEY `LoopAgent_depth_idx` (`depth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AgentRelationship` (
  `id` VARCHAR(191) NOT NULL,
  `parentAgentId` VARCHAR(191) NOT NULL,
  `childAgentId` VARCHAR(191) NOT NULL,
  `relationshipType` VARCHAR(191) NOT NULL DEFAULT 'parent_child',
  `permissions` LONGTEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AgentRelationship_parentAgentId_childAgentId_relationshipType_key` (`parentAgentId`, `childAgentId`, `relationshipType`),
  KEY `AgentRelationship_parentAgentId_idx` (`parentAgentId`),
  KEY `AgentRelationship_childAgentId_idx` (`childAgentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RAGCollection` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL DEFAULT '',
  `departmentId` VARCHAR(191) NOT NULL DEFAULT '',
  `sourceType` VARCHAR(191) NOT NULL DEFAULT 'database',
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `documentCount` INT NOT NULL DEFAULT 0,
  `chunkCount` INT NOT NULL DEFAULT 0,
  `embeddingModel` VARCHAR(191) NOT NULL DEFAULT '',
  `freshnessHours` INT NOT NULL DEFAULT 24,
  `accessPolicy` VARCHAR(191) NOT NULL DEFAULT 'DEPARTMENT_SCOPED',
  `allowedAgentIds` LONGTEXT NOT NULL,
  `allowedDeptIds` LONGTEXT NOT NULL,
  `lastRefreshedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `RAGCollection_departmentId_idx` (`departmentId`),
  KEY `RAGCollection_status_idx` (`status`),
  KEY `RAGCollection_sourceType_idx` (`sourceType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Plan` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `departmentId` VARCHAR(191) NOT NULL DEFAULT '',
  `objective` LONGTEXT NOT NULL,
  `objectiveType` VARCHAR(191) NOT NULL DEFAULT 'task',
  `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
  `tasksJson` LONGTEXT NOT NULL,
  `taskCount` INT NOT NULL DEFAULT 0,
  `completedTasks` INT NOT NULL DEFAULT 0,
  `failedTasks` INT NOT NULL DEFAULT 0,
  `replanCount` INT NOT NULL DEFAULT 0,
  `escalationReason` VARCHAR(191) NOT NULL DEFAULT '',
  `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `approvedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Plan_agentId_idx` (`agentId`),
  KEY `Plan_departmentId_idx` (`departmentId`),
  KEY `Plan_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Reflection` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `taskId` VARCHAR(191) NOT NULL DEFAULT '',
  `planId` VARCHAR(191) NOT NULL DEFAULT '',
  `outputQuality` FLOAT NOT NULL DEFAULT 0,
  `sopCompliance` FLOAT NOT NULL DEFAULT 0,
  `ruleCompliance` FLOAT NOT NULL DEFAULT 0,
  `kpiAchieved` FLOAT NOT NULL DEFAULT 0,
  `mistakesIdentified` LONGTEXT NOT NULL,
  `improvements` LONGTEXT NOT NULL,
  `escalatedToHuman` BOOLEAN NOT NULL DEFAULT FALSE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Reflection_agentId_idx` (`agentId`),
  KEY `Reflection_taskId_idx` (`taskId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Certification` (
  `id` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL,
  `targetId` VARCHAR(191) NOT NULL,
  `certificationType` VARCHAR(191) NOT NULL DEFAULT 'DCC',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `validFrom` DATETIME(3) NULL,
  `validUntil` DATETIME(3) NULL,
  `certifiedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `certifiedAt` DATETIME(3) NULL,
  `notes` LONGTEXT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Certification_targetType_targetId_idx` (`targetType`, `targetId`),
  KEY `Certification_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DCCAssessment` (
  `id` VARCHAR(191) NOT NULL,
  `departmentId` VARCHAR(191) NOT NULL,
  `assessmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `sopCoverage` FLOAT NOT NULL DEFAULT 0,
  `knowledgeCoverage` FLOAT NOT NULL DEFAULT 0,
  `skillCoverage` FLOAT NOT NULL DEFAULT 0,
  `testPassRate` FLOAT NOT NULL DEFAULT 0,
  `kpiAchievement` FLOAT NOT NULL DEFAULT 0,
  `securityCompliance` FLOAT NOT NULL DEFAULT 0,
  `auditCompliance` FLOAT NOT NULL DEFAULT 0,
  `selfRecoverySuccess` FLOAT NOT NULL DEFAULT 0,
  `humanEscalationRate` FLOAT NOT NULL DEFAULT 0,
  `overallScore` FLOAT NOT NULL DEFAULT 0,
  `failureReasons` LONGTEXT NOT NULL,
  `assessedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `assessedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `DCCAssessment_departmentId_idx` (`departmentId`),
  KEY `DCCAssessment_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `GovernanceAction` (
  `id` VARCHAR(191) NOT NULL,
  `actionType` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL DEFAULT 'AGENT',
  `targetId` VARCHAR(191) NOT NULL DEFAULT '',
  `requestedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `approvedBy` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `reason` LONGTEXT NOT NULL,
  `impactAssessment` LONGTEXT NOT NULL,
  `approvedAt` DATETIME(3) NULL,
  `executedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `GovernanceAction_actionType_idx` (`actionType`),
  KEY `GovernanceAction_targetType_targetId_idx` (`targetType`, `targetId`),
  KEY `GovernanceAction_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SecurityPolicy` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `policyType` VARCHAR(191) NOT NULL DEFAULT 'RBAC',
  `targetType` VARCHAR(191) NOT NULL DEFAULT 'AGENT',
  `targetId` VARCHAR(191) NOT NULL DEFAULT '',
  `permissions` LONGTEXT NOT NULL,
  `dataAccessScope` LONGTEXT NOT NULL,
  `toolAccessScope` LONGTEXT NOT NULL,
  `constraints` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `version` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `SecurityPolicy_policyType_idx` (`policyType`),
  KEY `SecurityPolicy_targetType_targetId_idx` (`targetType`, `targetId`),
  KEY `SecurityPolicy_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ComplianceCheck` (
  `id` VARCHAR(191) NOT NULL,
  `checkType` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL DEFAULT 'AGENT',
  `targetId` VARCHAR(191) NOT NULL DEFAULT '',
  `status` VARCHAR(191) NOT NULL DEFAULT 'PASS',
  `violationDetail` LONGTEXT NOT NULL,
  `severity` VARCHAR(191) NOT NULL DEFAULT 'LOW',
  `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ComplianceCheck_checkType_idx` (`checkType`),
  KEY `ComplianceCheck_targetType_targetId_idx` (`targetType`, `targetId`),
  KEY `ComplianceCheck_status_idx` (`status`),
  KEY `ComplianceCheck_severity_idx` (`severity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AuditEvent` (
  `id` VARCHAR(191) NOT NULL,
  `actorType` VARCHAR(191) NOT NULL DEFAULT 'HUMAN',
  `actorId` VARCHAR(191) NOT NULL DEFAULT '',
  `action` VARCHAR(191) NOT NULL,
  `targetType` VARCHAR(191) NOT NULL DEFAULT '',
  `targetId` VARCHAR(191) NOT NULL DEFAULT '',
  `agentId` VARCHAR(191) NOT NULL DEFAULT '',
  `modelId` VARCHAR(191) NOT NULL DEFAULT '',
  `promptId` VARCHAR(191) NOT NULL DEFAULT '',
  `skillId` VARCHAR(191) NOT NULL DEFAULT '',
  `sopId` VARCHAR(191) NOT NULL DEFAULT '',
  `ruleId` VARCHAR(191) NOT NULL DEFAULT '',
  `toolId` VARCHAR(191) NOT NULL DEFAULT '',
  `result` VARCHAR(191) NOT NULL DEFAULT 'SUCCESS',
  `approved` BOOLEAN NOT NULL DEFAULT FALSE,
  `failureReason` LONGTEXT NOT NULL,
  `escalationReason` LONGTEXT NOT NULL,
  `ipAddress` VARCHAR(191) NOT NULL DEFAULT '',
  `userAgent` VARCHAR(191) NOT NULL DEFAULT '',
  `metadata` LONGTEXT NOT NULL,
  `hash` VARCHAR(191) NOT NULL DEFAULT '',
  `previousHash` VARCHAR(191) NOT NULL DEFAULT '',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `AuditEvent_actorType_actorId_idx` (`actorType`, `actorId`),
  KEY `AuditEvent_action_idx` (`action`),
  KEY `AuditEvent_targetType_targetId_idx` (`targetType`, `targetId`),
  KEY `AuditEvent_agentId_idx` (`agentId`),
  KEY `AuditEvent_result_idx` (`result`),
  KEY `AuditEvent_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MCPTool` (
  `id` VARCHAR(191) NOT NULL,
  `toolId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` LONGTEXT NOT NULL,
  `owner` VARCHAR(191) NOT NULL DEFAULT '',
  `endpointUrl` VARCHAR(191) NOT NULL DEFAULT '',
  `authType` VARCHAR(191) NOT NULL DEFAULT 'API_KEY',
  `permissions` LONGTEXT NOT NULL,
  `allowedAgents` LONGTEXT NOT NULL,
  `allowedDepartments` LONGTEXT NOT NULL,
  `securityPolicy` LONGTEXT NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
  `lastHealthCheck` DATETIME(3) NULL,
  `consecutiveFailures` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MCPTool_toolId_key` (`toolId`),
  KEY `MCPTool_status_idx` (`status`),
  KEY `MCPTool_owner_idx` (`owner`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AgentResourceQuota` (
  `id` VARCHAR(191) NOT NULL,
  `agentId` VARCHAR(191) NOT NULL,
  `maxConcurrency` INT NOT NULL DEFAULT 5,
  `maxCallsPerHour` INT NOT NULL DEFAULT 100,
  `maxCallsPerDay` INT NOT NULL DEFAULT 1000,
  `maxTokensPerDay` INT NOT NULL DEFAULT 100000,
  `maxMemoryMb` INT NOT NULL DEFAULT 512,
  `maxCpuPercent` INT NOT NULL DEFAULT 25,
  `queuePriority` INT NOT NULL DEFAULT 5,
  `currentConcurrency` INT NOT NULL DEFAULT 0,
  `currentCallsToday` INT NOT NULL DEFAULT 0,
  `currentTokensToday` INT NOT NULL DEFAULT 0,
  `quotaExceeded` BOOLEAN NOT NULL DEFAULT FALSE,
  `lastResetAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AgentResourceQuota_agentId_key` (`agentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ROLLBACK (uncomment to reverse this migration)
-- ============================================================================
-- DROP TABLE IF EXISTS `AgentResourceQuota`;
-- DROP TABLE IF EXISTS `MCPTool`;
-- DROP TABLE IF EXISTS `AuditEvent`;
-- DROP TABLE IF EXISTS `ComplianceCheck`;
-- DROP TABLE IF EXISTS `SecurityPolicy`;
-- DROP TABLE IF EXISTS `GovernanceAction`;
-- DROP TABLE IF EXISTS `DCCAssessment`;
-- DROP TABLE IF EXISTS `Certification`;
-- DROP TABLE IF EXISTS `Reflection`;
-- DROP TABLE IF EXISTS `Plan`;
-- DROP TABLE IF EXISTS `RAGCollection`;
-- DROP TABLE IF EXISTS `AgentRelationship`;
-- DROP TABLE IF EXISTS `LoopAgent`;
