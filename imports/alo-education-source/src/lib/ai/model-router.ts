/**
 * ALO Education — Model Router
 * Task ID: 7-ai-gateway
 *
 * Routes requests to the appropriate provider and model
 * based on task type or explicit overrides.
 *
 * All routes currently point to Groq with llama-3.3-70b-versatile.
 * The fallback model provides resilience.
 */

import type { ProviderType, ModelRoute } from './types';

// ============================================================
// ROUTE TABLE
// ============================================================

const FALLBACK_MODEL = 'llama-3.1-8b-instant';

const routes: ModelRoute[] = [
  {
    taskType: 'classification',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    fallbackProvider: 'groq',
    fallbackModel: FALLBACK_MODEL,
  },
  {
    taskType: 'generation',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    fallbackProvider: 'groq',
    fallbackModel: FALLBACK_MODEL,
  },
  {
    taskType: 'summarization',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    fallbackProvider: 'groq',
    fallbackModel: FALLBACK_MODEL,
  },
  {
    taskType: 'chat',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    fallbackProvider: 'groq',
    fallbackModel: FALLBACK_MODEL,
  },
  {
    taskType: 'complex_reasoning',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    fallbackProvider: 'groq',
    fallbackModel: FALLBACK_MODEL,
  },
  {
    taskType: 'realtime',
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    fallbackProvider: 'groq',
    fallbackModel: FALLBACK_MODEL,
  },
];

/** Default route for unmatched task types */
const DEFAULT_ROUTE: ModelRoute = {
  taskType: 'default',
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  fallbackProvider: 'groq',
  fallbackModel: FALLBACK_MODEL,
};

// ============================================================
// RESOLVED ROUTE (what the gateway actually uses)
// ============================================================

/** A fully resolved provider + model pair with fallback */
export interface ResolvedRoute {
  provider: ProviderType;
  model: string;
  fallbackProvider: ProviderType | undefined;
  fallbackModel: string | undefined;
}

// ============================================================
// ROUTER
// ============================================================

class ModelRouter {
  private routeMap: Map<string, ModelRoute>;

  constructor() {
    this.routeMap = new Map();
    for (const route of routes) {
      this.routeMap.set(route.taskType, route);
    }
  }

  /**
   * Resolve the final provider + model for a request.
   *
   * Priority:
   * 1. Explicit `provider` + `model` from the request
   * 2. Route lookup by `taskType` (if the caller provides it — not in
   *    AiGatewayRequest directly, so we rely on the orchestrator to
   *    set model/provider explicitly)
   * 3. Default route
   */
  resolve(
    explicitProvider?: ProviderType,
    explicitModel?: string
  ): ResolvedRoute {
    // If both explicitly set, use them directly
    if (explicitProvider && explicitModel) {
      const route = this.routeMap.get('default') ?? DEFAULT_ROUTE;
      return {
        provider: explicitProvider,
        model: explicitModel,
        fallbackProvider: route.fallbackProvider,
        fallbackModel: route.fallbackModel,
      };
    }

    // If only model is set, assume groq
    if (explicitModel) {
      const route = this.routeMap.get('default') ?? DEFAULT_ROUTE;
      return {
        provider: 'groq',
        model: explicitModel,
        fallbackProvider: route.fallbackProvider,
        fallbackModel: route.fallbackModel,
      };
    }

    // Default route
    return {
      provider: DEFAULT_ROUTE.provider,
      model: DEFAULT_ROUTE.model,
      fallbackProvider: DEFAULT_ROUTE.fallbackProvider,
      fallbackModel: DEFAULT_ROUTE.fallbackModel,
    };
  }

  /**
   * Resolve by task type (used by orchestrator before calling gateway).
   */
  resolveByTaskType(taskType: string): ModelRoute {
    return this.routeMap.get(taskType) ?? DEFAULT_ROUTE;
  }

  /** List all registered routes */
  listRoutes(): ModelRoute[] {
    return [...this.routeMap.values(), DEFAULT_ROUTE];
  }
}

/** Singleton model router instance */
export const modelRouter = new ModelRouter();
