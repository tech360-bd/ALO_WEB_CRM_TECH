import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lead pipeline stages: new -> contacted -> qualified -> assigned -> converted | lost
const PIPELINE_ORDER = ["new", "contacted", "qualified", "assigned", "converted", "lost"];

// GET — leads grouped by pipeline stage + assignment + follow-up + scoring
export const GET = withAuth(async (req: Request, _auth: AuthContext) => {
  const status = new URL(req.url).searchParams.get("status");
  const where: any = {};
  if (status && status !== "ALL") where.status = status;

  const leads = await db.marketingLead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  }).catch(() => []);

  // Group by status
  const byStatus: Record<string, typeof leads> = {};
  for (const l of leads) {
    const s = l.status || "new";
    if (!byStatus[s]) byStatus[s] = [];
    byStatus[s].push(l);
  }

  // Overdue follow-ups
  const overdue = leads.filter((l: any) => l.followUpDueAt && new Date(l.followUpDueAt) < new Date() && !l.followUpDone);

  return NextResponse.json({
    leads,
    byStatus,
    pipelineOrder: PIPELINE_ORDER,
    total: leads.length,
    overdueFollowUps: overdue.length,
    overdueList: overdue.slice(0, 20),
    summary: {
      new: byStatus["new"]?.length || 0,
      contacted: byStatus["contacted"]?.length || 0,
      qualified: byStatus["qualified"]?.length || 0,
      assigned: byStatus["assigned"]?.length || 0,
      converted: byStatus["converted"]?.length || 0,
      lost: byStatus["lost"]?.length || 0,
    },
  } as any);
}, MARKETING_AUTH);

// PATCH — assign counselor, move stage, schedule follow-up, update score
export const PATCH = withAuth(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => ({}));
  const { id, status, counselorId, counselorName, followUpDueAt, followUpDone, score, hotLead } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: any = {};
  if (status && PIPELINE_ORDER.includes(status)) {
    data.status = status;
    if (status === "assigned" && counselorId) {
      data.counselorId = counselorId;
      data.counselorName = counselorName || "";
      data.assignedAt = new Date();
    }
    if (status === "converted") data.convertedAt = new Date();
  }
  if (counselorId !== undefined) {
    data.counselorId = counselorId;
    data.counselorName = counselorName || "";
    if (counselorId) data.assignedAt = new Date();
    // auto-move to assigned if was new/contacted
    if (counselorId && !status) {
      const existing = await db.marketingLead.findUnique({ where: { id } }).catch(() => null);
      if (existing && ["new", "contacted", "qualified"].includes(existing.status)) data.status = "assigned";
    }
  }
  if (followUpDueAt !== undefined) data.followUpDueAt = followUpDueAt ? new Date(followUpDueAt) : null;
  if (followUpDone !== undefined) data.followUpDone = !!followUpDone;
  if (score !== undefined) data.score = Number(score);
  if (hotLead !== undefined) data.hotLead = !!hotLead;

  const lead = await db.marketingLead.update({ where: { id }, data }).catch(() => null);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: "PUBLIC_PUBLISH",
      resource: "MarketingLead",
      resourceId: id,
      details: JSON.stringify({ status, counselorId, followUpDueAt, actor: auth.email }),
    },
  }).catch(() => {});

  // Also log to MarketingAuditLog for dashboard
  await db.marketingAuditLog.create({
    data: {
      userId: auth.userId,
      userName: auth.name,
      role: auth.userType,
      action: "lead.pipeline.update",
      resource: "MarketingLead",
      resourceId: id,
      details: JSON.stringify({ status, counselorId }),
    },
  }).catch(() => {});

  return NextResponse.json({ lead, message: "Lead pipeline updated" } as any);
}, MARKETING_AUTH);

// POST — create lead manually (also used by auto-create flows)
export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => ({}));
  const { name, phone, email, destination, source, sourceDetail, status, counselorId, counselorName } = body;
  if (!name && !phone && !email) return NextResponse.json({ error: "name or phone or email required" }, { status: 400 });

  const lead = await db.marketingLead.create({
    data: {
      name: name || "Unknown",
      phone: phone || "",
      email: email || "",
      destination: destination || "",
      source: source || "MANUAL",
      sourceDetail: sourceDetail || "",
      status: status || "new",
      counselorId: counselorId || null,
      counselorName: counselorName || "",
      createdById: auth.userId,
      consent: true,
    },
  });

  await db.auditLog.create({
    data: { userId: auth.userId, action: "DATA_IMPORT", resource: "MarketingLead", resourceId: lead.id, details: JSON.stringify({ name, phone, source }) },
  }).catch(() => {});

  return NextResponse.json({ lead, message: "Lead created" } as any, { status: 201 });
}, MARKETING_AUTH);
