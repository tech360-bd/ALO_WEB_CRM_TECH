// ============================================================
// ALO EDUCATION — FEATURE FLAG SERVICE (spec s117)
// ============================================================
// Real, database-backed feature flags with gradual rollout and a
// complete audit trail. This replaces the hard-coded FEATURE_FLAGS
// array that previously only rendered a static list in the super
// admin dashboard (maturity LEVEL 1 -> LEVEL 3).
//
// Design rules:
//  * FAIL CLOSED. An unknown key, a database outage or a corrupt row
//    always evaluates to `false`. A flag can never accidentally turn
//    a risky module ON.
//  * DETERMINISTIC ROLLOUT. Percentage rollouts hash the subject id so
//    the same user always lands on the same side of the boundary — no
//    flickering behaviour between requests.
//  * NEVER INVENTED. Flags are read from the FeatureFlag table. The
//    defaults below are only the bootstrap catalogue used to seed that
//    table; they are not a second source of truth at runtime.
// ============================================================

import { db } from '@/lib/db';

/** Canonical flag keys. Extend here AND seed the table. */
export const FEATURE_FLAG_KEYS = [
  'AI_VISA_AGENT',
  'AI_PARTNER_RISK',
  'AI_LEAD_AGENT',
  'AI_COUNSELOR_COPILOT',
  'AI_DOCUMENT_REVIEW',
  'AI_MANAGEMENT_BRIEFING',
  'WHATSAPP_AUTOMATION',
  'SMS_AUTOMATION',
  'EMAIL_AUTOMATION',
  'B2B_PORTAL',
  'UNIVERSITY_PORTAL',
  'PARENT_GUARDIAN_PORTAL',
  'POST_ARRIVAL',
  'ALUMNI_REFERRAL',
  'OUTBOUND_WEBHOOKS',
  'OPPORTUNITY_GRAPH',
  'APPLICATION_RISK_SCORE',
  'STUDENT_SUCCESS_SCORE',
  'ATTENTION_ENGINE',
  'REALTIME_UPDATES',
  'BULK_IMPORT',
  'MARKETING_AUTOMATION',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

/** Bootstrap catalogue. `enabled` here is the seeded default only. */
export const FEATURE_FLAG_DEFAULTS: Array<{
  key: FeatureFlagKey;
  module: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
}> = [
  { key: 'AI_VISA_AGENT', module: 'AI', description: 'AI visa readiness analysis on real student files (never guarantees approval).', enabled: false, rolloutPercent: 0 },
  { key: 'AI_PARTNER_RISK', module: 'AI', description: 'AI partner risk grading (green/amber/red) from conversion and refusal signals.', enabled: false, rolloutPercent: 0 },
  { key: 'AI_LEAD_AGENT', module: 'AI', description: 'AI lead scoring, temperature and next-action recommendation.', enabled: false, rolloutPercent: 0 },
  { key: 'AI_COUNSELOR_COPILOT', module: 'AI', description: 'Counselor copilot: next step, missing documents, at-risk applications.', enabled: false, rolloutPercent: 0 },
  { key: 'AI_DOCUMENT_REVIEW', module: 'AI', description: 'AI-assisted document pre-checks. Final approval stays with authorized staff.', enabled: false, rolloutPercent: 0 },
  { key: 'AI_MANAGEMENT_BRIEFING', module: 'AI', description: 'Daily management briefing generated from actual database rows.', enabled: false, rolloutPercent: 0 },
  { key: 'WHATSAPP_AUTOMATION', module: 'COMMUNICATION', description: 'Automated WhatsApp reminders and stop-on-reply automation.', enabled: false, rolloutPercent: 0 },
  { key: 'SMS_AUTOMATION', module: 'COMMUNICATION', description: 'Automated transactional SMS sequences.', enabled: false, rolloutPercent: 0 },
  { key: 'EMAIL_AUTOMATION', module: 'COMMUNICATION', description: 'Automated email nurture and reminder sequences.', enabled: false, rolloutPercent: 0 },
  { key: 'B2B_PORTAL', module: 'B2B', description: 'Partner/agent portal: students, applications, commission, training.', enabled: false, rolloutPercent: 0 },
  { key: 'UNIVERSITY_PORTAL', module: 'B2B', description: 'University/institution representative portal with strict tenant isolation.', enabled: false, rolloutPercent: 0 },
  { key: 'PARENT_GUARDIAN_PORTAL', module: 'STUDENT', description: 'Controlled parent/guardian access with explicit consent records.', enabled: false, rolloutPercent: 0 },
  { key: 'POST_ARRIVAL', module: 'STUDENT', description: 'Post-arrival support workflow (bank, SIM, registration, tickets).', enabled: false, rolloutPercent: 0 },
  { key: 'ALUMNI_REFERRAL', module: 'STUDENT', description: 'Alumni and referral programme.', enabled: false, rolloutPercent: 0 },
  { key: 'OUTBOUND_WEBHOOKS', module: 'PLATFORM', description: 'Outbound webhook fan-out of canonical ALO events to subscribers.', enabled: false, rolloutPercent: 0 },
  { key: 'OPPORTUNITY_GRAPH', module: 'PLATFORM', description: 'ALO Opportunity Graph connecting students, courses, scholarships and partners.', enabled: false, rolloutPercent: 0 },
  { key: 'APPLICATION_RISK_SCORE', module: 'PLATFORM', description: 'Per-application GREEN/AMBER/RED risk scoring from real workflow state.', enabled: false, rolloutPercent: 0 },
  { key: 'STUDENT_SUCCESS_SCORE', module: 'PLATFORM', description: 'Operational student support score (not an admission/visa prediction).', enabled: false, rolloutPercent: 0 },
  { key: 'ATTENTION_ENGINE', module: 'PLATFORM', description: '"What needs attention?" engine for management on login.', enabled: false, rolloutPercent: 0 },
  { key: 'REALTIME_UPDATES', module: 'PLATFORM', description: 'Server-sent realtime notification stream.', enabled: false, rolloutPercent: 0 },
  { key: 'BULK_IMPORT', module: 'DATA', description: 'CSV/Excel bulk import with validation, duplicate detection and rollback.', enabled: false, rolloutPercent: 0 },
  { key: 'MARKETING_AUTOMATION', module: 'MARKETING', description: 'Campaign automation journeys with stop conditions.', enabled: false, rolloutPercent: 0 },
];

export type FlagEnvironment = 'all' | 'production' | 'staging' | 'development';

export interface FlagEvaluationContext {
  userId?: string | null;
  roles?: string[] | null;
  environment?: string | null;
}

export interface FlagEvaluation {
  key: string;
  enabled: boolean;
  reason: string;
  source: 'database' | 'disabled-fallback';
}

const parseJsonArray = (raw: unknown): string[] => {
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const parseJsonObject = (raw: unknown): Record<string, unknown> => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

/** FNV-1a 32-bit. Stable across processes, unlike Math.random or Date. */
function stableHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic bucket 0..99 for a subject within a flag. */
export function rolloutBucket(key: string, subjectId: string): number {
  return stableHash(`${key}::${subjectId}`) % 100;
}

function currentEnvironment(): string {
  return process.env.APP_ENV || process.env.NODE_ENV || 'development';
}

function environmentMatches(flagEnv: string, actual: string): boolean {
  const normalized = (flagEnv || 'all').toLowerCase();
  if (normalized === 'all' || normalized === '') return true;
  return normalized === String(actual || '').toLowerCase();
}

/**
 * Evaluate a single flag. Never throws: any failure resolves to disabled
 * with an explicit reason so callers can log "NOT CONFIGURED" rather than
 * silently assuming a module is live (spec s93/s94).
 */
export async function evaluateFlag(
  key: string,
  context: FlagEvaluationContext = {},
): Promise<FlagEvaluation> {
  const environment = context.environment || currentEnvironment();
  try {
    const flag = await db.featureFlag.findUnique({ where: { key } });
    if (!flag) {
      return { key, enabled: false, reason: 'FLAG_NOT_CONFIGURED', source: 'disabled-fallback' };
    }
    if (flag.status !== 'ACTIVE') {
      return { key, enabled: false, reason: `FLAG_STATUS_${flag.status}`, source: 'database' };
    }
    if (!environmentMatches(flag.environment, environment)) {
      return { key, enabled: false, reason: 'ENVIRONMENT_MISMATCH', source: 'database' };
    }
    if (!flag.enabled) {
      return { key, enabled: false, reason: 'DISABLED', source: 'database' };
    }

    const denyUserIds = parseJsonArray(flag.denyUserIds);
    const userId = context.userId || '';
    if (userId && denyUserIds.includes(userId)) {
      return { key, enabled: false, reason: 'USER_DENYLISTED', source: 'database' };
    }

    const allowUserIds = parseJsonArray(flag.allowUserIds);
    if (userId && allowUserIds.includes(userId)) {
      return { key, enabled: true, reason: 'USER_ALLOWLISTED', source: 'database' };
    }

    const allowRoles = parseJsonArray(flag.allowRoles);
    const roles = context.roles || [];
    if (allowRoles.length > 0 && !roles.some((role) => allowRoles.includes(role))) {
      return { key, enabled: false, reason: 'ROLE_NOT_ALLOWED', source: 'database' };
    }

    const percent = Math.max(0, Math.min(100, Number(flag.rolloutPercent) || 0));
    if (percent >= 100) {
      return { key, enabled: true, reason: 'ROLLOUT_100', source: 'database' };
    }
    if (percent <= 0) {
      return { key, enabled: false, reason: 'ROLLOUT_0', source: 'database' };
    }
    if (!userId) {
      // A percentage rollout needs a stable subject. Without one we cannot
      // guarantee deterministic behaviour, so fail closed.
      return { key, enabled: false, reason: 'ROLLOUT_NEEDS_SUBJECT', source: 'disabled-fallback' };
    }
    const inRollout = rolloutBucket(key, userId) < percent;
    return {
      key,
      enabled: inRollout,
      reason: inRollout ? `ROLLOUT_${percent}_IN` : `ROLLOUT_${percent}_OUT`,
      source: 'database',
    };
  } catch (error) {
    return {
      key,
      enabled: false,
      reason: `EVALUATION_ERROR:${error instanceof Error ? error.message : 'unknown'}`,
      source: 'disabled-fallback',
    };
  }
}

/** Convenience boolean check. */
export async function isFeatureEnabled(
  key: string,
  context: FlagEvaluationContext = {},
): Promise<boolean> {
  const evaluation = await evaluateFlag(key, context);
  return evaluation.enabled;
}

/** Evaluate many flags in one round trip (used by portals on load). */
export async function evaluateFlags(
  keys: string[],
  context: FlagEvaluationContext = {},
): Promise<Record<string, FlagEvaluation>> {
  const uniqueKeys = Array.from(new Set(keys));
  const results = await Promise.all(uniqueKeys.map((key) => evaluateFlag(key, context)));
  return results.reduce<Record<string, FlagEvaluation>>((acc, evaluation) => {
    acc[evaluation.key] = evaluation;
    return acc;
  }, {});
}

/** Read the persisted config blob for a flag. Returns {} when absent. */
export async function getFlagConfig(key: string): Promise<Record<string, unknown>> {
  try {
    const flag = await db.featureFlag.findUnique({ where: { key } });
    return flag ? parseJsonObject(flag.config) : {};
  } catch {
    return {};
  }
}

// ============================================================
// Seeding — idempotent. Never overwrites an operator's decision.
// ============================================================
export interface SeedFlagsResult {
  created: string[];
  skipped: string[];
}

export async function ensureDefaultFlags(): Promise<SeedFlagsResult> {
  const created: string[] = [];
  const skipped: string[] = [];
  for (const flag of FEATURE_FLAG_DEFAULTS) {
    const existing = await db.featureFlag.findUnique({ where: { key: flag.key } });
    if (existing) {
      skipped.push(flag.key);
      continue;
    }
    await db.featureFlag.create({
      data: {
        key: flag.key,
        module: flag.module,
        description: flag.description,
        // Bootstrap catalogue ships DISABLED. An operator must consciously
        // enable a module; nothing turns on by itself after a deploy.
        enabled: false,
        rolloutPercent: 0,
        environment: 'all',
        status: 'ACTIVE',
        createdBy: 'system:bootstrap',
        updatedBy: 'system:bootstrap',
      },
    });
    created.push(flag.key);
  }
  return { created, skipped };
}

// ============================================================
// Mutations — every change writes an audit row (spec s65)
// ============================================================
export interface FlagActor {
  id?: string | null;
  email?: string | null;
}

export interface UpdateFlagInput {
  enabled?: boolean;
  rolloutPercent?: number;
  allowRoles?: string[];
  allowUserIds?: string[];
  denyUserIds?: string[];
  environment?: FlagEnvironment;
  config?: Record<string, unknown>;
  description?: string;
  module?: string;
  status?: string;
  reason?: string;
}

const snapshotFlag = (flag: {
  key: string;
  module: string;
  description: string;
  enabled: boolean;
  rolloutPercent: number;
  allowRoles: string;
  allowUserIds: string;
  denyUserIds: string;
  environment: string;
  config: string;
  status: string;
}) => ({
  key: flag.key,
  module: flag.module,
  description: flag.description,
  enabled: flag.enabled,
  rolloutPercent: flag.rolloutPercent,
  allowRoles: parseJsonArray(flag.allowRoles),
  allowUserIds: parseJsonArray(flag.allowUserIds),
  denyUserIds: parseJsonArray(flag.denyUserIds),
  environment: flag.environment,
  config: parseJsonObject(flag.config),
  status: flag.status,
});

export async function updateFlag(
  key: string,
  input: UpdateFlagInput,
  actor: FlagActor,
): Promise<{ flag: ReturnType<typeof snapshotFlag>; action: string }> {
  const existing = await db.featureFlag.findUnique({ where: { key } });
  if (!existing) throw new Error(`Feature flag not found: ${key}`);

  const before = snapshotFlag(existing);

  const data: Record<string, unknown> = { updatedBy: actor.id || actor.email || 'unknown' };
  const actions: string[] = [];

  if (typeof input.enabled === 'boolean' && input.enabled !== existing.enabled) {
    data.enabled = input.enabled;
    actions.push(input.enabled ? 'ENABLED' : 'DISABLED');
  }
  if (typeof input.rolloutPercent === 'number') {
    const clamped = Math.max(0, Math.min(100, Math.round(input.rolloutPercent)));
    if (clamped !== existing.rolloutPercent) {
      data.rolloutPercent = clamped;
      actions.push('ROLLOUT_CHANGED');
    }
  }
  if (Array.isArray(input.allowRoles)) {
    data.allowRoles = JSON.stringify(input.allowRoles);
    actions.push('ALLOW_ROLES_CHANGED');
  }
  if (Array.isArray(input.allowUserIds)) {
    data.allowUserIds = JSON.stringify(input.allowUserIds);
    actions.push('ALLOW_USERS_CHANGED');
  }
  if (Array.isArray(input.denyUserIds)) {
    data.denyUserIds = JSON.stringify(input.denyUserIds);
    actions.push('DENY_USERS_CHANGED');
  }
  if (typeof input.environment === 'string') {
    data.environment = input.environment;
    actions.push('ENVIRONMENT_CHANGED');
  }
  if (input.config && typeof input.config === 'object') {
    data.config = JSON.stringify(input.config);
    actions.push('CONFIG_CHANGED');
  }
  if (typeof input.description === 'string') {
    data.description = input.description;
    actions.push('DESCRIPTION_CHANGED');
  }
  if (typeof input.module === 'string') {
    data.module = input.module;
    actions.push('MODULE_CHANGED');
  }
  if (typeof input.status === 'string') {
    data.status = input.status;
    actions.push('STATUS_CHANGED');
  }

  if (actions.length === 0) {
    return { flag: before, action: 'NO_CHANGE' };
  }

  const updated = await db.featureFlag.update({ where: { key }, data });
  const after = snapshotFlag(updated);

  await db.featureFlagAudit.create({
    data: {
      flagId: updated.id,
      flagKey: updated.key,
      action: actions.join(','),
      before: JSON.stringify(before),
      after: JSON.stringify(after),
      actorId: actor.id || '',
      actorEmail: actor.email || '',
      reason: input.reason || '',
    },
  });

  return { flag: after, action: actions.join(',') };
}

export async function listFlags(module?: string) {
  return db.featureFlag.findMany({
    where: module ? { module } : undefined,
    orderBy: [{ module: 'asc' }, { key: 'asc' }],
  });
}

export async function flagAuditTrail(key: string, limit = 100) {
  return db.featureFlagAudit.findMany({
    where: { flagKey: key },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 500),
  });
}
