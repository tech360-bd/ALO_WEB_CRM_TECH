/**
 * ALO AI Workforce — shared types.
 *
 * Everything in this module is ALO-owned orchestration vocabulary. Inference
 * engines (self-hosted open-source models) plug in underneath via
 * `ModelRuntimeKind`; they never define agents, permissions or workflows.
 */

export const AGENT_STATUSES = [
  'DRAFT',
  'VALIDATED',
  'TESTED',
  'APPROVED',
  'ACTIVE',
  'PAUSED',
  'DISABLED',
  'ARCHIVED',
] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const VERSION_STATES = [
  'DRAFT',
  'VALIDATED',
  'VALIDATION_FAILED',
  'TESTED',
  'TEST_FAILED',
  'APPROVED',
  'DEPLOYED',
  'ROLLED_BACK',
  'ARCHIVED',
] as const;
export type VersionState = (typeof VERSION_STATES)[number];

export const RUN_MODES = ['PRODUCTION', 'SIMULATION', 'TEST'] as const;
export type RunMode = (typeof RUN_MODES)[number];

export const RUN_STATUSES = [
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'AWAITING_APPROVAL',
  'ESCALATED',
  'CANCELLED',
  'TIMED_OUT',
] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const TOOL_PERMISSIONS = [
  'TOOL_READ',
  'TOOL_WRITE',
  'TOOL_EXTERNAL_SEND',
  'TOOL_FINANCE',
  'TOOL_ADMIN',
] as const;
export type ToolPermission = (typeof TOOL_PERMISSIONS)[number];

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const MEMORY_SCOPES = ['SHORT_TERM', 'LONG_TERM', 'COMPANY', 'DEPARTMENT', 'USER'] as const;
export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const CONFIDENTIALITY = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const;
export type Confidentiality = (typeof CONFIDENTIALITY)[number];

export const AUTOMATION_MODES = [
  'AUTOMATED',
  'AI_ASSISTED',
  'PENDING_APPROVAL',
  'HUMAN',
  'ESCALATED',
  'NOT_ELIGIBLE',
] as const;
export type AutomationMode = (typeof AUTOMATION_MODES)[number];

export const AUTOMATION_CATEGORIES = ['ELIGIBLE_ROUTINE', 'HUMAN_REQUIRED', 'SAFETY_APPROVAL'] as const;
export type AutomationCategory = (typeof AUTOMATION_CATEGORIES)[number];

export const HEALTH_STATUSES = ['HEALTHY', 'DEGRADED', 'OFFLINE', 'BLOCKED', 'DISABLED', 'UNKNOWN'] as const;
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

/** How a runtime produces output. */
export type ModelRuntimeKind = 'DETERMINISTIC' | 'LOCAL_LLM' | 'OPTIONAL_CLOUD_LLM';

export const ALO_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'COUNSELOR',
  'EMPLOYEE',
  'PARTNER',
  'STUDENT',
] as const;
export type AloRole = (typeof ALO_ROLES)[number];

export interface ActorContext {
  userId: string;
  role: AloRole;
  email?: string;
  departmentSlug?: string;
  /** Row scope: a student actor may only ever see their own entity ids. */
  scopedEntityIds?: string[];
  ipAddress?: string;
}

export interface GatewayRequest {
  /** Logical task the agent is performing; drives routing and validation. */
  task: string;
  instructions: string;
  input: Record<string, unknown>;
  /** Facts retrieved by ALO tools/knowledge; the only ground truth a runtime may use. */
  context?: Record<string, unknown>;
  outputSchemaKey?: string;
  correlationId: string;
  agentSlug?: string;
  runId?: string;
  maxTokens?: number;
  timeoutMs?: number;
  /** Confidential payloads must never leave self-hosted infrastructure. */
  confidential?: boolean;
  preferredRuntime?: string;
}

export interface GatewayAttempt {
  runtimeKey: string;
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
  errorCategory?: string;
}

export interface GatewayResult {
  data: Record<string, unknown>;
  runtimeKey: string;
  provider: string;
  model: string;
  kind: ModelRuntimeKind;
  latencyMs: number;
  fallbackUsed: boolean;
  attempts: GatewayAttempt[];
  correlationId: string;
  /** True when the output was produced by ALO deterministic business logic. */
  deterministic: boolean;
}

export interface ToolExecutionContext {
  actor: ActorContext;
  agentSlug: string;
  runId: string;
  mode: RunMode;
  correlationId: string;
  /** Approval id that authorises this specific action, when required. */
  approvalId?: string;
  idempotencyKey?: string;
}

export interface ToolResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  /** Writes the tool WOULD perform, recorded instead of executed in SIMULATION. */
  proposedMutations?: ProposedMutation[];
  mutationCount?: number;
}

export interface ProposedMutation {
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'NOTIFY' | 'EXTERNAL';
  entity: string;
  entityId?: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface SkillResult {
  ok: boolean;
  output: Record<string, unknown>;
  evidence: Record<string, unknown>;
  error?: string;
  /** Business-meaningful work actually completed (drives automation measurement). */
  substantive: boolean;
  humanReviewRequired?: boolean;
}
