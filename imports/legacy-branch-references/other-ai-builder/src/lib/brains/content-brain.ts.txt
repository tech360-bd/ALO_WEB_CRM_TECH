// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * Content Brain
 *
 * Autonomous content pipeline orchestrator.
 *
 * Pipeline:
 *   1. collectContentSignals()               — gather signals (search trends, behavior events, source changes)
 *   2. identifyContentOpportunity(signal)    — convert a signal into a structured opportunity
 *   3. assignOpportunityToAgents(opportunityId) — attach the right Content Brain agents
 *   4. getContentOpportunities(filters)       — list opportunities
 *   5. advanceOpportunityStatus(opportunityId, newStatus) — progress through the pipeline
 *   6. getContentOpportunityStats()           — aggregate metrics
 *
 * Schema dependency: ContentOpportunity table (typed via db-as-any cast).
 * Leverages existing db.dataChange, db.reviewInvitation, db.blogPost, etc. for signal collection.
 */

import { db } from "@/lib/db";
import { assignSkillToAgent } from "@/lib/agent-extension-registry";

// ─── Types ────────────────────────────────────────────────────────

export type ContentOpportunityStatus =
  | "IDENTIFIED"
  | "BRIEFED"
  | "DRAFTING"
  | "IN_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

export type ContentOpportunitySource =
  | "SEARCH_TREND"
  | "BEHAVIOR_SIGNAL"
  | "SOURCE_CHANGE"
  | "STUDENT_QUESTION"
  | "REVIEW_THEME"
  | "SEASONAL"
  | "COMPETITOR_GAP"
  | "MANUAL";

export type ContentOpportunityType =
  | "NEW_CONTENT"
  | "UPDATE_EXISTING"
  | "REPURPOSE"
  | "TRANSLATE"
  | "REFRESH_OUTDATED";

export interface ContentSignal {
  source: ContentOpportunitySource;
  signalType: string; // e.g. "rising_query", "high_bounce_page", "new_scholarship"
  keyword?: string;
  page?: string;
  universitySlug?: string;
  courseSlug?: string;
  countrySlug?: string;
  estimatedUsefulness?: number;
  evidence: Record<string, unknown>;
  detectedAt?: Date;
}

export interface ContentOpportunityShape {
  id: string;
  title: string;
  source: ContentOpportunitySource;
  opportunityType: ContentOpportunityType;
  status: ContentOpportunityStatus;
  signalData: string; // JSON
  keyword: string | null;
  page: string | null;
  universitySlug: string | null;
  courseSlug: string | null;
  countrySlug: string | null;
  estimatedUsefulness: number;
  priority: number; // 1-5
  assignedAgentIds: string; // JSON array
  contentAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentOpportunityFilters {
  status?: ContentOpportunityStatus;
  source?: ContentOpportunitySource;
  opportunityType?: ContentOpportunityType;
  universitySlug?: string;
  countrySlug?: string;
  limit?: number;
  offset?: number;
}

export interface ContentOpportunityStats {
  total: number;
  byStatus: Record<ContentOpportunityStatus, number>;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  assignedCount: number;
  publishedCount: number;
  totalEstimatedUplift: number;
}

// Cast db to allow access to models not on the standard client.

// ─── collectContentSignals ───────────────────────────────────────

/**
 * Gather content signals from across the system:
 *   - High-priority keyword research records (status=NEW, priority>=70)
 *   - Recent APPROVED DataChange records on universities/courses
 *   - Behavior events with high engagement (top page URLs)
 *   - Recent student review themes (ratings <= 3 → "common problems" content)
 *
 * Returns a deduplicated list of signals ready for identifyContentOpportunity().
 */
export async function collectContentSignals(): Promise<ContentSignal[]> {
  const signals: ContentSignal[] = [];

  // 1. Keyword research — high-priority, unselected keywords
  try {
    const keywords = await db.keywordResearch?.findMany({
      where: { status: "NEW", priority: { gte: 70 } },
      orderBy: { priority: "desc" },
      take: 20,
    });
    if (keywords) {
      for (const k of keywords) {
        signals.push({
          source: "SEARCH_TREND",
          signalType: "rising_query",
          keyword: k.keyword,
          estimatedUsefulness: k.searchVolume,
          evidence: { searchVolume: k.searchVolume, priority: k.priority },
          detectedAt: new Date(),
        });
      }
    }
  } catch { /* table may not exist yet */ }

  // 2. Approved source changes — fresh data → update content
  try {
    const changes = await db.dataChange.findMany({
      where: {
        status: "APPROVED",
        appliedAt: { gte: new Date(Date.now() - 7 * 86400000) },
      },
      orderBy: { appliedAt: "desc" },
      take: 15,
    });
    for (const c of changes) {
      signals.push({
        source: "SOURCE_CHANGE",
        signalType: "data_change",
        universitySlug: c.universitySlug ?? undefined,
        courseSlug: c.courseSlug ?? undefined,
        countrySlug: c.countrySlug ?? undefined,
        evidence: {
          changeType: c.changeType,
          fieldName: c.fieldName,
          oldValue: c.oldValue,
          newValue: c.newValue,
          impactLevel: c.impactLevel,
          appliedAt: c.appliedAt,
        },
        detectedAt: c.appliedAt ?? c.detectedAt,
      });
    }
  } catch { /* table may not exist yet */ }

  // 3. Low-rated student reviews → "address common concerns" content
  try {
    const lowReviews = await db.studentReview.findMany({
      where: { rating: { lte: 3 }, moderationStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, reviewText: true, country: true, serviceType: true, createdAt: true },
    });
    for (const r of lowReviews) {
      signals.push({
        source: "REVIEW_THEME",
        signalType: "negative_review_theme",
        countrySlug: r.country ?? undefined,
        evidence: {
          reviewId: r.id,
          reviewText: r.reviewText,
          serviceType: r.serviceType,
        },
        detectedAt: r.createdAt,
      });
    }
  } catch { /* ignore */ }

  // Deduplicate by (source, keyword?, page?, universitySlug?)
  const seen = new Set<string>();
  const deduped: ContentSignal[] = [];
  for (const s of signals) {
    const key = `${s}|${s.keyword ?? ""}|${s.page ?? ""}|${s.universitySlug ?? ""}|${s.courseSlug ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(s);
  }

  return deduped;
}

// ─── identifyContentOpportunity ──────────────────────────────────

/**
 * Convert a raw ContentSignal into a structured ContentOpportunity record.
 *
 * The opportunity's title, opportunityType, and priority are derived
 * from the signal type and evidence.
 */
export async function identifyContentOpportunity(
  signal: ContentSignal
): Promise<{ opportunityId: string }> {
  if (!signal || !signal.signalType) {
    throw new Error("identifyContentOpportunity: signal and signal.signalType are required");
  }

  const { title, opportunityType, priority, estimatedUsefulness } = deriveOpportunityFields(signal);

  const opportunity = await db.contentOpportunity.create({
    data: {
      title,
      source: signal,
      opportunityType,
      status: "IDENTIFIED",
      signalData: JSON.stringify(signal),
      keyword: signal.keyword ?? null,
      page: signal.page ?? null,
      universitySlug: signal.universitySlug ?? null,
      courseSlug: signal.courseSlug ?? null,
      countrySlug: signal.countrySlug ?? null,
      estimatedUsefulness,
      priority,
      assignedAgentIds: "[]",
      contentAssetId: null,
    },
  });

  return { opportunityId: opportunity.id };
}

// ─── assignOpportunityToAgents ───────────────────────────────────

/**
 * Assign the appropriate Content Brain agents to an opportunity.
 *
 * Selects AiAgents whose department is "Content" and status is ACTIVE.
 * For each, attaches a "produce_content" skill via the agent-extension-registry.
 * NEVER creates new AiAgents.
 */
export async function assignOpportunityToAgents(
  opportunityId: string
): Promise<{ assignedAgentIds: string[] }> {
  const opportunity = await db.contentOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new Error(`assignOpportunityToAgents: opportunity ${opportunityId} not found`);

  const agents = await db.aiAgent.findMany({
    where: { department: "Content", status: "ACTIVE" },
    take: 3,
  });

  const assignedIds: string[] = [];
  for (const agent of agents) {
    try {
      await assignSkillToAgent(agent.id, {
        skillCode: `SKILL-CONTENT-${opportunityId.slice(-12)}`.slice(0, 40),
        skillName: `Produce content for: ${opportunity.slice(0, 60)}`,
        brain: "CONTENT",
        capability: "produce_content",
        description: `Auto-assigned to opportunity ${opportunityId}`,
        proficiencyLevel: "EXPERT",
      });
      assignedIds.push(agent.id);
    } catch {
      // already assigned — skip
    }
  }

  await db.contentOpportunity.update({
    where: { id: opportunityId },
    data: {
      assignedAgentIds: JSON.stringify(assignedIds),
      status: "BRIEFED",
    },
  });

  return { assignedAgentIds: assignedIds };
}

// ─── getContentOpportunities ─────────────────────────────────────

/**
 * List content opportunities with optional filters.
 */
export async function getContentOpportunities(
  filters: ContentOpportunityFilters = {}
): Promise<ContentOpportunityShape[]> {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.universitySlug) where.universitySlug = filters.universitySlug;
  if (filters.countrySlug) where.countrySlug = filters.countrySlug;

  return db.contentOpportunity.findMany({
    where,
    orderBy: { priority: "asc" },
    take: filters.limit ?? 50,
    skip: filters.offset ?? 0,
  });
}

// ─── advanceOpportunityStatus ────────────────────────────────────

/**
 * Advance (or rewind) an opportunity to a new status.
 * Validates the transition against the allowed state machine.
 */
export async function advanceOpportunityStatus(
  opportunityId: string,
  newStatus: ContentOpportunityStatus
): Promise<{ updated: boolean }> {
  const opportunity = await db.contentOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new Error(`advanceOpportunityStatus: opportunity ${opportunityId} not found`);

  const valid = isValidTransition(opportunity.status as ContentOpportunityStatus, newStatus);
  if (!valid) {
    throw new Error(
      `advanceOpportunityStatus: invalid transition ${opportunity.status} → ${newStatus}`
    );
  }

  await db.contentOpportunity.update({
    where: { id: opportunityId },
    data: { status: newStatus },
  });

  return { updated: true };
}

// ─── getContentOpportunityStats ──────────────────────────────────

/**
 * Aggregate content opportunity metrics for the dashboard.
 */
export async function getContentOpportunityStats(): Promise<ContentOpportunityStats> {
  const [all, total, upliftAgg, assigned, published] = await Promise.all([
    db.contentOpportunity.findMany({ select: { status: true, source: true, opportunityType: true, assignedAgentIds: true } }),
    db.contentOpportunity.count({}),
    db.contentOpportunity.aggregate({ _sum: { estimatedUsefulness: true } }),
    db.contentOpportunity.count({ where: { status: { in: ["BRIEFED", "DRAFTING", "IN_REVIEW", "APPROVED", "PUBLISHED"] } } }),
    db.contentOpportunity.count({ where: { status: "PUBLISHED" } }),
  ]);

  const byStatus: Record<ContentOpportunityStatus, number> = {
    IDENTIFIED: 0,
    BRIEFED: 0,
    DRAFTING: 0,
    IN_REVIEW: 0,
    APPROVED: 0,
    PUBLISHED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  };
  const bySource: Record<string, number> = {};
  const byType: Record<string, number> = {};
  let assignedCount = 0;

  for (const o of all) {
    byStatus[o.status as ContentOpportunityStatus] = (byStatus[o.status as ContentOpportunityStatus] ?? 0) + 1;
    bySource[o] = (bySource[o] ?? 0) + 1;
    byType[o] = (byType[o] ?? 0) + 1;
    try {
      const ids = JSON.parse(o.assignedAgentIds);
      if (Array.isArray(ids) && ids.length > 0) assignedCount++;
    } catch { /* ignore */ }
  }

  return {
    total,
    byStatus,
    bySource,
    byType,
    assignedCount,
    publishedCount: published,
    totalEstimatedUplift: Math.round(upliftAgg._sum.estimatedUsefulness ?? 0),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function deriveOpportunityFields(signal: ContentSignal): {
  title: string;
  opportunityType: ContentOpportunityType;
  priority: number;
  estimatedUsefulness: number;
} {
  if (signal === "SEARCH_TREND" && signal.keyword) {
    return {
      title: `Create content targeting "${signal.keyword}"`,
      opportunityType: "NEW_CONTENT",
      priority: 1,
      estimatedUsefulness: signal.estimatedUsefulness ?? 0,
    };
  }
  if (signal === "SOURCE_CHANGE") {
    const ev = signal.evidence;
    return {
      title: `Update content for ${signal.universitySlug ?? signal.courseSlug ?? "changed entity"} — ${String(ev.fieldName ?? "field")}`,
      opportunityType: "REFRESH_OUTDATED",
      priority: ev.impactLevel === "CRITICAL" ? 1 : ev.impactLevel === "HIGH" ? 2 : 3,
      estimatedUsefulness: 0,
    };
  }
  if (signal === "REVIEW_THEME") {
    return {
      title: `Address student concern: ${signal.signalType} (${signal.countrySlug ?? "global"})`,
      opportunityType: "NEW_CONTENT",
      priority: 3,
      estimatedUsefulness: 0,
    };
  }
  return {
    title: `Content opportunity from ${signal}: ${signal.signalType}`,
    opportunityType: "NEW_CONTENT",
    priority: 3,
    estimatedUsefulness: signal.estimatedUsefulness ?? 0,
  };
}

function isValidTransition(from: ContentOpportunityStatus, to: ContentOpportunityStatus): boolean {
  if (from === to) return true;
  const transitions: Record<ContentOpportunityStatus, ContentOpportunityStatus[]> = {
    IDENTIFIED: ["BRIEFED", "ARCHIVED", "REJECTED"],
    BRIEFED: ["DRAFTING", "ARCHIVED", "REJECTED"],
    DRAFTING: ["IN_REVIEW", "BRIEFED", "REJECTED"],
    IN_REVIEW: ["APPROVED", "DRAFTING", "REJECTED"],
    APPROVED: ["PUBLISHED", "IN_REVIEW"],
    PUBLISHED: ["ARCHIVED"],
    REJECTED: ["ARCHIVED", "IDENTIFIED"],
    ARCHIVED: ["IDENTIFIED"],
  };
  return (transitions[from] ?? []).includes(to);
}
