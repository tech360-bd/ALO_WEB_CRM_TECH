/**
 * ALO Education — AI Infrastructure
 * Task ID: 7-ai-gateway
 *
 * Barrel export for all AI modules.
 * These modules are SERVER-SIDE ONLY — do not import in client components.
 */

// Types
export type {
  ProviderType,
  RequestPriority,
  AutomationClass,
  ChatMessage,
  AiGatewayRequest,
  AiGatewayResponse,
  RateLimiterConfig,
  RateLimitResult,
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerSnapshot,
  ModelRoute,
  ToolRiskLevel,
  ToolContext,
  ToolResult,
  ToolDefinition,
  OrchestrationRequest,
  OrchestrationResult,
  SafetyLimits,
  AgentRecord,
  AutomationPolicy,
  AutomationEvaluation,
  MemoryContextType,
  MemoryEntry,
} from './types';

export { priorityWeight, priorityToInt } from './types';

// Rate Limiter
export { RateLimiter, aiRateLimiter } from './rate-limiter';

// Circuit Breaker
export { CircuitBreaker, groqCircuitBreaker } from './circuit-breaker';

// AI Gateway
export { aiGateway } from './gateway';

// Model Router
export { modelRouter } from './model-router';
export type { ResolvedRoute } from './model-router';

// Tool Gateway
export { registerTool, getTool, listTools, executeTool, executeTools } from './tool-gateway';

// Orchestrator
export { orchestrate } from './orchestrator';

// Automation Engine
export { automationEngine } from './automation-engine';

// Memory
export { memoryStore } from './memory';

// Event Router
export { eventRouter } from './event-router';
export type { EventType, BusinessEvent, AiTaskDefinition } from './event-router';

// Task Processor
export { taskProcessor } from './task-processor';

// Persistent Memory
export { persistentMemory } from './persistent-memory';
