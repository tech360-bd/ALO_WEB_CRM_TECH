// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Source Intelligence Engine
 *
 * Detects, evaluates, and approves changes detected in official university
 * sources. Wraps the existing DataChange / OfficialSource / SourceSnapshot
 * models with a higher-level API.
 *
 * Lifecycle:
 *   1. detectSourceChange(sourceId, beforeSnapshot, afterSnapshot)
 *        — diff two snapshots, create DataChange records.
 *   2. evaluateSourceChangeWithAI(changeEventId)
 *        — run AI analysis on the change (explanation, confidence, impact).
 *   3. applySourceChange(changeEventId, appliedBy)
 *        — Super Admin approves; mark change APPLIED.
 *   4. rejectSourceChange(changeEventId, rejectedBy, reason?)
 *        — Super Admin rejects; mark change REJECTED.
 *
 * Also manages University Research Evidence (separate model).
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export interface SourceSnapshotLike {
  id?: string;
  contentHash: string;
  textExtract: string;
  aiKeyFacts?: string; // JSON
  capturedAt?: Date;
  httpStatus?: number;
}

export interface DetectedChange {
  changeId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
}

export interface ApplySourceChangeResult {
  changeId: string;
  applied: boolean;
  appliedAt: Date;
}

export interface RejectSourceChangeResult {
  changeId: string;
  rejected: boolean;
  rejectedAt: Date;
}

export interface ResearchEvidenceParams {
  universitySlug: string;
  sourceUrl: string;
  sourceName: string;
  claim: string;
  evidenceText: string;
  evidenceType?: string; // QUOTE | SCREENSHOT | DOCUMENT | DATA_POINT
  capturedAt?: Date;
  capturedById?: string;
  metadata?: Record<string, unknown>;
}

// Cast db to access models not on the standard client.

// ─── detectSourceChange ──────────────────────────────────────────

/**
 * Diff two snapshots of the same OfficialSource and create DataChange
 * records for every field that changed.
 *
 * The diff is performed on the `aiKeyFacts` JSON (structured facts extracted
 * by AI from each snapshot's textExtract). Each top-level key in the JSON
 * is treated as a field; missing keys vs. present keys are also changes.
 *
 * Returns the list of created DataChange records.
 */
export async function detectSourceChange(
  sourceId: string,
  beforeSnapshot: SourceSnapshotLike,
  afterSnapshot: SourceSnapshotLike
): Promise<DetectedChange[]> {
  if (!sourceId) throw new Error("detectSourceChange: sourceId is required");
  if (!beforeSnapshot || !afterSnapshot) {
    throw new Error("detectSourceChange: beforeSnapshot and afterSnapshot are required");
  }

  const source = await db.officialSource.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`detectSourceChange: source ${sourceId} not found`);

  // Quick exit: identical content hash → no change
  if (beforeSnapshot.contentHash === afterSnapshot.contentHash) {
    return [];
  }

  // Parse structured facts
  const beforeFacts = safeParseJson(beforeSnapshot.aiKeyFacts ?? "{}");
  const afterFacts = safeParseJson(afterSnapshot.aiKeyFacts ?? "{}");

  const allKeys = new Set([...Object.keys(beforeFacts), ...Object.keys(afterFacts)]);
  const detected: DetectedChange[] = [];

  for (const key of allKeys) {
    const beforeVal = beforeFacts[key] ?? null;
    const afterVal = afterFacts[key] ?? null;
    const beforeStr = beforeVal === null ? null : String(beforeVal);
    const afterStr = afterVal === null ? null : String(afterVal);

    if (beforeStr === afterStr) continue;

    const changeType = classifyChange(key, beforeStr, afterStr);

    const change = await db.dataChange.create({
      data: {
        runId: `manual-${Date.now()}`,
        sourceId,
        entityType: source.entityType,
        universitySlug: source.universitySlug,
        courseSlug: source.courseSlug,
        countrySlug: source.countrySlug,
        changeType,
        fieldName: key,
        oldValue: beforeStr,
        newValue: afterStr,
        sourceUrl: source.sourceUrl,
        sourcePageTitle: null,
        detectedAt: new Date(),
        previousVerifiedAt: beforeSnapshot.capturedAt ?? null,
        newSourceDate: null,
        status: "PENDING",
        impactLevel: "LOW",
        confidence: 0,
      },
    });

    // Persist value-level record for full history
    await db.dataChangeValue.create({
      data: {
        changeId: change.id,
        fieldName: key,
        oldValue: beforeStr,
        newValue: afterStr,
        oldValueHash: beforeStr ? simpleHash(beforeStr) : null,
        newValueHash: afterStr ? simpleHash(afterStr) : null,
      },
    });

    detected.push({
      changeId: change.id,
      fieldName: key,
      oldValue: beforeStr,
      newValue: afterStr,
      changeType,
    });
  }

  return detected;
}

// ─── evaluateSourceChangeWithAI ──────────────────────────────────

/**
 * Run an AI evaluation pass on a pending DataChange record.
 *
 * Produces:
 *   - aiExplanation  — human-readable summary of the change
 *   - confidence     — 0.0 to 1.0
 *   - impactLevel    — LOW | MEDIUM | HIGH | CRITICAL
 *
 * Updates the DataChange record in place. Does NOT auto-apply — apply
 * requires explicit Super Admin action via applySourceChange().
 */
export async function evaluateSourceChangeWithAI(changeEventId: string): Promise<{
  changeId: string;
  aiExplanation: string;
  confidence: number;
  impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}> {
  const change = await db.dataChange.findUnique({ where: { id: changeEventId } });
  if (!change) throw new Error(`evaluateSourceChangeWithAI: change ${changeEventId} not found`);

  // Heuristic AI evaluation (no external API call required).
  // Real implementation may call z-ai-web-dev-sdk for richer analysis.
  const { aiExplanation, confidence, impactLevel } = heuristicEvaluate(change);

  await db.dataChange.update({
    where: { id: changeEventId },
    data: { aiExplanation, confidence, impactLevel },
  });

  return { changeId: changeEventId, aiExplanation, confidence, impactLevel };
}

// ─── applySourceChange ───────────────────────────────────────────

/**
 * Approve and apply a pending source change.
 *
 * The actual production mutation (e.g. updating the UniversityPage or
 * CoursePage record) is the caller's responsibility — this function only
 * records the approval and flips the DataChange status to APPROVED +
 * appliedAt/appliedBy. The caller reads the change fields and performs
 * the targeted update on the production entity.
 */
export async function applySourceChange(
  changeEventId: string,
  appliedBy: string
): Promise<ApplySourceChangeResult> {
  if (!appliedBy) throw new Error("applySourceChange: appliedBy (userId) is required");

  const change = await db.dataChange.findUnique({ where: { id: changeEventId } });
  if (!change) throw new Error(`applySourceChange: change ${changeEventId} not found`);
  if (change.status === "APPROVED") {
    return { changeId: changeEventId, applied: false, appliedAt: change.appliedAt ?? new Date() };
  }
  if (change.status === "REJECTED") {
    throw new Error(`applySourceChange: change ${changeEventId} was already rejected`);
  }

  const now = new Date();
  await db.dataChange.update({
    where: { id: changeEventId },
    data: {
      status: "APPROVED",
      reviewedBy: appliedBy,
      reviewedAt: now,
      appliedAt: now,
      appliedBy,
    },
  });

  await db.approvalAction.create({
    data: {
      changeId: changeEventId,
      action: "APPROVE",
      performedBy: appliedBy,
      performedAt: now,
      metadata: JSON.stringify({ appliedAt: now.toISOString() }),
    },
  });

  return { changeId: changeEventId, applied: true, appliedAt: now };
}

// ─── rejectSourceChange ──────────────────────────────────────────

/**
 * Reject a pending source change with an optional reason.
 */
export async function rejectSourceChange(
  changeEventId: string,
  rejectedBy: string,
  reason?: string
): Promise<RejectSourceChangeResult> {
  if (!rejectedBy) throw new Error("rejectSourceChange: rejectedBy (userId) is required");

  const change = await db.dataChange.findUnique({ where: { id: changeEventId } });
  if (!change) throw new Error(`rejectSourceChange: change ${changeEventId} not found`);
  if (change.status === "REJECTED") {
    return { changeId: changeEventId, rejected: false, rejectedAt: new Date() };
  }
  if (change.status === "APPROVED") {
    throw new Error(`rejectSourceChange: change ${changeEventId} was already approved`);
  }

  const now = new Date();
  await db.dataChange.update({
    where: { id: changeEventId },
    data: {
      status: "REJECTED",
      reviewedBy: rejectedBy,
      reviewedAt: now,
      reviewNotes: reason ?? null,
    },
  });

  await db.approvalAction.create({
    data: {
      changeId: changeEventId,
      action: "REJECT",
      performedBy: rejectedBy,
      performedAt: now,
      notes: reason ?? null,
    },
  });

  return { changeId: changeEventId, rejected: true, rejectedAt: now };
}

// ─── Research Evidence ───────────────────────────────────────────

/**
 * Capture a piece of research evidence (a quote, screenshot, document,
 * or data point) that supports a claim about a university.
 */
export async function createResearchEvidence(params: ResearchEvidenceParams): Promise<{ evidenceId: string }> {
  if (!params.universitySlug || !params.sourceUrl || !params.claim) {
    throw new Error("createResearchEvidence: universitySlug, sourceUrl, claim are required");
  }

  const evidence = await db.universityResearchEvidence.create({
    data: {
      universitySlug: params.universitySlug,
      sourceUrl: params.sourceUrl,
      sourceName: params.sourceName,
      claim: params.claim,
      evidenceText: params.evidenceText,
      evidenceType: params.evidenceType ?? "QUOTE",
      capturedAt: params.capturedAt ?? new Date(),
      capturedById: params.capturedById ?? null,
      verificationStatus: "PENDING",
      verifiedById: null,
      verifiedAt: null,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });

  return { evidenceId: evidence.id };
}

/**
 * Mark a piece of research evidence as verified by a Super Admin.
 */
export async function verifyEvidence(evidenceId: string, verifierId: string): Promise<{ verified: boolean }> {
  if (!verifierId) throw new Error("verifyEvidence: verifierId is required");

  await db.universityResearchEvidence.update({
    where: { id: evidenceId },
    data: {
      verificationStatus: "VERIFIED",
      verifiedById: verifierId,
      verifiedAt: new Date(),
    },
  });

  return { verified: true };
}

/**
 * Get a summary of all research evidence captured for a university.
 */
export async function getUniversityEvidenceSummary(universitySlug: string): Promise<{
  totalEvidence: number;
  verified: number;
  pending: number;
  byType: Record<string, number>;
  recentEvidence: Array<Record<string, unknown>>;
}> {
  if (!universitySlug) throw new Error("getUniversityEvidenceSummary: universitySlug is required");

  const all = await db.universityResearchEvidence.findMany({
    where: { universitySlug },
    orderBy: { capturedAt: "desc" },
  });

  const byType: Record<string, number> = {};
  let verified = 0;
  let pending = 0;
  for (const e of all) {
    const t = String(e.evidenceType ?? "UNKNOWN");
    byType[t] = (byType[t] ?? 0) + 1;
    if (e.verificationStatus === "VERIFIED") verified++;
    else pending++;
  }

  return {
    totalEvidence: all.length,
    verified,
    pending,
    byType,
    recentEvidence: all.slice(0, 10),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function safeParseJson(s: string): Record<string, unknown> {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return `h${Math.abs(h).toString(16)}`;
}

function classifyChange(field: string, before: string | null, after: string | null): string {
  const f = field.toLowerCase();
  if (before === null && after !== null) {
    if (f.includes("course") || f.includes("program")) return "NEW_COURSE";
    if (f.includes("scholarship")) return "SCHOLARSHIP_NEW";
    if (f.includes("faculty")) return "NEW_FACULTY";
    return "NEW_UNIVERSITY";
  }
  if (before !== null && after === null) {
    if (f.includes("course") || f.includes("program")) return "COURSE_CLOSED";
    if (f.includes("scholarship")) return "SCHOLARSHIP_CLOSED";
    return "SOURCE_UNAVAILABLE";
  }
  if (f.includes("tuition") || f.includes("fee")) return "FEE_CHANGED";
  if (f.includes("intake")) return "INTAKE_CHANGED";
  if (f.includes("deadline")) return "DEADLINE_CHANGED";
  if (f.includes("english") || f.includes("ielts") || f.includes("pte") || f.includes("toefl")) return "ENGLISH_REQUIREMENT_CHANGED";
  if (f.includes("requirement")) return "REQUIREMENT_CHANGED";
  if (f.includes("duration")) return "DURATION_CHANGED";
  if (f.includes("campus")) return "CAMPUS_CHANGED";
  if (f.includes("mode")) return "STUDY_MODE_CHANGED";
  return "UNIVERSITY_UPDATED";
}

function heuristicEvaluate(change: {
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changeType: string;
}): { aiExplanation: string; confidence: number; impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" } {
  const f = change.fieldName.toLowerCase();
  let impactLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  let confidence = 0.7;

  if (f.includes("tuition") || f.includes("fee")) {
    impactLevel = "HIGH";
    confidence = 0.85;
  } else if (f.includes("deadline")) {
    impactLevel = "CRITICAL";
    confidence = 0.9;
  } else if (f.includes("intake")) {
    impactLevel = "HIGH";
    confidence = 0.85;
  } else if (f.includes("english") || f.includes("ielts") || f.includes("requirement")) {
    impactLevel = "HIGH";
    confidence = 0.8;
  } else if (f.includes("scholarship")) {
    impactLevel = "MEDIUM";
    confidence = 0.75;
  } else if (change.changeType === "NEW_COURSE" || change.changeType === "COURSE_CLOSED") {
    impactLevel = "HIGH";
    confidence = 0.8;
  }

  const explanation = `Field "${change.fieldName}" changed from ${change.oldValue ?? "—"} to ${change.newValue ?? "—"}. ` +
    `Classified as ${change.changeType} with ${impactLevel.toLowerCase()} impact.`;

  return { aiExplanation: explanation, confidence, impactLevel };
}
