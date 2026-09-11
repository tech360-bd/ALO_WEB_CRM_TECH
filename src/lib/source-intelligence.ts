// ============================================================
// SOURCE INTELLIGENCE
// Detects changes in official sources, evaluates materiality with AI,
// manages research evidence for university/course data.
// ============================================================

import { db } from "@/lib/db";

// ─── Helpers ───

/**
 * Compute a stable hash for a content snapshot.
 * Uses Node crypto SHA-256 (no external dependency).
 */
function hashContent(input: string): string {
  if (!input) return "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(input).digest("hex");
  } catch {
    // Fallback: simple length+char hash (very weak, only used if crypto missing)
    return `len-${input.length}-${input.charCodeAt(0) || 0}`;
  }
}

/**
 * Try to dynamically import executeAiAction from any registered AI action module.
 * Falls back to aiChat from @/lib/ai if executeAiAction is not available.
 */
async function callAiAssessment(prompt: string, systemPrompt?: string): Promise<string> {
  try {
    // Dynamic import — allows future AI action registry without hard dependency.
    const mod: any = await import("@/lib/ai");
    if (mod && typeof mod.executeAiAction === "function") {
      return await mod.executeAiAction({ prompt, systemPrompt });
    }
    if (mod && typeof mod.aiChat === "function") {
      const messages = systemPrompt
        ? [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ]
        : [{ role: "user", content: prompt }];
      return await mod.aiChat(messages);
    }
  } catch {
    // AI unavailable — caller handles null/empty fallback.
  }
  return "";
}

// ─── Source Change Detection ───

export interface SourceSnapshot {
  sourceId: string;
  sourceUrl: string;
  entityType: string; // UNIVERSITY | COURSE | SCHOLARSHIP | ...
  universitySlug?: string | null;
  courseSlug?: string | null;
  content: string;
  contentHash?: string | null;
  fieldName?: string | null;
  fieldValue?: string | null;
}

/**
 * Compare before/after snapshots of a source. If contentHash differs,
 * persist a SourceChangeEvent for review.
 */
export async function detectSourceChange(
  sourceId: string,
  beforeSnapshot: SourceSnapshot,
  afterSnapshot: SourceSnapshot
) {
  const beforeHash = beforeSnapshot.contentHash || hashContent(beforeSnapshot.content || "");
  const afterHash = afterSnapshot.contentHash || hashContent(afterSnapshot.content || "");

  if (beforeHash === afterHash) {
    return {
      changed: false,
      message: "No change detected — content hashes match.",
      beforeHash,
      afterHash,
    };
  }

  // Determine change type — simple heuristic
  let changeType = "CONTENT_UPDATED";
  if (!beforeHash || beforeSnapshot.content === "") changeType = "CONTENT_ADDED";
  else if (!afterHash || afterSnapshot.content === "") changeType = "CONTENT_REMOVED";

  // Compute field-level diff if fieldName present
  const changedFrom = beforeSnapshot.fieldValue ?? beforeSnapshot.content?.slice(0, 500) ?? null;
  const changedTo = afterSnapshot.fieldValue ?? afterSnapshot.content?.slice(0, 500) ?? null;

  const changeEvent = await db.sourceChangeEvent.create({
    data: {
      sourceId,
      sourceUrl: afterSnapshot.sourceUrl || beforeSnapshot.sourceUrl,
      entityType: afterSnapshot.entityType || beforeSnapshot.entityType,
      universitySlug: afterSnapshot.universitySlug ?? beforeSnapshot.universitySlug ?? null,
      courseSlug: afterSnapshot.courseSlug ?? beforeSnapshot.courseSlug ?? null,
      changeType,
      fieldName: afterSnapshot.fieldName ?? beforeSnapshot.fieldName ?? null,
      changedFrom: changedFrom ?? null,
      changedTo: changedTo ?? null,
      contentHashBefore: beforeHash || null,
      contentHashAfter: afterHash || null,
      confidence: 0.5, // initial; AI will refine
      status: "PENDING",
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "SourceChangeEvent",
      resourceId: changeEvent.id,
      details: JSON.stringify({
        sourceId,
        changeType,
        beforeHash,
        afterHash,
        entityType: changeEvent.entityType,
      }),
    },
  });

  return {
    changed: true,
    changeEvent,
    beforeHash,
    afterHash,
  };
}

// ─── AI Evaluation ───

/**
 * Use AI to assess confidence + materiality of a SourceChangeEvent.
 * HIGH materiality events stay PENDING for human review; others auto-advance to AI_REVIEWED.
 */
export async function evaluateSourceChangeWithAI(changeEventId: string) {
  const event = await db.sourceChangeEvent.findUnique({ where: { id: changeEventId } });
  if (!event) {
    throw new Error("SourceChangeEvent not found");
  }
  if (event.status !== "PENDING") {
    return { event, message: `Already in status ${event.status}; skipping AI evaluation.` };
  }

  const systemPrompt =
    "You are a source intelligence analyst for an education consultancy. " +
    "Assess how material a change in an official university source is. " +
    "Respond ONLY as JSON: {\"confidence\":0-1,\"materiality\":\"LOW|MEDIUM|HIGH\",\"assessment\":\"short text\"}";

  const prompt = [
    `Entity Type: ${event.entityType}`,
    `University: ${event.universitySlug || "N/A"}`,
    `Course: ${event.courseSlug || "N/A"}`,
    `Field: ${event.fieldName || "N/A"}`,
    `Change Type: ${event.changeType}`,
    `Changed From: ${event.changedFrom || "(empty)"}`,
    `Changed To: ${event.changedTo || "(empty)"}`,
    `Source URL: ${event.sourceUrl}`,
    "",
    "Assess confidence (0-1) that this change is real and correctly captured, and materiality " +
      "(LOW = cosmetic/typo, MEDIUM = minor detail, HIGH = tuition/deadlines/admission criteria).",
  ].join("\n");

  let confidence = 0.5;
  let materiality = "MEDIUM";
  let assessment = "";

  const aiResponse = await callAiAssessment(prompt, systemPrompt);
  if (aiResponse) {
    try {
      // Extract JSON from response
      const mod: any = await import("@/lib/ai");
      const parsed = mod.extractJson?.(aiResponse) || tryParseJson(aiResponse);
      if (parsed) {
        if (typeof parsed.confidence === "number") confidence = parsed.confidence;
        if (parsed.materiality) materiality = String(parsed.materiality).toUpperCase();
        if (parsed.assessment) assessment = String(parsed.assessment);
      }
    } catch {
      // ignore parse failure — use defaults
    }
    if (!assessment) assessment = aiResponse.slice(0, 500);
  } else {
    assessment = "AI evaluation unavailable — defaulting to MEDIUM materiality.";
  }

  // HIGH materiality stays PENDING for human review; others advance to AI_REVIEWED.
  const newStatus = materiality === "HIGH" ? "PENDING" : "AI_REVIEWED";

  const updated = await db.sourceChangeEvent.update({
    where: { id: changeEventId },
    data: {
      confidence,
      materiality,
      aiAssessment: assessment,
      status: newStatus,
      reviewedAt: newStatus === "AI_REVIEWED" ? new Date() : null,
    },
  });

  return {
    event: updated,
    confidence,
    materiality,
    assessment,
    requiresHumanReview: newStatus === "PENDING",
  };
}

function tryParseJson(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Apply / Reject ───

export async function applySourceChange(changeEventId: string, appliedBy: string) {
  const event = await db.sourceChangeEvent.findUnique({ where: { id: changeEventId } });
  if (!event) throw new Error("SourceChangeEvent not found");

  if (event.status === "APPLIED") {
    return { event, message: "Already applied.", idempotent: true };
  }
  if (event.status === "HUMAN_REJECTED" || event.status === "IGNORED") {
    throw new Error(`Cannot apply — event is in terminal status ${event.status}`);
  }

  const updated = await db.sourceChangeEvent.update({
    where: { id: changeEventId },
    data: {
      status: "APPLIED",
      reviewerId: appliedBy,
      appliedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: appliedBy,
      action: "AI_ACTION",
      resource: "SourceChangeEvent",
      resourceId: changeEventId,
      details: JSON.stringify({ action: "APPLIED", materiality: event.materiality }),
    },
  });

  return { event: updated, message: "Source change applied." };
}

export async function rejectSourceChange(
  changeEventId: string,
  rejectedBy: string,
  reason?: string
) {
  const event = await db.sourceChangeEvent.findUnique({ where: { id: changeEventId } });
  if (!event) throw new Error("SourceChangeEvent not found");

  if (event.status === "HUMAN_REJECTED") {
    return { event, message: "Already rejected.", idempotent: true };
  }

  const updated = await db.sourceChangeEvent.update({
    where: { id: changeEventId },
    data: {
      status: "HUMAN_REJECTED",
      reviewerId: rejectedBy,
      reviewedAt: new Date(),
      aiAssessment: reason
        ? `${event.aiAssessment || ""}\n[REJECTION REASON]: ${reason}`.trim()
        : event.aiAssessment,
    },
  });

  await db.auditLog.create({
    data: {
      userId: rejectedBy,
      action: "AI_ACTION",
      resource: "SourceChangeEvent",
      resourceId: changeEventId,
      details: JSON.stringify({ action: "REJECTED", reason: reason || null }),
    },
  });

  return { event: updated, message: "Source change rejected." };
}

// ─── Research Evidence ───

export interface CreateEvidenceParams {
  universitySlug: string;
  courseSlug?: string | null;
  fieldName: string;
  fieldValue: string;
  sourceUrl: string;
  sourceTitle?: string | null;
  sourceSection?: string | null;
  contentHash?: string | null;
  sourceSnapshot?: string | null;
  confidence?: number;
  aiAgentId?: string | null;
}

export async function createResearchEvidence(params: CreateEvidenceParams) {
  const evidence = await db.universityResearchEvidence.create({
    data: {
      universitySlug: params.universitySlug,
      courseSlug: params.courseSlug ?? null,
      fieldName: params.fieldName,
      fieldValue: params.fieldValue,
      sourceUrl: params.sourceUrl,
      sourceTitle: params.sourceTitle ?? null,
      sourceSection: params.sourceSection ?? null,
      contentHash: params.contentHash ?? null,
      sourceSnapshot: params.sourceSnapshot ?? null,
      confidence: params.confidence ?? 0.5,
      verificationStatus: "NEEDS_REVIEW",
      approvalStatus: "PENDING",
      aiAgentId: params.aiAgentId ?? null,
      retrievedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "UniversityResearchEvidence",
      resourceId: evidence.id,
      details: JSON.stringify({
        universitySlug: params.universitySlug,
        fieldName: params.fieldName,
        sourceUrl: params.sourceUrl,
      }),
    },
  });

  return evidence;
}

export async function verifyEvidence(evidenceId: string, verifierId: string) {
  const evidence = await db.universityResearchEvidence.findUnique({ where: { id: evidenceId } });
  if (!evidence) throw new Error("Evidence not found");

  const updated = await db.universityResearchEvidence.update({
    where: { id: evidenceId },
    data: {
      verificationStatus: "VERIFIED",
      approvalStatus: "APPROVED",
      reviewerId: verifierId,
      updatedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: verifierId,
      action: "AI_ACTION",
      resource: "UniversityResearchEvidence",
      resourceId: evidenceId,
      details: JSON.stringify({ action: "VERIFIED", universitySlug: evidence.universitySlug }),
    },
  });

  return updated;
}

export async function getUniversityEvidenceSummary(universitySlug: string) {
  const [total, verified, needsReview, conflicts, expired, byField] = await Promise.all([
    db.universityResearchEvidence.count({ where: { universitySlug } }),
    db.universityResearchEvidence.count({
      where: { universitySlug, verificationStatus: "VERIFIED" },
    }),
    db.universityResearchEvidence.count({
      where: { universitySlug, verificationStatus: "NEEDS_REVIEW" },
    }),
    db.universityResearchEvidence.count({
      where: { universitySlug, verificationStatus: "CONFLICT_FOUND" },
    }),
    db.universityResearchEvidence.count({
      where: { universitySlug, verificationStatus: "EXPIRED_SOURCE" },
    }),
    db.universityResearchEvidence.groupBy({
      by: ["fieldName"],
      where: { universitySlug },
      _count: { _all: true },
      orderBy: { _count: { fieldName: "desc" } },
    }),
  ]);

  const recentEvidence = await db.universityResearchEvidence.findMany({
    where: { universitySlug },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    universitySlug,
    total,
    verified,
    needsReview,
    conflicts,
    expired,
    byField,
    recentEvidence,
    coverage: total === 0 ? 0 : Math.round((verified / total) * 100),
  };
}
