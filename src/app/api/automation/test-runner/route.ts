import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/test-runner — creates REAL records and runs workflows.
// Body: { scenario: string }
// SUPER_ADMIN/ADMIN only.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const scenario = body.scenario || "default";

    const validScenarios = [
      "default",
      "hot_lead",
      "duplicate_lead",
      "whatsapp_inbound",
      "facebook_lead",
      "content_opportunity",
    ];
    if (!validScenarios.includes(scenario)) {
      return NextResponse.json(
        { error: `Invalid scenario. Valid: ${validScenarios.join(", ")}` },
        { status: 400 }
      );
    }

    const created: Record<string, any> = {};

    // ── Create REAL Lead record (scenario-driven) ──
    const leadCount = await db.lead.count();
    const leadData: any = {
      leadId: `ALO-TEST-${Date.now().toString().slice(-6)}`,
      fullName: `Test Lead ${scenario}`,
      phone: `01700${Math.floor(100000 + Math.random() * 899999)}`,
      email: `test-${scenario}-${Date.now()}@aloeducation.com`,
      source: "TEST_RUNNER",
      sourceDetail: `scenario: ${scenario}`,
      notes: `Created by automation test-runner (scenario: ${scenario})`,
      status: "NEW",
      welcomeSent: false,
    };

    if (scenario === "hot_lead") {
      leadData.preferredCountry = "UK";
      leadData.preferredCourse = "Computer Science";
      leadData.preferredLevel = "Masters";
      leadData.preferredIntake = "September 2026";
      leadData.budget = "£30000";
      leadData.englishTest = "IELTS";
      leadData.englishScore = "7.0";
      leadData.cgpa = "3.6";
    } else if (scenario === "duplicate_lead") {
      // Find any existing lead and create a duplicate by phone
      const existing = await db.lead.findFirst({
        where: { source: "TEST_RUNNER" },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        leadData.phone = existing.phone;
        leadData.email = existing.email;
      }
    }

    const lead = await db.lead.create({ data: leadData });
    created.lead = { id: lead.id, leadId: lead.leadId };

    // ── Run automation workflows on the lead ──
    const { scoreLead, autoAssignCounselor, createFollowUpTask, saveFormSubmission } =
      await import("@/lib/crm-automation");

    await saveFormSubmission({
      source: "TEST_RUNNER",
      channel: "test",
      rawPayload: { scenario, leadId: lead.id },
      normalizedData: leadData,
      crmId: lead.leadId,
      crmType: "LEAD",
    }).catch(() => {});

    const workflowResults: any = {};

    try {
      workflowResults.leadScoring = await scoreLead(lead.id);
    } catch (err: any) {
      workflowResults.leadScoring = { error: err.message };
    }
    try {
      workflowResults.counselorAssignment = await autoAssignCounselor(lead.id);
    } catch (err: any) {
      workflowResults.counselorAssignment = { error: err.message };
    }
    try {
      await createFollowUpTask(lead.id, 1);
      workflowResults.followUpTaskCreated = true;
    } catch (err: any) {
      workflowResults.followUpTaskCreated = { error: err.message };
    }

    // ── Optionally create related records ──
    if (scenario === "whatsapp_inbound") {
      const msg = await db.socialInboxMessage.create({
        data: {
          platform: "WHATSAPP",
          direction: "INBOUND",
          senderId: leadData.phone,
          senderName: `Test ${scenario}`,
          messageText: "I want to study abroad in the UK",
          conversationId: `wa-test-${lead.id}`,
          leadId: lead.id,
          aiHandled: false,
        },
      });
      created.inboundMessage = { id: msg.id };
    }

    if (scenario === "facebook_lead") {
      const fbRaw = await db.facebookLeadRaw.create({
        data: {
          pageId: "test_page",
          leadgenId: `test-${Date.now()}`,
          formId: "test_form",
          formName: "Test Form",
          fieldData: JSON.stringify({ full_name: leadData.fullName, phone: leadData.phone }),
          normalizedData: JSON.stringify({ name: leadData.fullName, phone: leadData.phone }),
          matchedLeadId: lead.id,
          processingStatus: "MATCHED",
          processedAt: new Date(),
        },
      });
      created.facebookLead = { id: fbRaw.id };
    }

    if (scenario === "content_opportunity") {
      const { identifyContentOpportunity } = await import("@/lib/brains/content-brain");
      const opp = await identifyContentOpportunity({
        topic: `[TEST] ${scenario} opportunity`,
        country: leadData.preferredCountry || "GLOBAL",
        audience: "Test students",
        sourceEvidence: `Created by test-runner scenario ${scenario}`,
        priority: "MEDIUM",
        contentType: "BLOG",
        recommendedChannels: "BLOG,FACEBOOK",
      });
      created.contentOpportunity = { id: opp.id };
    }

    // Emit audit event
    await db.auditLog
      .create({
        data: {
          userId: (session.user as any).id,
          action: "AUTOMATION_TEST_RUN",
          resource: "Lead",
          resourceId: lead.id,
          details: JSON.stringify({ scenario, workflowsRun: Object.keys(workflowResults) }),
        },
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      scenario,
      created,
      workflows: workflowResults,
      ranAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[automation.test-runner] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/automation/test-runner — REAL stats on test records created
export async function GET() {
  try {
    const [totalTestLeads, testLeadsByScenario, recentTestRuns] = await Promise.all([
      db.lead.count({ where: { source: "TEST_RUNNER" } }),
      db.lead.groupBy({
        by: ["sourceDetail"],
        _count: true,
        where: { source: "TEST_RUNNER" },
      }),
      db.lead.findMany({
        where: { source: "TEST_RUNNER" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          leadId: true,
          fullName: true,
          sourceDetail: true,
          leadScore: true,
          leadTier: true,
          createdAt: true,
        },
      }),
    ]);

    const auditLogs = await db.auditLog.findMany({
      where: { action: "AUTOMATION_TEST_RUN" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      totalTestLeads,
      testLeadsByScenario: testLeadsByScenario.map((s: any) => ({
        scenario: s.sourceDetail,
        count: s._count.sourceDetail,
      })),
      recentTestLeads: recentTestRuns,
      recentAuditLogs: auditLogs,
    });
  } catch (err: any) {
    console.error("[automation.test-runner GET] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
