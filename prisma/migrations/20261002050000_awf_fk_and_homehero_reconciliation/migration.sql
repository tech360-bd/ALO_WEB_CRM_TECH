-- Corrective reconciliation migration (additive; follows 20261002040000).
--
-- WHY THIS EXISTS
-- 20261002040000_ai_workforce created the 23 Awf* tables without the foreign
-- key constraints that prisma/schema.prisma declares, and 0_init seeded
-- HomeHeroSlide.accentColor with the legacy '#0057B8' default while
-- schema.prisma (and the verified_metrics brand consolidation) settled on the
-- official ALO BLUE '#0B5ED7'. The CI drift gate (prisma migrate diff
-- --from-migrations --to-schema-datamodel against a real MySQL 8.4) correctly
-- reported these 20 statements as REAL drift. Per the production migration
-- policy, already-recorded migrations are never edited in place: this new
-- migration adds exactly the missing pieces, and nothing else.
--
-- The 19 constraint names and referential actions below are derived directly
-- from prisma/schema.prisma relation definitions (required -> RESTRICT,
-- optional -> SET NULL, explicit onDelete: Cascade -> CASCADE) and verified
-- against the drift output they close.
--
-- OPERATOR NOTE (pre-existing production databases only): adding a foreign
-- key validates existing rows. If a production database somehow contains
-- orphaned Awf* rows (impossible when this table family has only ever been
-- written through Prisma Client, which does not need the constraint to keep
-- its own references consistent), this migration aborts instead of corrupting
-- anything. There is no data rewrite, truncation or deletion in any case.

ALTER TABLE `AwfAgent`
    ADD CONSTRAINT `AwfAgent_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `AwfDepartment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `AwfAgentVersion`
    ADD CONSTRAINT `AwfAgentVersion_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AwfAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfPromptVersion`
    ADD CONSTRAINT `AwfPromptVersion_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `AwfAgentVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfSkillGrant`
    ADD CONSTRAINT `AwfSkillGrant_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AwfAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `AwfSkillGrant_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `AwfSkill`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfToolGrant`
    ADD CONSTRAINT `AwfToolGrant_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AwfAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `AwfToolGrant_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `AwfTool`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfWorkflow`
    ADD CONSTRAINT `AwfWorkflow_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `AwfDepartment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AwfRun`
    ADD CONSTRAINT `AwfRun_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AwfAgent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `AwfRun_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `AwfAgentVersion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `AwfRun_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `AwfWorkflow`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AwfRunStep`
    ADD CONSTRAINT `AwfRunStep_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `AwfRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfToolCall`
    ADD CONSTRAINT `AwfToolCall_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `AwfRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `AwfToolCall_toolId_fkey` FOREIGN KEY (`toolId`) REFERENCES `AwfTool`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AwfApproval`
    ADD CONSTRAINT `AwfApproval_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `AwfRun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AwfKnowledgeChunk`
    ADD CONSTRAINT `AwfKnowledgeChunk_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `AwfKnowledgeSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfTestCase`
    ADD CONSTRAINT `AwfTestCase_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AwfAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfTestResult`
    ADD CONSTRAINT `AwfTestResult_testCaseId_fkey` FOREIGN KEY (`testCaseId`) REFERENCES `AwfTestCase`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AwfImprovementProposal`
    ADD CONSTRAINT `AwfImprovementProposal_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `AwfAgent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Brand palette consolidation (part 2): HomeHeroSlide was missed by
-- 20261002000000_verified_metrics, which corrected only `Country`.
-- Column default only; existing rows are untouched.
ALTER TABLE `HomeHeroSlide`
    MODIFY `accentColor` VARCHAR(191) NOT NULL DEFAULT '#0B5ED7';
