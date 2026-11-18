-- Align the Super Admin AI workforce tables created by
-- 20261114020000_super_admin_ai_command_center with the Prisma schema.
--
-- The original migration used LONGTEXT for several ordinary String fields,
-- used FLOAT for Prisma Float (DOUBLE in MySQL), and omitted defaults on
-- defaulted TEXT fields. This forward-only migration preserves migration
-- history while making the installed schema match schema.prisma. Existing
-- values are retained; strict MySQL mode will fail rather than silently
-- truncate any value that cannot fit the declared VARCHAR/TEXT size.

ALTER TABLE `AgentRelationship`
  MODIFY COLUMN `permissions` VARCHAR(191) NOT NULL DEFAULT '[]';

ALTER TABLE `AuditEvent`
  MODIFY COLUMN `failureReason` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY COLUMN `escalationReason` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY COLUMN `metadata` TEXT NOT NULL DEFAULT (_utf8mb4'{}');

ALTER TABLE `ComplianceCheck`
  MODIFY COLUMN `violationDetail` TEXT NOT NULL;

ALTER TABLE `DCCAssessment`
  MODIFY COLUMN `sopCoverage` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `knowledgeCoverage` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `skillCoverage` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `testPassRate` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `kpiAchievement` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `securityCompliance` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `auditCompliance` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `selfRecoverySuccess` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `humanEscalationRate` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `overallScore` DOUBLE NOT NULL DEFAULT 0;

ALTER TABLE `GovernanceAction`
  MODIFY COLUMN `reason` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY COLUMN `impactAssessment` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `LoopAgent`
  MODIFY COLUMN `purpose` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY COLUMN `expectedKpi` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `requiredSkills` VARCHAR(191) NOT NULL DEFAULT '[]',
  MODIFY COLUMN `requiredKnowledge` VARCHAR(191) NOT NULL DEFAULT '[]',
  MODIFY COLUMN `requiredTools` VARCHAR(191) NOT NULL DEFAULT '[]',
  MODIFY COLUMN `securityPolicy` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `MCPTool`
  MODIFY COLUMN `description` VARCHAR(191) NOT NULL DEFAULT '',
  MODIFY COLUMN `permissions` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `allowedAgents` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `allowedDepartments` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `securityPolicy` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `Plan`
  MODIFY COLUMN `objective` TEXT NOT NULL,
  MODIFY COLUMN `tasksJson` TEXT NOT NULL DEFAULT (_utf8mb4'[]');

ALTER TABLE `RAGCollection`
  MODIFY COLUMN `allowedAgentIds` VARCHAR(191) NOT NULL DEFAULT '[]',
  MODIFY COLUMN `allowedDeptIds` VARCHAR(191) NOT NULL DEFAULT '[]';

ALTER TABLE `Reflection`
  MODIFY COLUMN `outputQuality` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `sopCompliance` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `ruleCompliance` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `kpiAchieved` DOUBLE NOT NULL DEFAULT 0,
  MODIFY COLUMN `mistakesIdentified` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `improvements` TEXT NOT NULL DEFAULT (_utf8mb4'[]');

ALTER TABLE `SecurityPolicy`
  MODIFY COLUMN `permissions` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `dataAccessScope` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `toolAccessScope` TEXT NOT NULL DEFAULT (_utf8mb4'[]'),
  MODIFY COLUMN `constraints` TEXT NOT NULL DEFAULT (_utf8mb4'{}');
