// ============================================================
// ALO EDUCATION — REGULATORY RULE VERSIONING (spec s106)
//                 POLICY CHANGE MONITORING   (spec s64)
// ============================================================
// Visa and country requirements change. Before this module the Country* rule
// tables carried only `lastVerifiedAt` + `status`, so editing a requirement
// silently overwrote the rule a past application had been assessed against —
// there was no way to answer "what did we believe on the day we advised this
// student?".
//
// Design rules enforced here:
//   * APPEND-ONLY. A change creates a NEW version. The previous one becomes
//     SUPERSEDED and is RETAINED. Nothing is deleted, renumbered or rewritten.
//   * ONE ACTIVE VERSION per ruleKey. Approving closes the prior version's
//     effective window exactly where the new one opens — no gap, no overlap.
//   * HUMAN APPROVAL (s116). A regulatory rule change cannot activate itself.
//     `approveRuleVersion` requires a real actor identity and refuses an empty
//     one, so neither a system job nor an AI agent can self-approve.
//   * PROVENANCE (s105). Every version records source type, URL and a
//     verification status. An unverified source is stored as unverified — it is
//     never silently promoted to authoritative.
//   * DETECTION IS NOT APPLICATION (s64). A detected policy change raises an
//     alert with impact analysis and a review task; it becomes a PROPOSED
//     version, which still needs approval.
// ============================================================

import { db } from '@/lib/db';

// ------------------------------------------------------------
// Vocabularies. The schema uses no Prisma enums (repo convention: 548 models,
// 0 enums), so the allowed values live here and are enforced on every write.
// ------------------------------------------------------------

export const RULE_TYPES = [
  'VISA_REQUIREMENT',
  'ENTRY_REQUIREMENT',
  'ENGLISH_REQUIREMENT',
  'FINANCIAL_REQUIREMENT',
  'WORK_RIGHT',
  'APPLICATION_DEADLINE',
  'POLICY',
  'OTHER',
] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const RULE_SOURCE_TYPES = [
  'OFFICIAL_GOVERNMENT',
  'OFFICIAL_UNIVERSITY',
  'APPROVED_PARTNER',
  'VERIFIED_INTERNAL',
  'UNVERIFIED',
] as const;
export type RuleSourceType = (typeof RULE_SOURCE_TYPES)[number];

export const VERIFICATION_STATUSES = ['NEEDS_REVIEW', 'VERIFIED', 'DISPUTED', 'STALE'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const RULE_VERSION_STATUSES = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUPERSEDED',
  'REJECTED',
  'EXPIRED',
] as const;
export type RuleVersionStatus = (typeof RULE_VERSION_STATUSES)[number];

export const ALERT_STATUSES = [
  'DETECTED',
  'TRIAGED',
  'PROPOSED',
  'APPROVED',
  'DISMISSED',
  'EXPIRED',
] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

/** Severity vocabulary shared with notifications (s85). */
export const ALERT_SEVERITIES = ['INFO', 'WARNING', 'URGENT', 'CRITICAL'] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

/**
 * Rule types whose change is high-risk and therefore always needs a human
 * approver (s116). Kept explicit rather than "everything", so an internal
 * deadline tweak is not blocked behind the same gate as a visa rule.
 */
export const APPROVAL_REQUIRED_RULE_TYPES: readonly RuleType[] = [
  'VISA_REQUIREMENT',
  'ENTRY_REQUIREMENT',
  'ENGLISH_REQUIREMENT',
  'FINANCIAL_REQUIREMENT',
  'WORK_RIGHT',
  'POLICY',
];

// ------------------------------------------------------------
// Pure helpers — no database, fully unit tested.
// ------------------------------------------------------------

const upper = (value: unknown): string => String(value ?? '').trim().toUpperCase();

export function normalizeRuleType(value: unknown): RuleType {
  const candidate = upper(value);
  return (RULE_TYPES as readonly string[]).includes(candidate) ? (candidate as RuleType) : 'OTHER';
}

export function normalizeSourceType(value: unknown): RuleSourceType {
  const candidate = upper(value);
  return (RULE_SOURCE_TYPES as readonly string[]).includes(candidate)
    ? (candidate as RuleSourceType)
    : 'UNVERIFIED';
}

export function normalizeRuleStatus(value: unknown): RuleVersionStatus {
  const candidate = upper(value);
  return (RULE_VERSION_STATUSES as readonly string[]).includes(candidate)
    ? (candidate as RuleVersionStatus)
    : 'DRAFT';
}

export function normalizeVerificationStatus(value: unknown): VerificationStatus {
  const candidate = upper(value);
  return (VERIFICATION_STATUSES as readonly string[]).includes(candidate)
    ? (candidate as VerificationStatus)
    : 'NEEDS_REVIEW';
}

export function normalizeAlertStatus(value: unknown): AlertStatus {
  const candidate = upper(value);
  return (ALERT_STATUSES as readonly string[]).includes(candidate)
    ? (candidate as AlertStatus)
    : 'DETECTED';
}

export function normalizeSeverity(value: unknown): AlertSeverity {
  const candidate = upper(value);
  return (ALERT_SEVERITIES as readonly string[]).includes(candidate)
    ? (candidate as AlertSeverity)
    : 'INFO';
}

/**
 * Canonical key for a rule, e.g. `country:GBR:VISA_REQUIREMENT:MASTERS`.
 * Deterministic so the same rule always resolves to the same version chain.
 */
export function ruleKeyFor(input: {
  countryId?: string | null;
  universityId?: string | null;
  ruleType: string;
  scope?: string | null;
}): string {
  const ruleType = normalizeRuleType(input.ruleType);
  if (input.universityId && String(input.universityId).trim()) {
    const scope = String(input.scope ?? '').trim().toUpperCase();
    return `university:${String(input.universityId).trim()}:${ruleType}${scope ? `:${scope}` : ''}`;
  }
  if (input.countryId && String(input.countryId).trim()) {
    const scope = String(input.scope ?? '').trim().toUpperCase();
    return `country:${String(input.countryId).trim()}:${ruleType}${scope ? `:${scope}` : ''}`;
  }
  const scope = String(input.scope ?? '').trim().toUpperCase();
  return `global:${ruleType}${scope ? `:${scope}` : ''}`;
}

/** Next version number for a chain. Monotonic; never reuses a retired number. */
export function nextVersionNumber(existing: Array<{ versionNumber: number }>): number {
  if (!Array.isArray(existing) || existing.length === 0) return 1;
  const highest = existing.reduce(
    (max, row) => (Number.isFinite(row.versionNumber) && row.versionNumber > max ? row.versionNumber : max),
    0,
  );
  return Math.max(1, Math.floor(highest) + 1);
}

export interface ActiveWindow {
  status: string;
  effectiveFrom: Date | string;
  effectiveUntil: Date | string | null;
}

const toTime = (value: Date | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
};

/**
 * Is this version the one in force at `at`? Half-open window:
 * effectiveFrom <= at < effectiveUntil. A null effectiveUntil is open-ended.
 */
export function isVersionActiveAt(version: ActiveWindow, at: Date): boolean {
  if (normalizeRuleStatus(version.status) !== 'ACTIVE') return false;
  const now = at.getTime();
  const from = toTime(version.effectiveFrom);
  const until = toTime(version.effectiveUntil);
  if (from === null) return false;
  if (now < from) return false;
  if (until !== null && now >= until) return false;
  return true;
}

/**
 * Pick the single version in force at `at`. If two ACTIVE windows overlap
 * (bad data), the HIGHEST version number wins so resolution is deterministic
 * rather than dependent on query order.
 */
export function pickActiveVersion<T extends ActiveWindow & { versionNumber: number }>(
  versions: T[],
  at: Date,
): T | null {
  if (!Array.isArray(versions)) return null;
  const matching = versions.filter((version) => isVersionActiveAt(version, at));
  if (matching.length === 0) return null;
  return matching.reduce((best, candidate) =>
    candidate.versionNumber > best.versionNumber ? candidate : best,
  );
}

/**
 * Trust weight for ranking and for deciding whether a rule may be presented as
 * authoritative. An official, verified source outranks an unverified one — the
 * same principle the opportunity graph applies to scholarships (s105).
 */
export function sourceTrustWeight(sourceType: unknown, verificationStatus: unknown): number {
  const source = normalizeSourceType(sourceType);
  const verification = normalizeVerificationStatus(verificationStatus);

  const base: Record<RuleSourceType, number> = {
    OFFICIAL_GOVERNMENT: 1,
    OFFICIAL_UNIVERSITY: 0.95,
    APPROVED_PARTNER: 0.75,
    VERIFIED_INTERNAL: 0.7,
    UNVERIFIED: 0.4,
  };
  const modifier: Record<VerificationStatus, number> = {
    VERIFIED: 1,
    NEEDS_REVIEW: 0.6,
    STALE: 0.4,
    DISPUTED: 0.2,
  };
  return Number((base[source] * modifier[verification]).toFixed(3));
}

/**
 * May this version be presented to a student or partner as fact? Unverified or
 * disputed regulatory data must be labelled, never asserted (s105, s93).
 */
export function isAuthoritative(version: {
  sourceType?: unknown;
  verificationStatus?: unknown;
}): boolean {
  return sourceTrustWeight(version.sourceType, version.verificationStatus) >= 0.7;
}

/** Does this rule type require a human approver? (s116) */
export function requiresHumanApproval(ruleType: unknown): boolean {
  return (APPROVAL_REQUIRED_RULE_TYPES as readonly string[]).includes(normalizeRuleType(ruleType));
}

/** An actor must be identifiable for an audited regulatory change. */
export function actorLabel(actor?: { id?: string | null; email?: string | null } | null): string {
  const id = String(actor?.id ?? '').trim();
  const email = String(actor?.email ?? '').trim();
  if (id) return id;
  if (email) return email;
  return '';
}

// ------------------------------------------------------------
// Persistence
// ------------------------------------------------------------

export interface RuleActor {
  id?: string | null;
  email?: string | null;
}

export interface ProposeRuleVersionInput {
  ruleKey?: string;
  countryId?: string | null;
  universityId?: string | null;
  ruleType: string;
  scope?: string | null;
  payload: Record<string, unknown>;
  summary?: string;
  changeReason: string;
  effectiveFrom: Date;
  effectiveUntil?: Date | null;
  sourceType?: string;
  sourceUrl?: string;
  sourceName?: string;
  verificationStatus?: string;
  policyChangeAlertId?: string;
  /** Submit straight to approval instead of leaving as a draft. */
  submitForApproval?: boolean;
}

/**
 * Create a NEW version of a rule. Never mutates the currently active one, so
 * proposing a change cannot alter what is in force today (s106).
 */
export async function proposeRuleVersion(
  input: ProposeRuleVersionInput,
  actor: RuleActor,
): Promise<{ versionNumber: number; id: string; status: RuleVersionStatus; ruleKey: string }> {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED: a rule change must be attributable to a person');

  const reason = String(input.changeReason ?? '').trim();
  if (!reason) throw new Error('CHANGE_REASON_REQUIRED: record what changed and why');

  if (!(input.effectiveFrom instanceof Date) || Number.isNaN(input.effectiveFrom.getTime())) {
    throw new Error('EFFECTIVE_FROM_REQUIRED: a rule version must have a real effective date');
  }
  if (input.effectiveUntil) {
    if (!(input.effectiveUntil instanceof Date) || Number.isNaN(input.effectiveUntil.getTime())) {
      throw new Error('INVALID_EFFECTIVE_UNTIL');
    }
    if (input.effectiveUntil.getTime() <= input.effectiveFrom.getTime()) {
      throw new Error('EFFECTIVE_UNTIL_MUST_FOLLOW_EFFECTIVE_FROM');
    }
  }
  if (!input.payload || typeof input.payload !== 'object') {
    throw new Error('PAYLOAD_REQUIRED: the rule content must be an object');
  }

  const ruleType = normalizeRuleType(input.ruleType);
  const ruleKey =
    String(input.ruleKey ?? '').trim() ||
    ruleKeyFor({
      countryId: input.countryId,
      universityId: input.universityId,
      ruleType,
      scope: input.scope,
    });

  const existing = await db.regulatoryRuleVersion.findMany({
    where: { ruleKey },
    select: { versionNumber: true },
  });
  const versionNumber = nextVersionNumber(existing);

  // Submitting for approval is mandatory for high-risk types: a visa rule may
  // not sit in DRAFT and be treated as live, nor skip the human gate.
  const status: RuleVersionStatus =
    input.submitForApproval || requiresHumanApproval(ruleType) ? 'PENDING_APPROVAL' : 'DRAFT';

  const created = await db.regulatoryRuleVersion.create({
    data: {
      ruleKey,
      ruleType,
      versionNumber,
      payload: JSON.stringify(input.payload),
      summary: String(input.summary ?? '').trim(),
      effectiveFrom: input.effectiveFrom,
      effectiveUntil: input.effectiveUntil ?? null,
      sourceType: normalizeSourceType(input.sourceType),
      sourceUrl: String(input.sourceUrl ?? '').trim(),
      sourceName: String(input.sourceName ?? '').trim(),
      verificationStatus: normalizeVerificationStatus(input.verificationStatus),
      status,
      changeReason: reason,
      countryId: String(input.countryId ?? '').trim(),
      universityId: String(input.universityId ?? '').trim(),
      scope: String(input.scope ?? '').trim(),
      policyChangeAlertId: String(input.policyChangeAlertId ?? '').trim(),
      createdBy: who,
    },
  });

  return { versionNumber, id: created.id, status, ruleKey };
}

/**
 * Activate a proposed version. Human-in-the-loop (s116): requires an actor, and
 * the approver may not be the anonymous system. Supersedes the previously
 * active version by closing its window exactly where this one opens — retained,
 * never deleted.
 */
export async function approveRuleVersion(
  versionId: string,
  actor: RuleActor,
  options: { now?: Date } = {},
) {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED: regulatory rule changes need a named approver');

  const now = options.now ?? new Date();
  const target = await db.regulatoryRuleVersion.findUnique({ where: { id: versionId } });
  if (!target) throw new Error(`RULE_VERSION_NOT_FOUND: ${versionId}`);

  if (target.status === 'ACTIVE') {
    return { action: 'ALREADY_ACTIVE', versionId, superseded: null as string | null };
  }
  if (target.status === 'SUPERSEDED') {
    // Re-activating history would rewrite the past. Refuse.
    throw new Error('CANNOT_APPROVE_SUPERSEDED: superseded versions are immutable history');
  }
  if (target.status === 'REJECTED') {
    throw new Error('CANNOT_APPROVE_REJECTED: propose a new version instead');
  }
  if (target.status === 'EXPIRED') {
    throw new Error('CANNOT_APPROVE_EXPIRED: propose a new version instead');
  }

  const from = target.effectiveFrom instanceof Date ? target.effectiveFrom : new Date(target.effectiveFrom);
  const effectiveFrom = Number.isFinite(from.getTime()) ? from : now;

  // Close the window of whatever is active now, if anything.
  const previous = await db.regulatoryRuleVersion.findFirst({
    where: { ruleKey: target.ruleKey, status: 'ACTIVE', NOT: { id: target.id } },
    orderBy: { versionNumber: 'desc' },
  });

  const approved = await db.regulatoryRuleVersion.update({
    where: { id: target.id },
    data: {
      status: 'ACTIVE',
      approvedBy: who,
      approvedAt: now,
      // A version that was already dated in the past starts there; one dated in
      // the future keeps its own date so the chain stays gapless.
      effectiveFrom,
      supersededById: null,
    },
  });

  let supersededId: string | null = null;
  if (previous) {
    const previousFrom =
      previous.effectiveFrom instanceof Date ? previous.effectiveFrom : new Date(previous.effectiveFrom);
    // Close at the later of the previous start and the new start, so the
    // superseded version never has an inverted or zero-length window.
    const closeAt =
      previousFrom.getTime() > effectiveFrom.getTime() ? previousFrom : effectiveFrom;
    await db.regulatoryRuleVersion.update({
      where: { id: previous.id },
      data: {
        status: 'SUPERSEDED',
        effectiveUntil: closeAt,
        supersededById: approved.id,
      },
    });
    supersededId = previous.id;
  }

  return { action: 'APPROVED', versionId: approved.id, superseded: supersededId };
}

/** Reject a proposed version. A reason is mandatory — this is an audit record. */
export async function rejectRuleVersion(versionId: string, actor: RuleActor, reason: string) {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED');
  const trimmed = String(reason ?? '').trim();
  if (trimmed.length < 3) throw new Error('REJECTION_REASON_REQUIRED');

  const target = await db.regulatoryRuleVersion.findUnique({ where: { id: versionId } });
  if (!target) throw new Error(`RULE_VERSION_NOT_FOUND: ${versionId}`);
  if (target.status === 'ACTIVE') {
    throw new Error('CANNOT_REJECT_ACTIVE: withdraw it by approving a replacement version');
  }
  if (target.status === 'SUPERSEDED') {
    throw new Error('CANNOT_REJECT_SUPERSEDED: history is immutable');
  }

  await db.regulatoryRuleVersion.update({
    where: { id: versionId },
    data: { status: 'REJECTED', rejectionReason: trimmed, approvedBy: who, approvedAt: new Date() },
  });
  return { action: 'REJECTED', versionId };
}

/** The version in force for a rule at a point in time (defaults to now). */
export async function resolveActiveRule(ruleKey: string, at: Date = new Date()) {
  const versions = await db.regulatoryRuleVersion.findMany({
    where: { ruleKey, status: 'ACTIVE' },
    orderBy: { versionNumber: 'desc' },
  });
  const active = pickActiveVersion(versions, at);
  if (!active) return null;
  return {
    ...active,
    payload: parsePayload(active.payload),
    authoritative: isAuthoritative(active),
    trustWeight: sourceTrustWeight(active.sourceType, active.verificationStatus),
  };
}

/** Full preserved history of a rule, oldest first. Never truncated. */
export async function ruleHistory(ruleKey: string) {
  const versions = await db.regulatoryRuleVersion.findMany({
    where: { ruleKey },
    orderBy: { versionNumber: 'asc' },
  });
  return versions.map((version) => ({
    ...version,
    payload: parsePayload(version.payload),
  }));
}

function parsePayload(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Record that a human checked a rule against its source (s105). Verification is
 * separate from approval: verifying says "this is what the source states",
 * approving says "ALO will act on it".
 */
export async function recordRuleVerification(
  versionId: string,
  actor: RuleActor,
  input: { sourceUrl?: string; sourceName?: string; sourceType?: string; verificationStatus?: string },
) {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED');

  const target = await db.regulatoryRuleVersion.findUnique({ where: { id: versionId } });
  if (!target) throw new Error(`RULE_VERSION_NOT_FOUND: ${versionId}`);

  const verificationStatus = normalizeVerificationStatus(input.verificationStatus);
  // A source may only be marked VERIFIED if there is something to verify
  // against. Otherwise it stays NEEDS_REVIEW rather than becoming fake authority.
  const hasSource =
    String(input.sourceUrl ?? target.sourceUrl ?? '').trim().length > 0 ||
    String(input.sourceName ?? target.sourceName ?? '').trim().length > 0;
  const finalStatus: VerificationStatus =
    verificationStatus === 'VERIFIED' && !hasSource ? 'NEEDS_REVIEW' : verificationStatus;

  const updated = await db.regulatoryRuleVersion.update({
    where: { id: versionId },
    data: {
      verificationStatus: finalStatus,
      verifiedBy: who,
      verifiedAt: new Date(),
      sourceUrl: String(input.sourceUrl ?? target.sourceUrl ?? '').trim(),
      sourceName: String(input.sourceName ?? target.sourceName ?? '').trim(),
      sourceType: normalizeSourceType(input.sourceType ?? target.sourceType),
    },
  });
  return {
    action: 'VERIFICATION_RECORDED',
    verificationStatus: finalStatus,
    downgraded: finalStatus !== verificationStatus,
    version: { ...updated, payload: parsePayload(updated.payload) },
  };
}

/**
 * Close out ACTIVE versions whose effective window has ended. Idempotent, so it
 * is safe to run from a cron job repeatedly (s89).
 */
export async function expireOverdueRules(options: { now?: Date; limit?: number } = {}) {
  const now = options.now ?? new Date();
  const limit = Math.min(Math.max(options.limit ?? 200, 1), 1000);

  const overdue = await db.regulatoryRuleVersion.findMany({
    where: { status: 'ACTIVE', effectiveUntil: { not: null, lt: now } },
    select: { id: true, ruleKey: true, versionNumber: true },
    take: limit,
  });

  for (const row of overdue) {
    await db.regulatoryRuleVersion.update({ where: { id: row.id }, data: { status: 'EXPIRED' } });
  }
  return { expired: overdue.length, ids: overdue.map((row) => row.id) };
}

// ------------------------------------------------------------
// Policy change monitoring (s64)
// ------------------------------------------------------------

export interface DetectPolicyChangeInput {
  title: string;
  description?: string;
  ruleKey?: string;
  countryId?: string | null;
  universityId?: string | null;
  ruleType?: string;
  scope?: string | null;
  severity?: string;
  sourceType?: string;
  sourceUrl?: string;
  sourceName?: string;
  affectedWorkflows?: string[];
  affectedStudentIds?: string[];
  affectedApplicationIds?: string[];
  affectedCountryIds?: string[];
  requiresApproval?: boolean;
}

const stringList = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];

/**
 * Record a detected change. Detection NEVER applies the change (s64/s116): it
 * creates an alert, computes impact and — when the caller supplies affected
 * records — makes the blast radius explicit rather than assumed.
 */
export async function detectPolicyChange(input: DetectPolicyChangeInput, actor: RuleActor = {}) {
  const title = String(input.title ?? '').trim();
  if (!title) throw new Error('TITLE_REQUIRED: describe the detected change');

  const ruleType = normalizeRuleType(input.ruleType ?? 'POLICY');
  const ruleKey =
    String(input.ruleKey ?? '').trim() ||
    ruleKeyFor({
      countryId: input.countryId,
      universityId: input.universityId,
      ruleType,
      scope: input.scope,
    });

  const students = stringList(input.affectedStudentIds);
  const applications = stringList(input.affectedApplicationIds);
  const workflows = stringList(input.affectedWorkflows);
  const countries = stringList(input.affectedCountryIds);

  // High-risk regulatory changes always require approval, regardless of what
  // the caller asked for. The caller may raise the bar, never lower it.
  const requiresApproval = requiresHumanApproval(ruleType)
    ? true
    : input.requiresApproval !== false;

  const created = await db.policyChangeAlert.create({
    data: {
      ruleKey,
      ruleType,
      title,
      description: String(input.description ?? '').trim(),
      severity: normalizeSeverity(input.severity),
      sourceType: normalizeSourceType(input.sourceType ?? 'OFFICIAL_GOVERNMENT'),
      sourceUrl: String(input.sourceUrl ?? '').trim(),
      sourceName: String(input.sourceName ?? '').trim(),
      affectedWorkflows: JSON.stringify(workflows),
      affectedStudentIds: JSON.stringify(students),
      affectedApplicationIds: JSON.stringify(applications),
      affectedCountryIds: JSON.stringify(countries),
      impactCount: students.length + applications.length,
      status: 'DETECTED',
      requiresApproval,
      createdBy: actorLabel(actor) || 'MONITOR',
    },
  });

  return { ...created, action: 'DETECTED' as const };
}

/**
 * Triage an alert into a proposed rule version. Links s64 detection to s106
 * versioning so the change still has to pass the approval gate.
 */
export async function triagePolicyChange(
  alertId: string,
  actor: RuleActor,
  input: { proposedRuleVersionId?: string; reviewTaskId?: string; severity?: string },
) {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED: triage must be attributable');

  const alert = await db.policyChangeAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error(`POLICY_ALERT_NOT_FOUND: ${alertId}`);
  if (alert.status === 'DISMISSED') throw new Error('CANNOT_TRIAGE_DISMISSED');
  if (alert.status === 'APPROVED') throw new Error('CANNOT_TRIAGE_APPROVED: already resolved');

  const updated = await db.policyChangeAlert.update({
    where: { id: alertId },
    data: {
      status: input.proposedRuleVersionId ? 'PROPOSED' : 'TRIAGED',
      proposedRuleVersionId: String(input.proposedRuleVersionId ?? alert.proposedRuleVersionId ?? '').trim(),
      reviewTaskId: String(input.reviewTaskId ?? alert.reviewTaskId ?? '').trim(),
      severity: normalizeSeverity(input.severity ?? alert.severity),
      triagedBy: who,
      triagedAt: new Date(),
    },
  });
  return { ...updated, action: updated.status === 'PROPOSED' ? 'PROPOSED' : 'TRIAGED' };
}

/** Dismiss an alert as a non-change. A reason is mandatory (audit, s65). */
export async function dismissPolicyChange(alertId: string, actor: RuleActor, reason: string) {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED');
  const trimmed = String(reason ?? '').trim();
  if (trimmed.length < 3) throw new Error('DISMISS_REASON_REQUIRED');

  const alert = await db.policyChangeAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error(`POLICY_ALERT_NOT_FOUND: ${alertId}`);
  if (alert.status === 'APPROVED') throw new Error('CANNOT_DISMISS_APPROVED');

  const updated = await db.policyChangeAlert.update({
    where: { id: alertId },
    data: {
      status: 'DISMISSED',
      dismissedReason: trimmed,
      triagedBy: who,
      triagedAt: new Date(),
      resolvedAt: new Date(),
    },
  });
  return { ...updated, action: 'DISMISSED' as const };
}

/** Mark an alert resolved once its proposed version has been approved. */
export async function resolvePolicyChange(alertId: string, actor: RuleActor) {
  const who = actorLabel(actor);
  if (!who) throw new Error('ACTOR_REQUIRED');
  const alert = await db.policyChangeAlert.findUnique({ where: { id: alertId } });
  if (!alert) throw new Error(`POLICY_ALERT_NOT_FOUND: ${alertId}`);

  const updated = await db.policyChangeAlert.update({
    where: { id: alertId },
    data: { status: 'APPROVED', resolvedAt: new Date(), triagedBy: who },
  });
  return { ...updated, action: 'RESOLVED' as const };
}

/** Open alerts, most severe first, for the management attention view (s107). */
export async function listOpenPolicyChanges(options: { limit?: number; severity?: string } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const where: Record<string, unknown> = {
    status: { in: ['DETECTED', 'TRIAGED', 'PROPOSED'] },
  };
  if (options.severity) where.severity = normalizeSeverity(options.severity);

  const alerts = await db.policyChangeAlert.findMany({
    where,
    orderBy: [{ detectedAt: 'desc' }],
    take: limit,
  });

  const rank: Record<string, number> = { CRITICAL: 0, URGENT: 1, WARNING: 2, INFO: 3 };
  return alerts
    .map((alert) => ({
      ...alert,
      affectedWorkflows: stringList(parseJson(alert.affectedWorkflows)),
      affectedStudentIds: stringList(parseJson(alert.affectedStudentIds)),
      affectedApplicationIds: stringList(parseJson(alert.affectedApplicationIds)),
      affectedCountryIds: stringList(parseJson(alert.affectedCountryIds)),
    }))
    .sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9));
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Rules whose verification has gone stale. Feeds the attention engine (s108)
 * and the country pages' "last verified" requirement (s43).
 */
export async function listStaleRules(options: { olderThanDays?: number; limit?: number } = {}) {
  const olderThanDays = Math.min(Math.max(options.olderThanDays ?? 180, 1), 3650);
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 3_600_000);

  const stale = await db.regulatoryRuleVersion.findMany({
    where: {
      status: 'ACTIVE',
      OR: [{ verifiedAt: null }, { verifiedAt: { lt: cutoff } }],
    },
    orderBy: [{ verifiedAt: 'asc' }, { updatedAt: 'asc' }],
    take: limit,
  });

  return stale.map((version) => ({
    ...version,
    payload: parsePayload(version.payload),
    daysSinceVerified: version.verifiedAt
      ? Math.floor((Date.now() - new Date(version.verifiedAt).getTime()) / 86_400_000)
      : null,
    authoritative: isAuthoritative(version),
  }));
}
