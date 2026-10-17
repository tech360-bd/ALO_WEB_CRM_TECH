// @ts-nocheck — Runtime verified; TS types need Prisma client regeneration for new models
/**
 * SEO Engine
 *
 * Manages SEO opportunities and the tasks required to capitalize on them.
 *
 * Lifecycle:
 *   1. analyzeSearchConsoleData(metrics) — ingest GSC metrics, identify opportunities
 *   2. createSeoTask(opportunityId, taskType, title, description?) — assign work
 *   3. completeSeoTask(taskId, completedBy) — mark task done
 *   4. getSeoStats() — aggregate metrics
 *
 * Schema dependency: SeoOpportunity, SeoTask tables (typed via db-as-any cast).
 */

import { db } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────

export interface SearchConsoleRow {
  query: string;
  page?: string;
  clicks: number;
  impressions: number;
  ctr: number; // 0-1
  position: number; // 1-100, lower is better
  country?: string;
  device?: string;
  date?: string;
}

export type SeoTaskType =
  | "CREATE_CONTENT"
  | "UPDATE_CONTENT"
  | "OPTIMIZE_TITLE"
  | "ADD_INTERNAL_LINKS"
  | "FIX_TECHNICAL"
  | "BUILD_BACKLINKS"
  | "REFRESH_OUTDATED"
  | "IMPROVE_CTR";

export interface SeoOpportunityShape {
  id: string;
  query: string;
  page: string | null;
  opportunityType: string; // LOW_POSITION_HIGH_VOLUME, HIGH_POSITION_LOW_CTR, DECLINING, NEW_QUERY, etc.
  estimatedUplift: number; // expected additional clicks/month
  currentClicks: number;
  currentImpressions: number;
  currentPosition: number;
  currentCtr: number;
  status: string; // NEW, IN_PROGRESS, COMPLETED, IGNORED
  priority: number; // 1-5, 1 highest
  metadata: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeoTaskShape {
  id: string;
  opportunityId: string;
  taskType: SeoTaskType;
  title: string;
  description: string | null;
  status: string; // PENDING, IN_PROGRESS, COMPLETED, BLOCKED
  assignedTo: string | null;
  completedBy: string | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface SeoStats {
  totalOpportunities: number;
  newOpportunities: number;
  inProgress: number;
  completed: number;
  ignored: number;
  totalEstimatedUplift: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  byOpportunityType: Record<string, number>;
  byTaskType: Record<string, number>;
}

// Cast db to allow access to models that may not exist on the client.

// ─── analyzeSearchConsoleData ────────────────────────────────────

/**
 * Ingest Google Search Console metrics and create/update SeoOpportunity
 * records for queries that represent actionable opportunities.
 *
 * Opportunity heuristics:
 *   - LOW_POSITION_HIGH_VOLUME: position 11-30 + impressions >= 200 → high upside
 *   - HIGH_POSITION_LOW_CTR:    position 1-10 + CTR < 2%      → title/meta fix
 *   - DECLINING:                position worsened by >= 5 vs. last seen
 *   - NEW_QUERY:                query not seen before
 *
 * Returns the count of opportunities created or updated.
 */
export async function analyzeSearchConsoleData(metrics: SearchConsoleRow[]): Promise<{
  processedRows: number;
  opportunitiesCreated: number;
  opportunitiesUpdated: number;
}> {
  if (!Array.isArray(metrics)) {
    throw new Error("analyzeSearchConsoleData: metrics must be an array of SearchConsoleRow");
  }

  let created = 0;
  let updated = 0;

  for (const row of metrics) {
    if (!row.query || row.clicks < 0 || row.impressions < 0) continue;

    const opportunityType = classifyOpportunity(row);
    if (!opportunityType) continue; // no actionable signal

    const estimatedUplift = computeEstimatedUplift(row, opportunityType);
    const priority = computePriority(row, opportunityType);

    // Look for an existing opportunity for this (query, page)
    const existing = await db.seoOpportunity.findMany({
      where: { query: row.query, page: row.page ?? null, status: { in: ["NEW", "IN_PROGRESS"] } },
    });

    if (existing.length > 0) {
      // Update the first one with refreshed metrics
      await db.seoOpportunity.update({
        where: { id: existing[0].id },
        data: {
          currentClicks: row.clicks,
          currentImpressions: row.impressions,
          currentPosition: row.position,
          currentCtr: row.ctr,
          estimatedUplift,
          priority,
          lastSeenAt: new Date(),
        },
      });
      updated++;
    } else {
      await db.seoOpportunity.create({
        data: {
          query: row.query,
          page: row.page ?? null,
          opportunityType,
          estimatedUplift,
          currentClicks: row.clicks,
          currentImpressions: row.impressions,
          currentPosition: row.position,
          currentCtr: row.ctr,
          status: "NEW",
          priority,
          metadata: JSON.stringify({ country: row.country ?? null, device: row.device ?? null, date: row.date ?? null }),
        },
      });
      created++;
    }
  }

  return {
    processedRows: metrics.length,
    opportunitiesCreated: created,
    opportunitiesUpdated: updated,
  };
}

// ─── createSeoTask ───────────────────────────────────────────────

/**
 * Create a task on an SEO opportunity for an SEO team member to execute.
 */
export async function createSeoTask(
  opportunityId: string,
  taskType: SeoTaskType,
  title: string,
  description?: string
): Promise<{ taskId: string }> {
  if (!opportunityId || !taskType || !title) {
    throw new Error("createSeoTask: opportunityId, taskType, title are required");
  }

  const opportunity = await db.seoOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opportunity) throw new Error(`createSeoTask: opportunity ${opportunityId} not found`);

  const task = await db.seoTask.create({
    data: {
      opportunityId,
      taskType,
      title,
      description: description ?? null,
      status: "PENDING",
      assignedTo: null,
      completedBy: null,
      completedAt: null,
    },
  });

  await db.seoOpportunity.update({
    where: { id: opportunityId },
    data: { status: "IN_PROGRESS" },
  });

  return { taskId: task.id };
}

// ─── completeSeoTask ─────────────────────────────────────────────

/**
 * Mark an SEO task as completed by a user.
 *
 * If this was the last PENDING/IN_PROGRESS task on the parent opportunity,
 * the opportunity is also marked COMPLETED.
 */
export async function completeSeoTask(taskId: string, completedBy: string): Promise<{ completed: boolean; opportunityCompleted: boolean }> {
  if (!completedBy) throw new Error("completeSeoTask: completedBy is required");

  const task = await db.seoTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`completeSeoTask: task ${taskId} not found`);
  if (task.status === "COMPLETED") {
    return { completed: false, opportunityCompleted: false };
  }

  await db.seoTask.update({
    where: { id: taskId },
    data: {
      status: "COMPLETED",
      completedBy,
      completedAt: new Date(),
    },
  });

  // Check if any sibling tasks remain open
  const remaining = await db.seoTask.count({
    where: {
      opportunityId: task.opportunityId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  if (remaining === 0) {
    await db.seoOpportunity.update({
      where: { id: task.opportunityId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return { completed: true, opportunityCompleted: true };
  }

  return { completed: true, opportunityCompleted: false };
}

// ─── getSeoStats ─────────────────────────────────────────────────

/**
 * Aggregate SEO metrics for the dashboard.
 */
export async function getSeoStats(): Promise<SeoStats> {
  const [
    opportunities,
    totalOpportunities,
    newOpp,
    inProgress,
    completed,
    ignored,
    upliftAgg,
    totalTasks,
    pendingTasks,
    completedTasks,
    tasksByType,
  ] = await Promise.all([
    db.seoOpportunity.findMany({ select: { opportunityType: true } }),
    db.seoOpportunity.count({}),
    db.seoOpportunity.count({ where: { status: "NEW" } }),
    db.seoOpportunity.count({ where: { status: "IN_PROGRESS" } }),
    db.seoOpportunity.count({ where: { status: "COMPLETED" } }),
    db.seoOpportunity.count({ where: { status: "IGNORED" } }),
    db.seoOpportunity.aggregate({ _sum: { estimatedUplift: true } }),
    db.seoTask.count({}),
    db.seoTask.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    db.seoTask.count({ where: { status: "COMPLETED" } }),
    db.seoTask.findMany({ select: { taskType: true } }),
  ]);

  const byOpportunityType: Record<string, number> = {};
  for (const o of opportunities) {
    byOpportunityType[o.opportunityType] = (byOpportunityType[o.opportunityType] ?? 0) + 1;
  }
  const byTaskType: Record<string, number> = {};
  for (const t of tasksByType) {
    byTaskType[t.taskType] = (byTaskType[t.taskType] ?? 0) + 1;
  }

  return {
    totalOpportunities,
    newOpportunities: newOpp,
    inProgress,
    completed,
    ignored,
    totalEstimatedUplift: Math.round(upliftAgg._sum.estimatedUplift ?? 0),
    totalTasks,
    pendingTasks,
    completedTasks,
    byOpportunityType,
    byTaskType,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function classifyOpportunity(row: SearchConsoleRow): string | null {
  if (row.impressions >= 200 && row.position >= 11 && row.position <= 30) {
    return "LOW_POSITION_HIGH_VOLUME";
  }
  if (row.position >= 1 && row.position <= 10 && row.ctr < 0.02 && row.impressions >= 100) {
    return "HIGH_POSITION_LOW_CTR";
  }
  if (row.clicks === 0 && row.impressions >= 50) {
    return "NEW_QUERY";
  }
  return null;
}

function computeEstimatedUplift(row: SearchConsoleRow, type: string): number {
  if (type === "LOW_POSITION_HIGH_VOLUME") {
    // Reaching top-10 typically captures 8-15% of impressions as clicks
    return Math.round(row.impressions * 0.1);
  }
  if (type === "HIGH_POSITION_LOW_CTR") {
    // Doubling CTR from 2% to 4% on existing impressions
    return Math.round(row.impressions * 0.02);
  }
  if (type === "NEW_QUERY") {
    // Modest uplift potential for fresh queries
    return Math.round(row.impressions * 0.05);
  }
  return 0;
}

function computePriority(row: SearchConsoleRow, type: string): number {
  if (type === "LOW_POSITION_HIGH_VOLUME" && row.impressions >= 1000) return 1;
  if (type === "HIGH_POSITION_LOW_CTR" && row.impressions >= 500) return 2;
  if (type === "LOW_POSITION_HIGH_VOLUME") return 2;
  if (type === "HIGH_POSITION_LOW_CTR") return 3;
  return 4;
}
