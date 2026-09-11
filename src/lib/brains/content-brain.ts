/**
 * Content Brain — detects content opportunities, assigns them to agents,
 * tracks status progression, and computes content opportunity stats.
 *
 * NEVER fabricates data. All stats REAL from DB.
 */

import { db } from "@/lib/db";

export interface ContentSignal {
  topic: string;
  country?: string;
  universitySlug?: string;
  courseSlug?: string;
  scholarshipSlug?: string;
  searchIntent?: string;
  audience?: string;
  sourceEvidence?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  estimatedUsefulness?: number;
  contentType?: string;
  recommendedChannels?: string;
  competitionSignal?: string;
  conversionRelationship?: string;
}

/**
 * Scan inbound channels (FormSubmissions, WhatsApp messages, Facebook leads)
 * to detect recurring topics that justify new content. Returns REAL signals.
 */
export async function collectContentSignals() {
  const signals: ContentSignal[] = [];

  // 1. Aggregate Lead preferredCountry + preferredCourse counts (top 10)
  const leadCountryGroups = await db.lead.groupBy({
    by: ["preferredCountry"],
    _count: true,
    orderBy: { _count: { preferredCountry: "desc" } },
    take: 10,
  });
  for (const g of leadCountryGroups) {
    if (!g.preferredCountry) continue;
    const count = g._count;
    if (count < 2) continue;
    signals.push({
      topic: `Study in ${g.preferredCountry} — high lead interest`,
      country: g.preferredCountry,
      audience: "Prospective students",
      sourceEvidence: `${count} leads mentioned this country`,
      priority: count >= 5 ? "HIGH" : "MEDIUM",
      estimatedUsefulness: Math.min(100, count * 10),
      contentType: "COUNTRY_GUIDE",
      recommendedChannels: "BLOG,WHATSAPP_STATUS,FACEBOOK",
    });
  }

  // 2. Aggregate Lead preferredCourse
  const leadCourseGroups = await db.lead.groupBy({
    by: ["preferredCourse"],
    _count: true,
    orderBy: { _count: { preferredCourse: "desc" } },
    take: 10,
  });
  for (const g of leadCourseGroups) {
    if (!g.preferredCourse) continue;
    const count = g._count;
    if (count < 2) continue;
    signals.push({
      topic: `${g.preferredCourse} — recurring lead interest`,
      audience: "Prospective students",
      sourceEvidence: `${count} leads asked about this course`,
      priority: count >= 5 ? "HIGH" : "MEDIUM",
      estimatedUsefulness: Math.min(100, count * 10),
      contentType: "COURSE_GUIDE",
      recommendedChannels: "BLOG,INSTAGRAM",
    });
  }

  // 3. WhatsApp inbound message keywords (top unmatched)
  const waMessages = await db.socialInboxMessage.findMany({
    where: { platform: "WHATSAPP", direction: "INBOUND", keywordTriggered: null },
    select: { messageText: true },
    take: 200,
  });
  const keywordCounts: Record<string, number> = {};
  for (const m of waMessages) {
    if (!m.messageText) continue;
    const tokens = m.messageText.toLowerCase().split(/\W+/).filter((t) => t.length > 4);
    for (const t of tokens) {
      keywordCounts[t] = (keywordCounts[t] || 0) + 1;
    }
  }
  const topKeywords = Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  for (const [kw, count] of topKeywords) {
    if (count < 3) continue;
    signals.push({
      topic: `"${kw}" — trending WhatsApp inquiry`,
      audience: "Bangladeshi students",
      sourceEvidence: `${count} WhatsApp messages mentioned "${kw}"`,
      priority: count >= 8 ? "HIGH" : "MEDIUM",
      estimatedUsefulness: Math.min(100, count * 8),
      contentType: "FAQ",
      recommendedChannels: "BLOG,WHATSAPP_STATUS",
    });
  }

  return signals;
}

/**
 * Persist a single content opportunity from a signal.
 */
export async function identifyContentOpportunity(signal: ContentSignal) {
  return db.contentOpportunity.create({
    data: {
      topic: signal.topic,
      country: signal.country || null,
      universitySlug: signal.universitySlug || null,
      courseSlug: signal.courseSlug || null,
      scholarshipSlug: signal.scholarshipSlug || null,
      searchIntent: signal.searchIntent || null,
      audience: signal.audience || null,
      sourceEvidence: signal.sourceEvidence || null,
      priority: signal.priority || "MEDIUM",
      estimatedUsefulness: signal.estimatedUsefulness || 0,
      contentType: signal.contentType || null,
      recommendedChannels: signal.recommendedChannels || null,
      competitionSignal: signal.competitionSignal || null,
      conversionRelationship: signal.conversionRelationship || null,
      status: "DISCOVERED",
      freshness: "FRESH",
    },
  });
}

/**
 * Assign an opportunity to one or more agents based on the assignedDepartment.
 * NEVER creates new agents — only updates assignment fields on the opportunity.
 */
export async function assignOpportunityToAgents(
  opportunityId: string,
  agentIds?: string[]
) {
  const opp = await db.contentOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error(`Opportunity not found: ${opportunityId}`);

  // If no agentIds provided, auto-find agents with content-brain skills
  let selectedAgentIds = agentIds || [];
  if (selectedAgentIds.length === 0) {
    const contentAgents = await db.agentSkillExtension.findMany({
      where: { brain: "content", status: "ACTIVE" },
      select: { agentId: true },
      distinct: ["agentId"],
    });
    selectedAgentIds = contentAgents.map((a) => a.agentId);
  }

  // Verify all agents exist — never create new
  if (selectedAgentIds.length > 0) {
    const validAgents = await db.aiAgent.findMany({
      where: { id: { in: selectedAgentIds } },
      select: { id: true },
    });
    selectedAgentIds = selectedAgentIds.filter((id) =>
      validAgents.some((a) => a.id === id)
    );
  }

  return db.contentOpportunity.update({
    where: { id: opportunityId },
    data: {
      assignedAgentIds: JSON.stringify(selectedAgentIds),
      assignedDepartment: opp.assignedDepartment || "Marketing",
      status: "ASSIGNED",
    },
  });
}

export interface OpportunityFilters {
  status?: string;
  priority?: string;
  country?: string;
  universitySlug?: string;
  courseSlug?: string;
  limit?: number;
  offset?: number;
}

export async function getContentOpportunities(filters: OpportunityFilters = {}) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.country) where.country = filters.country;
  if (filters.universitySlug) where.universitySlug = filters.universitySlug;
  if (filters.courseSlug) where.courseSlug = filters.courseSlug;

  const limit = Math.min(filters.limit || 50, 200);
  const offset = filters.offset || 0;

  const [items, total] = await Promise.all([
    db.contentOpportunity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    db.contentOpportunity.count({ where }),
  ]);

  return { items, total };
}

/**
 * Advance an opportunity through its lifecycle:
 *   DISCOVERED → ASSIGNED → IN_PROGRESS → REVIEW → PUBLISHED
 */
export async function advanceOpportunityStatus(
  opportunityId: string,
  newStatus: string
) {
  const validStatuses = ["DISCOVERED", "ASSIGNED", "IN_PROGRESS", "REVIEW", "PUBLISHED", "ARCHIVED"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}. Valid: ${validStatuses.join(", ")}`);
  }

  const opp = await db.contentOpportunity.findUnique({ where: { id: opportunityId } });
  if (!opp) throw new Error(`Opportunity not found: ${opportunityId}`);

  return db.contentOpportunity.update({
    where: { id: opportunityId },
    data: { status: newStatus },
  });
}

export async function getContentOpportunityStats() {
  const total = await db.contentOpportunity.count();
  const byStatus = await db.contentOpportunity.groupBy({
    by: ["status"],
    _count: true,
  });
  const byPriority = await db.contentOpportunity.groupBy({
    by: ["priority"],
    _count: true,
  });
  const byCountry = await db.contentOpportunity.groupBy({
    by: ["country"],
    _count: true,
    orderBy: { _count: { country: "desc" } },
    take: 10,
  });
  const byContentType = await db.contentOpportunity.groupBy({
    by: ["contentType"],
    _count: true,
  });
  const assigned = await db.contentOpportunity.count({
    where: { assignedAgentIds: { not: null } },
  });

  return {
    total,
    assigned,
    unassigned: total - assigned,
    byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
    byPriority: byPriority.map((p: any) => ({ priority: p.priority, count: p._count })),
    byCountry: byCountry.map((c: any) => ({
      country: c.country || "GLOBAL",
      count: c._count,
    })),
    byContentType: byContentType.map((c: any) => ({
      contentType: c.contentType || "UNKNOWN",
      count: c._count,
    })),
  };
}
