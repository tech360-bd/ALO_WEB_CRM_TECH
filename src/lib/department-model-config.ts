// ============================================================
// ALO Department → Model Configuration (Controlled Rollout)
// One Department → One Configured AI Model → Tests → Verification → Approval → Activation
// This file is the single source of truth for department-to-model assignment.
// Only one department is configured at a time during controlled rollout.
// Never silently fall back to a different provider/model.
// Secrets are never logged or exposed; report only configured/not configured.
// ============================================================

export type PrivacyClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
export type ProviderName = 'groq' | 'openrouter' | 'zai' | 'local' | 'fallback';

export interface DepartmentModelConfig {
  departmentSlug: string;
  departmentName: string;
  category: string;
  description: string;

  // Model assignment (exactly one primary)
  primary: {
    provider: ProviderName;
    model: string; // e.g., groq:llama-3.1-8b-instant
    endpoint: string; // e.g., https://api.groq.com/openai/v1/chat/completions
    maxTokens: number;
    temperature: number;
    timeoutMs: number;
    // Explicit privacy classification for this department's data
    privacy: PrivacyClassification;
    // Whether fallback is allowed and to what
    allowFallback: boolean;
    fallback?: { provider: ProviderName; model: string; reason: string };
    // Tolls
    tokenBudget: number; // max tokens per task
    maxToolCalls: number;
    maxSteps: number;
  };

  // Credentials (names only, never values)
  requiredEnvVars: string[]; // e.g., ['GROQ_API_KEY']

  // Department capabilities (must be verified)
  skills: string[]; // expected skill names/substrings
  prompts: string[]; // expected prompt templates
  sops: string[]; // expected SOP titles
  tools: string[]; // allowed toolIds
  permissions: string[]; // required PortalPermission module:feature:action
  escalation: {
    toHuman: string; // role or email
    slaMinutes: number;
    approvalRequiredFor: string[]; // e.g., ['PUBLISH', 'EXTERNAL_SEND']
  };

  // Rollout metadata
  rollout: {
    status: 'IDLE' | 'BLOCKED' | 'NEEDS_MANUAL_REVIEW' | 'READY_FOR_APPROVAL' | 'ACTIVE';
    configuredAt?: string;
    configuredBy?: string;
    lastVerifiedAt?: string;
    notes?: string;
  };
}

// ------------------------------------------------------------------
// Controlled rollout: exactly ONE department is configured at a time.
// Current rollout target: SEO Optimization (slug: seo)
// Reason: low privacy risk (PUBLIC data, web research, no PII), well-tested
// SEO tasks are University Research / Keyword research / Content optimization
// which map to COMPLEX_TASKS but we explicitly pin to groq fast model
// to keep cost low and latency fast for first rollout.
// Future expansion: add one entry per department as they pass gates, but
// never configure or activate a second department in this rollout.
// ------------------------------------------------------------------

export const DEPARTMENT_MODEL_CONFIGS: Record<string, DepartmentModelConfig> = {
  // FIRST ROLLOUT — SEO Optimization
  seo: {
    departmentSlug: 'seo',
    departmentName: 'SEO Optimization',
    category: 'Marketing & Sales',
    description: 'Search engine optimization, keyword research, technical SEO, link building, and rank tracking',
    primary: {
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      endpoint: 'https://api.groq.com/openai/v1/chat/completions',
      maxTokens: 2000,
      temperature: 0.3,
      timeoutMs: 15000,
      privacy: 'PUBLIC',
      allowFallback: false, // no silent fallback for first rollout — explicit failure is safer
      tokenBudget: 12000,
      maxToolCalls: 8,
      maxSteps: 12,
    },
    requiredEnvVars: ['GROQ_API_KEY'],
    skills: [
      'SEO Analysis',
      'Keyword Research',
      'Content Generation',
      'Hashtag Optimization',
      'Campaign ROI Analysis',
    ],
    prompts: [
      'SEO Analysis',
      'Hashtag suggestion',
      'Campaign ROI Analysis',
      'Knowledge base query',
    ],
    sops: [
      'SOP: Search engine optimization',
      'SOP: Always mark uncertain data as',
    ],
    tools: [
      'web-search', // via molx-firecrawl-client webSearch
      'web-scrape',
      'seo-analyzer',
    ],
    permissions: [
      'marketing:seo:view',
      'marketing:seo:manage',
    ],
    escalation: {
      toHuman: 'SUPER_ADMIN',
      slaMinutes: 60,
      approvalRequiredFor: ['PUBLISH', 'EXTERNAL_SEND', 'CONTENT_PUBLISH'],
    },
    rollout: {
      status: 'IDLE', // default; will be computed via activation gates
      notes: 'First controlled rollout — SEO only. Other departments remain IDLE/BLOCKED until gates pass.',
    },
  },
  // All other departments are intentionally NOT configured in this rollout.
  // They will be added one-by-one after SEO is ACTIVE AND VERIFIED.
};

// ------------------------------------------------------------------
// Helpers (auditable, no code duplication)
// ------------------------------------------------------------------

/**
 * Get config for a department. Returns null if not configured (IDLE).
 * Never throws; caller decides how to handle missing config.
 */
export function getDepartmentModelConfig(slug: string): DepartmentModelConfig | null {
  const normalized = slug.toLowerCase().trim();
  return DEPARTMENT_MODEL_CONFIGS[normalized] || null;
}

/**
 * Check if a department is the currently configured rollout target.
 * Only one should be configured at a time.
 */
export function isConfiguredDepartment(slug: string): boolean {
  return !!getDepartmentModelConfig(slug);
}

/**
 * Report whether required env vars are configured (bool only, never values).
 * For activation gate 3.
 */
export function checkCredentialsConfigured(config: DepartmentModelConfig): {
  configured: boolean;
  missing: string[];
  report: Record<string, 'configured' | 'missing'>;
} {
  const report: Record<string, 'configured' | 'missing'> = {};
  const missing: string[] = [];
  for (const envName of config.requiredEnvVars) {
    const val = process.env[envName];
    const ok = !!val && val.length >= 10; // at least 10 chars
    report[envName] = ok ? 'configured' : 'missing';
    if (!ok) missing.push(envName);
  }
  return { configured: missing.length === 0, missing, report };
}

/**
 * Validate that model assignment is explicit and auditable.
 * Ensures no silent fallback when not allowed, and privacy compliance.
 */
export function validateModelAssignment(
  config: DepartmentModelConfig,
  requestedProvider?: string,
  requestedModel?: string
): { ok: boolean; reason: string } {
  const provider = requestedProvider || config.primary.provider;
  const model = requestedModel || config.primary.model;
  const isPrimary = provider === config.primary.provider && model === config.primary.model;
  const isFallback = config.primary.allowFallback && config.primary.fallback &&
    provider === config.primary.fallback.provider && model === config.primary.fallback.model;
  if (!isPrimary && !isFallback) return { ok: false, reason: 'Provider/model pair is not allowed unless explicitly configured' };
  if ((config.primary.privacy === 'RESTRICTED' || config.primary.privacy === 'CONFIDENTIAL') && provider !== 'local') {
    return { ok: false, reason: `Privacy ${config.primary.privacy} requires the actual provider to be local` };
  }
  return { ok: true, reason: 'Model assignment valid' };
}

/**
 * Redacted report for logging/API (never secrets).
 */
export function getRedactedConfigReport(slug: string): {
  departmentSlug: string;
  departmentName: string;
  primary: { provider: string; model: string; endpoint: string; privacy: string; allowFallback: boolean };
  credentials: Record<string, 'configured' | 'missing'>;
  configured: boolean;
} | null {
  const cfg = getDepartmentModelConfig(slug);
  if (!cfg) return null;
  const cred = checkCredentialsConfigured(cfg);
  return {
    departmentSlug: cfg.departmentSlug,
    departmentName: cfg.departmentName,
    primary: {
      provider: cfg.primary.provider,
      model: cfg.primary.model,
      endpoint: cfg.primary.endpoint,
      privacy: cfg.primary.privacy,
      allowFallback: cfg.primary.allowFallback,
    },
    credentials: cred.report,
    configured: cred.configured,
  };
}

/**
 * List all configured departments (should be exactly 1 during controlled rollout).
 */
export function listConfiguredDepartments(): DepartmentModelConfig[] {
  return Object.values(DEPARTMENT_MODEL_CONFIGS);
}
