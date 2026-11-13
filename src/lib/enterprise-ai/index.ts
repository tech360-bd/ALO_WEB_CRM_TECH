/**
 * ALO Education — Enterprise AI Engine Registry
 * Task ID: ENTERPRISE-AI-ENGINES
 *
 * Central registry for all enterprise AI engines. Each engine is a pure
 * module that operates on the existing Prisma models + the new models
 * added in migration 20261114020000_super_admin_ai_command_center.
 *
 * Engines:
 *   1. DCC Engine          — Department Capability Certification
 *   2. Governance Engine   — agent/model/prompt change governance
 *   3. Security Engine     — RBAC/ABAC policy enforcement for AI agents
 *   4. Audit Engine        — tamper-evident audit log
 *   5. Compliance Engine   — continuous compliance monitoring
 *   6. Memory Engine       — short-term / task / agent / department / enterprise memory
 *   7. Planning Engine     — objective → tasks → assign → execute → monitor → replan
 *   8. Reflection Engine   — post-task evaluation + improvement recommendations
 *   9. Self-Healing Engine — detect failures → retry/fallback/restart/escalate
 *  10. Self-Optimization   — monitor metrics → suggest improvements
 *  11. Evaluation Engine   — continuous agent evaluation + test suites
 *  12. RAG Engine          — enterprise retrieval-augmented generation
 *  13. Knowledge Graph     — relationship discovery + impact analysis
 *  14. MCP Registry        — Model Context Protocol tool integration
 *  15. Event Bus           — already exists (src/lib/event-bus.ts)
 *  16. Workflow Engine     — already exists (src/lib/ai-workforce/workflow-engine.ts)
 *
 * Safety rules (spec §4, §45):
 *   - Every AI action passes: identity → RBAC → validation → constitutional
 *     rule → security → SOP → execution policy → audit log
 *   - Destructive operations require explicit Super Admin confirmation
 *   - No uncontrolled recursive agent explosion (max depth configurable)
 *   - Child agents inherit parent permissions but NEVER unrestricted authority
 */

export { DCCEngine } from "./dcc-engine";
export { GovernanceEngine } from "./governance-engine";
export { SecurityEngine } from "./security-engine";
export { AuditEngine } from "./audit-engine";
export { ComplianceEngine } from "./compliance-engine";
export { MemoryEngine } from "./memory-engine";
export { PlanningEngine } from "./planning-engine";
export { ReflectionEngine } from "./reflection-engine";
export { SelfHealingEngine } from "./self-healing-engine";
export { SelfOptimizationEngine } from "./self-optimization-engine";
export { EvaluationEngine } from "./evaluation-engine";
export { RAGEngine } from "./rag-engine";
export { KnowledgeGraphEngine } from "./knowledge-graph-engine";
export { MCPRegistry } from "./mcp-registry";

/** Maximum agent nesting depth (spec §45). Default: MODEL → AGENT → LOOP_AGENT = 2 */
export const MAX_AGENT_DEPTH = 2;

/** DCC certification thresholds (spec §12) */
export const DCC_THRESHOLDS = {
  sopCoverage: 0.95,
  knowledgeCoverage: 0.95,
  skillCoverage: 0.95,
  testPassRate: 0.95,
  kpiAchievement: 0.90,
  securityCompliance: 1.00,
  auditCompliance: 1.00,
  selfRecoverySuccess: 0.90,
  humanEscalationRate: 0.10,
} as const;

/** Agent status values */
export const AGENT_STATUS = {
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  FAILED: "FAILED",
  TRAINING: "TRAINING",
  RETIRED: "RETIRED",
} as const;

/** Certification status values */
export const CERT_STATUS = {
  CERTIFIED: "CERTIFIED",
  CONDITIONALLY_CERTIFIED: "CONDITIONALLY_CERTIFIED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  UNDER_REVIEW: "UNDER_REVIEW",
  PENDING: "PENDING",
} as const;
