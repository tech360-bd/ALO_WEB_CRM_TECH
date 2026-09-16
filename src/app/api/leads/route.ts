import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const source = req.nextUrl.searchParams.get("source");
  const where: any = {};
  if (status) where.status = status;
  if (source) where.source = source;
  const leads = await db.lead.findMany({
    where,

    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ leads });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fullName, email, phone, altPhone, source, sourceDetail, preferredCountry, preferredCourse, preferredLevel, preferredIntake, budget, englishTest, englishScore, currentQualification, cgpa, notes, counselorId } = body;

  if (!fullName || !phone) {
    return NextResponse.json({ error: "Full name and phone are required" }, { status: 400 });
  }

  const existing = await db.lead.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    const dup = await db.lead.create({
      data: {
        leadId: `ALO-L-${Date.now().toString().slice(-6)}`,
        fullName,
        email,
        phone,
        altPhone,
        source: source || "WEBSITE",
        sourceDetail: sourceDetail || (preferredCountry ? `From ${preferredCountry} page` : undefined),
        preferredCountry,
        preferredCourse,
        notes: notes ? `${notes}${preferredLevel ? ` | Level: ${preferredLevel}` : ""}${preferredIntake ? ` | Intake: ${preferredIntake}` : ""}${budget ? ` | Budget: ${budget}` : ""}${englishScore ? ` | English: ${englishScore}` : ""}` : `${preferredLevel ? `Level: ${preferredLevel}` : ""}${preferredIntake ? ` | Intake: ${preferredIntake}` : ""}${budget ? ` | Budget: ${budget}` : ""}${englishScore ? ` | English: ${englishScore}` : ""}`.trim(),
        counselorId,
        status: "DUPLICATE",
        duplicateOfId: existing.id,
      },
    });
    return NextResponse.json({ lead: dup, duplicate: true, message: "Duplicate lead detected" });
  }

  const count = await db.lead.count();
  const lead = await db.lead.create({
    data: {
      leadId: `ALO-L-${(10001 + count + 1).toString()}`,
      fullName,
      email,
      phone,
      altPhone,
      source: source || "WEBSITE",
      sourceDetail: sourceDetail || (preferredCountry ? `From ${preferredCountry} page` : undefined),
      preferredCountry,
      preferredCourse,
      preferredLevel,
      preferredIntake,
      budget,
      englishTest,
      englishScore,
      currentQualification,
      cgpa,
      utmSource: req.headers.get("x-utm-source") || undefined,
      utmMedium: req.headers.get("x-utm-medium") || undefined,
      utmCampaign: req.headers.get("x-utm-campaign") || undefined,
      rawSubmission: JSON.stringify(body),
      notes: notes || "",
      counselorId,
      status: "NEW",
      welcomeSent: false,
    },
  });

  // ─── AUTOMATION: Save form submission ───
  const { saveFormSubmission } = await import("@/lib/crm-automation");
  await saveFormSubmission({
    source: source || "WEBSITE",
    channel: "website_form",
    rawPayload: body,
    normalizedData: { fullName, email, phone, preferredCountry, preferredCourse, preferredLevel, preferredIntake, budget, englishTest, englishScore, currentQualification, cgpa },
    crmId: lead.leadId,
    crmType: "LEAD",
  });

  await db.timelineEvent.create({
    data: {
      studentId: "",
      leadId: lead.id,
      stage: "lead",
      type: "LEAD_CREATED",
      title: "New lead created",
      description: `Lead came via ${lead.source}${lead.sourceDetail ? ` (${lead.sourceDetail})` : ""}`,
    },
  });

  // ─── AUTOMATION: Score lead ───
  const { scoreLead, autoAssignCounselor, createFollowUpTask, createAiTask } = await import("@/lib/crm-automation");
  const scoreResult = await scoreLead(lead.id);

  // ─── AUTOMATION: Auto-assign counselor ───
  const assignment = await autoAssignCounselor(lead.id);

  // ─── AUTOMATION: Create follow-up task ───
  await createFollowUpTask(lead.id, 1);

  // ─── AUTOMATION: Create AI qualification task ───
  await createAiTask({
    agentName: "Lead Qualification Agent",
    department: "Lead Management",
    action: "qualify_lead",
    crmId: lead.leadId,
    crmType: "LEAD",
    priority: scoreResult.tier === "HOT" || scoreResult.tier === "URGENT" ? "HIGH" : "NORMAL",
    input: { leadId: lead.id, score: scoreResult.score, tier: scoreResult.tier, reasons: scoreResult.reasons },
  });

  // Log metric
  const { incrementMetric } = await import("@/lib/crm-automation");
  await incrementMetric("lead_intake", "automated");
  await incrementMetric("data_entry", "automated");

  await db.auditLog.create({
    data: {
      action: "DATA_IMPORT",
      resource: "Lead",
      resourceId: lead.id,
      details: JSON.stringify({ source: lead.source, name: fullName, automated: true, score: scoreResult.score, tier: scoreResult.tier, assignedTo: assignment.counselorId }),
    },
  });

  // ─── AUTOMATION WORKFLOWS via automation-engine (parallel agent RESTORE-CORE) ───
  // Each workflow is invoked via dynamic import and wrapped in .catch() so failures
  // never block lead creation. If automation-engine is unavailable, the existing
  // crm-automation calls above already cover the core pipeline.
  try {
    const engine: any = await import("@/lib/automation-engine");
    if (typeof engine?.runWorkflow === "function") {
      await Promise.allSettled([
        engine.runWorkflow("lead_scoring", { targetId: lead.id, actorId: null }).catch(() => {}),
        engine.runWorkflow("counselor_assignment", { targetId: lead.id, actorId: null }).catch(() => {}),
        engine.runWorkflow("follow_up_task_creation", { targetId: lead.id, actorId: null }).catch(() => {}),
        engine.runWorkflow("lead_welcome_flow", { targetId: lead.id, actorId: null }).catch(() => {}),
        engine.runWorkflow("lead_tagging", { targetId: lead.id, actorId: null }).catch(() => {}),
      ]);
    }
  } catch {
    // automation-engine not yet available — silently skip. Existing crm-automation
    // calls above already performed scoring, assignment, and follow-up creation.
  }

  // ─── Emit event-bus touchpoint for attribution ───
  try {
    const { emitEvent } = await import("@/lib/event-bus");
    await emitEvent({
      eventType: "LEAD_CREATED",
      aggregateType: "Lead",
      aggregateId: lead.id,
      leadId: lead.id,
      actorType: lead.source === "WHATSAPP" ? "WEBHOOK" : lead.source === "FACEBOOK" ? "WEBHOOK" : "USER",
      payload: {
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        leadScore: scoreResult.score,
        leadTier: scoreResult.tier,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
      },
    });
  } catch {
    // best-effort
  }

  return NextResponse.json({
    lead,
    duplicate: false,
    automation: {
      leadScore: scoreResult.score,
      leadTier: scoreResult.tier,
      scoringReasons: scoreResult.reasons,
      counselorAssigned: !!assignment.counselorId,
      assignmentReason: assignment.reason,
      followUpScheduled: true,
      aiTaskCreated: true,
    },
    message: "Lead created successfully. Auto-scored, auto-assigned, follow-up scheduled, AI qualification task created. Workflow events emitted.",
  });
}
