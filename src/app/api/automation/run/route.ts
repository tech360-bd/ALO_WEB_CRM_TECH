import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/run — run a single workflow against a target.
// Body: { workflow: string, targetId?: string, days?: number }
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
    const { workflow, targetId, days } = body;

    if (!workflow) {
      return NextResponse.json({ error: "workflow is required" }, { status: 400 });
    }

    const validWorkflows = [
      "lead_scoring",
      "counselor_assignment",
      "follow_up_task_creation",
      "lead_welcome_flow",
      "lead_tagging",
      "content_signal_collection",
      "university_twin_refresh",
      "stale_content_detection",
    ];
    if (!validWorkflows.includes(workflow)) {
      return NextResponse.json(
        { error: `Invalid workflow. Valid: ${validWorkflows.join(", ")}` },
        { status: 400 }
      );
    }

    // Delegate to automation-engine
    try {
      const engine = await import("@/lib/automation-engine");
      if (typeof (engine as any).runWorkflow === "function") {
        const result = await (engine as any).runWorkflow(workflow, {
          targetId,
          days,
          actorId: (session.user as any).id,
        });
        return NextResponse.json({
          success: true,
          workflow,
          targetId: targetId || null,
          result,
          delegated: "automation-engine",
        });
      }
    } catch (err: any) {
      console.warn("[automation.run] engine unavailable:", err?.message);
    }

    // Inline fallbacks for the most common workflows
    let result: any = { workflow, targetId, fallback: true };

    if (workflow === "lead_scoring") {
      const { scoreLead } = await import("@/lib/crm-automation");
      if (targetId) {
        const r = await scoreLead(targetId);
        result = { workflow, targetId, ...r };
      } else {
        const cutoff = new Date(Date.now() - (days || 7) * 24 * 60 * 60 * 1000);
        const leads = await db.lead.findMany({
          where: { createdAt: { gte: cutoff } },
          select: { id: true },
          take: 50,
        });
        let processed = 0;
        for (const l of leads) {
          try {
            await scoreLead(l.id);
            processed++;
          } catch {}
        }
        result = { workflow, processed, total: leads.length };
      }
    } else if (workflow === "counselor_assignment") {
      const { autoAssignCounselor } = await import("@/lib/crm-automation");
      if (targetId) {
        const r = await autoAssignCounselor(targetId);
        result = { workflow, targetId, ...r };
      } else {
        const unassigned = await db.lead.findMany({
          where: { counselorId: null, status: { in: ["NEW", "CONTACTED"] } },
          select: { id: true },
          take: 50,
        });
        let processed = 0;
        for (const l of unassigned) {
          try {
            await autoAssignCounselor(l.id);
            processed++;
          } catch {}
        }
        result = { workflow, processed, total: unassigned.length };
      }
    } else if (workflow === "follow_up_task_creation") {
      const { createFollowUpTask } = await import("@/lib/crm-automation");
      if (targetId) {
        await createFollowUpTask(targetId, days || 1);
        result = { workflow, targetId, scheduledInDays: days || 1 };
      } else {
        const cutoff = new Date(Date.now() - (days || 7) * 24 * 60 * 60 * 1000);
        const leads = await db.lead.findMany({
          where: { createdAt: { gte: cutoff }, followUpDate: null },
          select: { id: true },
          take: 50,
        });
        let processed = 0;
        for (const l of leads) {
          try {
            await createFollowUpTask(l.id, 1);
            processed++;
          } catch {}
        }
        result = { workflow, processed, total: leads.length };
      }
    } else if (workflow === "content_signal_collection") {
      const { collectContentSignals } = await import("@/lib/brains/content-brain");
      const signals = await collectContentSignals();
      result = { workflow, signalsDetected: signals.length, signals };
    } else if (workflow === "university_twin_refresh") {
      const { buildUniversityDigitalTwin } = await import(
        "@/lib/brains/university-research-brain"
      );
      if (targetId) {
        const twin = await buildUniversityDigitalTwin(targetId);
        result = { workflow, targetId, twin };
      } else {
        const unis = await db.universityPage.findMany({
          select: { slug: true },
          take: 20,
        });
        let processed = 0;
        for (const u of unis) {
          try {
            await buildUniversityDigitalTwin(u.slug);
            processed++;
          } catch {}
        }
        result = { workflow, processed, total: unis.length };
      }
    } else if (workflow === "stale_content_detection") {
      const { detectStaleContent } = await import("@/lib/brains/seo-brain");
      const r = await detectStaleContent();
      result = { workflow, ...r };
    } else {
      result = {
        workflow,
        skipped: `${workflow} not implemented in fallback. Install automation-engine for full support.`,
      };
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    console.error("[automation.run] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
