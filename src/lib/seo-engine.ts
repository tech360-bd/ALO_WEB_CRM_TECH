// ============================================================
// SEO ENGINE
// Analyzes Search Console data, identifies opportunities,
// creates & tracks SEO tasks.
// ============================================================

import { db } from "@/lib/db";

// ─── Types ───

export interface SearchConsoleRow {
  url?: string | null;
  query?: string | null;
  impressions: number;
  clicks: number;
  position: number;
}

export interface AnalyzeResult {
  opportunitiesCreated: number;
  opportunities: Array<{
    id: string;
    opportunityType: string;
    targetUrl: string | null;
    targetQuery: string | null;
    priority: string;
    suggestedAction: string;
  }>;
  skipped: number;
}

// ─── Analyze Search Console Data ───

function computeCtr(clicks: number, impressions: number): number {
  if (!impressions || impressions <= 0) return 0;
  return clicks / impressions;
}

function priorityForOpportunity(
  type: string,
  impressions: number,
  position: number
): string {
  if (type === "HIGH_IMPRESSION_LOW_CTR" && impressions > 1000) return "HIGH";
  if (type === "RANKING_4_20" && impressions > 500) return "HIGH";
  if (type === "CONTENT_GAP") return "MEDIUM";
  if (impressions > 500 || (position > 0 && position < 4)) return "MEDIUM";
  return "LOW";
}

function suggestedActionFor(type: string): string {
  switch (type) {
    case "HIGH_IMPRESSION_LOW_CTR":
      return "Improve title tag and meta description to boost click-through rate.";
    case "RANKING_4_20":
      return "Optimize on-page content, internal links, and refresh freshness to push to top 3.";
    case "CONTENT_GAP":
      return "Create new content targeting this query — currently no ranking page.";
    default:
      return "Review and optimize.";
  }
}

/**
 * Identify SEO opportunities from Search Console metrics.
 * Opportunity types:
 *  - HIGH_IMPRESSION_LOW_CTR: impressions > 100, ctr < 2%
 *  - RANKING_4_20: position between 4 and 20 (page 1 bottom / page 2)
 *  - CONTENT_GAP: query with impressions but no matching URL on our site
 */
export async function analyzeSearchConsoleData(metrics: SearchConsoleRow[]): Promise<AnalyzeResult> {
  const opportunities: AnalyzeResult["opportunities"] = [];
  let skipped = 0;

  for (const row of metrics || []) {
    const ctr = computeCtr(row.clicks, row.impressions);

    let type: string | null = null;
    if (row.impressions > 100 && ctr < 0.02 && row.url) {
      type = "HIGH_IMPRESSION_LOW_CTR";
    } else if (row.position >= 4 && row.position <= 20 && row.url) {
      type = "RANKING_4_20";
    } else if (!row.url && row.query && row.impressions > 50) {
      type = "CONTENT_GAP";
    }

    if (!type) {
      skipped += 1;
      continue;
    }

    // Dedup: skip if same (opportunityType, targetUrl, targetQuery) already OPEN
    const existing = await db.seoOpportunity.findFirst({
      where: {
        opportunityType: type,
        targetUrl: row.url ?? null,
        targetQuery: row.query ?? null,
        status: "OPEN",
      },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    const priority = priorityForOpportunity(type, row.impressions, row.position);
    const opp = await db.seoOpportunity.create({
      data: {
        opportunityType: type,
        targetUrl: row.url ?? null,
        targetQuery: row.query ?? null,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr,
        position: row.position,
        priority,
        status: "OPEN",
        suggestedAction: suggestedActionFor(type),
      },
    });

    opportunities.push({
      id: opp.id,
      opportunityType: opp.opportunityType,
      targetUrl: opp.targetUrl,
      targetQuery: opp.targetQuery,
      priority: opp.priority,
      suggestedAction: opp.suggestedAction ?? "",
    });
  }

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "SeoOpportunity",
      details: JSON.stringify({
        opportunitiesCreated: opportunities.length,
        skipped,
        rowsAnalyzed: metrics?.length || 0,
      }),
    },
  });

  return {
    opportunitiesCreated: opportunities.length,
    opportunities,
    skipped,
  };
}

// ─── Tasks ───

export async function createSeoTask(
  opportunityId: string | null,
  taskType: string,
  title: string,
  description?: string | null
) {
  let opportunity: any = null;
  if (opportunityId) {
    opportunity = await db.seoOpportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity) throw new Error("SeoOpportunity not found");
  }

  const task = await db.seoTask.create({
    data: {
      opportunityId: opportunityId ?? null,
      taskType,
      title,
      description: description ?? null,
      targetUrl: opportunity?.targetUrl ?? null,
      priority: opportunity?.priority ?? "MEDIUM",
      status: "PENDING",
    },
  });

  // If opportunity exists, mark it as IN_PROGRESS
  if (opportunityId && opportunity) {
    await db.seoOpportunity.update({
      where: { id: opportunityId },
      data: { status: "IN_PROGRESS" },
    });
  }

  await db.auditLog.create({
    data: {
      action: "AI_ACTION",
      resource: "SeoTask",
      resourceId: task.id,
      details: JSON.stringify({ taskType, opportunityId }),
    },
  });

  return task;
}

export async function completeSeoTask(taskId: string, completedBy: string) {
  const task = await db.seoTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error("SeoTask not found");
  if (task.status === "COMPLETED") {
    return { task, message: "Already completed.", idempotent: true };
  }

  const updated = await db.seoTask.update({
    where: { id: taskId },
    data: { status: "COMPLETED", assignedTo: completedBy },
  });

  if (task.opportunityId) {
    await db.seoOpportunity.update({
      where: { id: task.opportunityId },
      data: { status: "RESOLVED" },
    }).catch(() => {
      // opportunity may have been deleted; ignore
    });
  }

  await db.auditLog.create({
    data: {
      userId: completedBy,
      action: "AI_ACTION",
      resource: "SeoTask",
      resourceId: taskId,
      details: JSON.stringify({ action: "COMPLETED" }),
    },
  });

  return { task: updated, message: "SEO task completed." };
}

// ─── Stats ───

export async function getSeoStats() {
  const [
    totalOpportunities,
    openOpportunities,
    resolvedOpportunities,
    totalTasks,
    pendingTasks,
    completedTasks,
    byOpportunityType,
    byPriority,
  ] = await Promise.all([
    db.seoOpportunity.count(),
    db.seoOpportunity.count({ where: { status: "OPEN" } }),
    db.seoOpportunity.count({ where: { status: "RESOLVED" } }),
    db.seoTask.count(),
    db.seoTask.count({ where: { status: "PENDING" } }),
    db.seoTask.count({ where: { status: "COMPLETED" } }),
    db.seoOpportunity.groupBy({
      by: ["opportunityType"],
      _count: { _all: true },
    }),
    db.seoOpportunity.groupBy({
      by: ["priority"],
      _count: { _all: true },
    }),
  ]);

  const topOpportunities = await db.seoOpportunity.findMany({
    where: { status: "OPEN" },
    orderBy: [{ impressions: "desc" }],
    take: 10,
  });

  return {
    opportunities: {
      total: totalOpportunities,
      open: openOpportunities,
      resolved: resolvedOpportunities,
      byType: byOpportunityType,
      byPriority,
      top: topOpportunities,
    },
    tasks: {
      total: totalTasks,
      pending: pendingTasks,
      completed: completedTasks,
      completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    },
  };
}
