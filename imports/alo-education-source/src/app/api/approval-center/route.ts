import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/approval-center
// Unified Human Approval Center (per master brief §25)
// Aggregates pending approvals from multiple sources:
//   - AI Command Actions (CRM modifications pending approval)
//   - University Monitoring changes (pending review)
//   - Communication Drafts (AI-drafted replies pending approval)
export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("source") || "ALL";
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "50"), 200);

  const items: any[] = [];

  // 1. AI Command Actions pending approval
  if (source === "ALL" || source === "AI_COMMAND") {
    try {
      const actions = await db.aiCommandAction.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      for (const a of actions) {
        items.push({
          id: a.id,
          source: "AI_COMMAND",
          type: a.actionType,
          targetType: a.targetType,
          targetId: a.targetId,
          payload: a.payload,
          riskLevel: a.riskLevel,
          riskFlags: a.riskFlags,
          requestedBy: a.requestedBy,
          createdAt: a.createdAt,
          title: `${a.actionType.replace(/_/g, " ")} — ${a.targetType}`,
          description: `Risk: ${a.riskLevel}. ${JSON.parse(a.riskFlags || "[]").join(", ") || "No flags"}`,
        });
      }
    } catch {}
  }

  // 2. University Monitoring changes pending review
  if (source === "ALL" || source === "UNIVERSITY_MONITORING") {
    try {
      const changes = await db.dataChange.findMany({
        where: { status: "PENDING_REVIEW" },
        orderBy: { detectedAt: "desc" },
        take: limit,
      });
      for (const c of changes) {
        items.push({
          id: c.id,
          source: "UNIVERSITY_MONITORING",
          type: "UNIVERSITY_CHANGE",
          targetType: c.entityType || "UniversityPage",
          targetId: c.universitySlug || c.id,
          payload: JSON.stringify({ field: c.fieldName, oldValue: c.oldValue, newValue: c.newValue }),
          riskLevel: c.changeType.includes("CLOSED") || c.changeType.includes("CONFLICT") ? "HIGH" : "MEDIUM",
          riskFlags: "[]",
          requestedBy: "system",
          createdAt: c.detectedAt,
          title: `${c.fieldName} changed`,
          description: `Old: ${c.oldValue?.slice(0, 50)} → New: ${c.newValue?.slice(0, 50)}`,
        });
      }
    } catch {}
  }

  // 3. Communication Drafts pending approval
  if (source === "ALL" || source === "COMMUNICATION") {
    try {
      const drafts = await db.communicationDraft.findMany({
        where: { status: "DRAFT" },
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      for (const d of drafts) {
        items.push({
          id: d.id,
          source: "COMMUNICATION",
          type: "AI_DRAFT_REPLY",
          targetType: "CommunicationDraft",
          targetId: d.id,
          payload: JSON.stringify({ channel: d.channel, body: d.draftBody?.slice(0, 200) }),
          riskLevel: d.riskLevel,
          riskFlags: d.riskFlags,
          requestedBy: d.createdBy || "ai",
          createdAt: d.createdAt,
          title: `AI Draft (${d.channel}) — Risk: ${d.riskLevel}`,
          description: d.draftBody?.slice(0, 100) || "Draft reply pending approval",
        });
      }
    } catch {}
  }

  // Sort by risk level (CRITICAL > HIGH > MEDIUM > LOW) then by date
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  items.sort((a, b) => {
    const ra = riskOrder[a.riskLevel as keyof typeof riskOrder] ?? 4;
    const rb = riskOrder[b.riskLevel as keyof typeof riskOrder] ?? 4;
    if (ra !== rb) return ra - rb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Stats
  const stats = {
    total: items.length,
    critical: items.filter(i => i.riskLevel === "CRITICAL").length,
    high: items.filter(i => i.riskLevel === "HIGH").length,
    medium: items.filter(i => i.riskLevel === "MEDIUM").length,
    low: items.filter(i => i.riskLevel === "LOW").length,
    bySource: {
      AI_COMMAND: items.filter(i => i.source === "AI_COMMAND").length,
      UNIVERSITY_MONITORING: items.filter(i => i.source === "UNIVERSITY_MONITORING").length,
      COMMUNICATION: items.filter(i => i.source === "COMMUNICATION").length,
    },
  };

  return NextResponse.json({ items, stats });
}
