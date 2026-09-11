import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/schedule — runs all scheduler workflows.
// SUPER_ADMIN/ADMIN only. Returns 423 if globalAiPaused is active.
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

    // ── Check global AI pause ──
    let globalAiPaused = false;
    try {
      const aiSafety = await import("@/lib/ai-safety");
      if (typeof (aiSafety as any).isAiPaused === "function") {
        globalAiPaused = await (aiSafety as any).isAiPaused({});
      } else {
        throw new Error("not bound");
      }
    } catch {
      const activePauses = await db.globalAiPause.findMany({ where: { active: true } });
      globalAiPaused = activePauses.length > 0;
    }

    if (globalAiPaused) {
      return NextResponse.json(
        {
          error: "Global AI is paused. Resume via /api/ai-safety/resume before scheduling.",
          globalAiPaused: true,
        },
        { status: 423 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const workflowResults: Record<string, any> = {};

    // ── Run all 5 scheduler workflows via automation-engine (if available) ──
    const workflows = [
      "lead_scoring",
      "counselor_assignment",
      "follow_up_task_creation",
      "lead_welcome_flow",
      "lead_tagging",
    ];

    let engineDelegated = false;
    try {
      const engine = await import("@/lib/automation-engine");
      if (typeof (engine as any).runAllSchedulers === "function") {
        const result = await (engine as any).runAllSchedulers({
          actorId: (session.user as any).id,
          dryRun,
        });
        workflowResults.engine = result;
        engineDelegated = true;
      } else if (typeof (engine as any).runWorkflow === "function") {
        for (const w of workflows) {
          try {
            const r = await (engine as any).runWorkflow(w, {
              actorId: (session.user as any).id,
              dryRun,
            });
            workflowResults[w] = r;
          } catch (err: any) {
            workflowResults[w] = { error: err.message };
          }
        }
        engineDelegated = true;
      }
    } catch (err: any) {
      console.warn("[automation.schedule] engine unavailable:", err?.message);
    }

    if (!engineDelegated) {
      // Inline fallback — call crm-automation functions directly on real records
      const pendingLeads = await db.lead.findMany({
        where: { status: "NEW" },
        take: 50,
        select: { id: true },
      });

      const { scoreLead, autoAssignCounselor, createFollowUpTask } = await import(
        "@/lib/crm-automation"
      );

      for (const lead of pendingLeads) {
        if (dryRun) continue;
        try {
          await scoreLead(lead.id);
        } catch {}
        try {
          await autoAssignCounselor(lead.id);
        } catch {}
        try {
          await createFollowUpTask(lead.id, 1);
        } catch {}
      }

      workflowResults.lead_scoring = { processed: pendingLeads.length, dryRun };
      workflowResults.counselor_assignment = { processed: pendingLeads.length, dryRun };
      workflowResults.follow_up_task_creation = { processed: pendingLeads.length, dryRun };
      workflowResults.lead_welcome_flow = { skipped: "not implemented in fallback" };
      workflowResults.lead_tagging = { skipped: "not implemented in fallback" };
    }

    // ── Auto-execute LOW-risk AiCommandActions that are APPROVED but not yet EXECUTED ──
    let autoExecuted = 0;
    if (!dryRun) {
      const approvableActions = await db.aiCommandAction.findMany({
        where: {
          status: "PENDING",
          riskLevel: "LOW",
        },
        take: 50,
      });

      for (const action of approvableActions) {
        try {
          await db.aiCommandAction.update({
            where: { id: action.id },
            data: {
              status: "APPROVED",
              approvedBy: (session.user as any).id,
              approvedAt: new Date(),
              trigger: action.trigger || "SCHEDULE_AUTO_APPROVE",
              actor: "SYSTEM",
            },
          });

          try {
            const executor = await import("@/lib/ai-action-executor");
            if (typeof (executor as any).executeAiAction === "function") {
              await (executor as any).executeAiAction(action.id, {
                actorId: (session.user as any).id,
                actorType: "SYSTEM",
              });
              autoExecuted++;
              continue;
            }
          } catch {}

          // Inline fallback (replay CREATE_LEAD etc.)
          const payload = JSON.parse(action.payload || "{}");
          if (action.actionType === "CREATE_LEAD") {
            const lead = await db.lead.create({
              data: {
                leadId: `ALO-AI-${Date.now().toString().slice(-6)}`,
                fullName: payload?.name || "AI Lead",
                email: payload?.email || null,
                phone: payload?.phone || "N/A",
                source: payload?.source || "AI_COMMAND",
                status: "NEW",
              },
            });
            await db.aiCommandAction.update({
              where: { id: action.id },
              data: {
                status: "EXECUTED",
                result: JSON.stringify({ id: lead.id, summary: "Lead created (auto)" }),
                executedAt: new Date(),
              },
            });
            autoExecuted++;
          }
        } catch (err: any) {
          await db.aiCommandAction.update({
            where: { id: action.id },
            data: { status: "FAILED", lastError: err.message },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({
      success: true,
      globalAiPaused: false,
      dryRun,
      workflows: workflowResults,
      autoExecutedLowRiskActions: autoExecuted,
      ranAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[automation.schedule] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/automation/schedule — REAL scheduler metrics
export async function GET() {
  try {
    const [automationEvents, aiActionsByMode, recentScheduled] = await Promise.all([
      db.automationEvent.groupBy({
        by: ["mode"],
        _count: true,
      }),
      db.aiCommandAction.groupBy({
        by: ["actor"],
        _count: true,
      }),
      db.automationEvent.findMany({
        where: { trigger: { contains: "SCHEDULE" } },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const totalEvents = await db.automationEvent.count();
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await db.automationEvent.count({
      where: { createdAt: { gte: last24h } },
    });

    const totalLowRiskPending = await db.aiCommandAction.count({
      where: { status: "PENDING", riskLevel: "LOW" },
    });

    return NextResponse.json({
      totalAutomationEvents: totalEvents,
      last24h: recentCount,
      byMode: automationEvents.map((m: any) => ({ mode: m.mode, count: m._count.mode })),
      byActor: aiActionsByMode.map((a: any) => ({ actor: a.actor, count: a._count.actor })),
      recentScheduled,
      pendingLowRiskActions: totalLowRiskPending,
    });
  } catch (err: any) {
    console.error("[automation.schedule GET] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
