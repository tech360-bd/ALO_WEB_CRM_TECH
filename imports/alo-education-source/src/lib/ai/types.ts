/**
 * ALO Education — AI Module Shared Types
 * Task ID: 7-ai-gateway
 *
 * All type definitions used across the AI infrastructure.
 * Server-side only — never import these in client components.
 */

// ============================================================
// PROVIDER TYPES
// ============================================================

/** Supported AI provider backends */
export type ProviderType = 'groq' | 'local' | 'fallback';

/** Request priority levels for the queue */
export type RequestPriority = 'low' | 'normal' | 'high' | 'critical';

/** Automation classification for a task */
export type AutomationClass =
  | 'AI_AUTOMATABLE'
  | 'AI_ASSISTED'
  | 'HUMAN_REQUIRED'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'ESCALATED';

// ============================================================
// GATEWAY REQUEST / RESPONSE
// ============================================================

/** Single message in a conversation */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Incoming request to the AI Gateway */
export interface AiGatewayRequest {
  messages: ChatMessage[];
  model?: string;
  provider?: ProviderType;
  priority?: RequestPriority;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  agentId?: string;
  taskId?: string;
}

/** Response from the AI Gateway */
export interface AiGatewayResponse {
  success: boolean;
  content: string | null;
  error: string | null;
  provider: ProviderType;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

// ============================================================
// RATE LIMITER
// ============================================================

/** Configuration for the sliding-window rate limiter */
export interface RateLimiterConfig {
  maxRequestsPerMinute: number;
  maxConcurrent: number;
}

/** Result of a rate-limit check */
export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
}

// ============================================================
// CIRCUIT BREAKER
// ============================================================

/** Circuit breaker states */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Circuit breaker configuration */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

/** Circuit breaker snapshot for monitoring */
export interface CircuitBreakerSnapshot {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  lastError: string | null;
}

// ============================================================
// MODEL ROUTER
// ============================================================

/** A single route mapping task types to models/providers */
export interface ModelRoute {
  taskType: string;
  provider: ProviderType;
  model: string;
  fallbackProvider?: ProviderType;
  fallbackModel?: string;
}

// ============================================================
// TOOL GATEWAY
// ============================================================

/** Risk level for a tool */
export type ToolRiskLevel = 'low' | 'medium' | 'high';

/** Context passed to every tool handler */
export interface ToolContext {
  agentId?: string;
  userId?: string;
  taskId?: string;
}

/** Result returned by a tool handler */
export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/** Definition of a tool that agents can invoke */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  /** Handler function executed when the tool is called */
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
  requiredPermissions?: string[];
  riskLevel?: ToolRiskLevel;
}

// ============================================================
// ORCHESTRATOR
// ============================================================

/** Incoming request to the orchestrator */
export interface OrchestrationRequest {
  taskType: string;
  input: Record<string, unknown>;
  departmentCode?: string;
  agentCode?: string;
  priority?: RequestPriority;
  requiresApproval?: boolean;
  automationClass?: AutomationClass;
  userId?: string;
  /** If provided, reuse this existing AiTask instead of creating a new one (avoids duplicates from task-processor) */
  existingTaskId?: string;
}

/** Result of orchestration execution */
export interface OrchestrationResult {
  success: boolean;
  taskId: string;
  status: string;
 result: unknown;
 error?: string;
 requiresApproval: boolean;
 approvalStatus?: string;
 confidence?: number;
  latencyMs: number;
 stepsExecuted: number;
 tokensUsed: number;
 provider: ProviderType;
  model: string;
}

/** Safety limits enforced per orchestration */
export interface SafetyLimits {
  maxSteps: number;
  maxRuntimeMs: number;
  maxToolCalls: number;
  maxTokens: number;
  maxRetries: number;
  maxDepth: number;
}

/** Agent record loaded from DB */
export interface AgentRecord {
  id: string;
  name: string;
  code: string;
  department: string;
  departmentId: string;
  systemPrompt: string;
  model: string;
  skills: string[];
  tools: string[];
  allowedTools: string[];
  allowedAgents: string[];
  safetyMaxSteps: number;
  safetyMaxRuntimeMs: number;
  safetyMaxToolCalls: number;
  safetyMaxRetries: number;
  safetyMaxTokens: number;
  approvalPolicy: string;
  modelPolicy: string;
}

// ============================================================
// AUTOMATION ENGINE
// ============================================================

/** Policy governing automation decisions */
export interface AutomationPolicy {
  taskType: string;
  automationClass: AutomationClass;
  confidenceThreshold: number;
  approvalRequired: boolean;
  maxRetries: number;
  timeoutMs: number;
}

/** Evaluation result from the automation engine */
export interface AutomationEvaluation {
  taskType: string;
  automationClass: AutomationClass;
  canAutomate: boolean;
  requiresApproval: boolean;
  reason: string;
}

// ============================================================
// MEMORY
// ============================================================

/** Memory context types */
export type MemoryContextType =
  | 'conversation'
  | 'student'
  | 'lead'
  | 'agent'
  | 'task';

/** A single memory entry */
export interface MemoryEntry {
  key: string;
  value: string;
  contextType: MemoryContextType;
  contextId: string;
  createdAt: number;
  expiresAt: number | null;
}

// ============================================================
// PRIORITY HELPERS
// ============================================================

/** Numeric weight for queue sorting (higher = processed first) */
export function priorityWeight(priority: RequestPriority): number {
  switch (priority) {
    case 'critical': return 40;
    case 'high': return 30;
    case 'normal': return 20;
    case 'low': return 10;
  }
}

/** Map a priority string to a 1-10 integer for AiTask.priority */
export function priorityToInt(priority: RequestPriority): number {
  switch (priority) {
    case 'critical': return 1;
    case 'high': return 3;
    case 'normal': return 5;
    case 'low': return 8;
  }
}
