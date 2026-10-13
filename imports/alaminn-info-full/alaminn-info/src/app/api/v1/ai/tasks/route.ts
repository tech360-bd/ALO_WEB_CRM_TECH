import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";
import { requirePermission } from "@/lib/auth";

// ─── JSON envelope helpers ──────────────────────────────────────
function ok(data: unknown, message = "OK", meta: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}
function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

// ─── Rate limiting (10 req/min per IP) ──────────────────────────
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

function rateLimited(key: string) {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

// ─── Approved workflows (44 — superset of command center dropdown + spec §38) ────
const APPROVED_WORKFLOWS = new Set([
  // Quick-create workflows (command center dropdown)
  "content-draft",
  "research-brief",
  "operations-audit",
  "pipeline-summary",
  "newsletter-draft",
  "partnership-brief",
  // Authority / social
  "executive-linkedin-post",
  "facebook-authority-post",
  "professional-x-post",
  "social-thread",
  "social-content-calendar",
  "content-repurposing",
  "video-script",
  "professional-follow-up",
  // Editorial / content
  "article-research-brief",
  "seo-article-draft",
  "case-study-draft",
  "executive-biography",
  "website-content-update",
  "media-response",
  "content-calendar",
  // Business / strategy
  "partnership-proposal",
  "university-research-brief",
  "bangladesh-market-brief",
  "operations-audit",
  "sales-process-review",
  "crm-requirements-draft",
  "presentation-outline",
  "speaking-notes",
  "meeting-preparation",
  "meeting-summary",
  "monthly-authority-report",
  "competitor-research",
  "market-analysis",
  "proposal-section",
  "project-brief",
  "stakeholder-update",
  "data-summary",
  "feedback-synthesis",
  "workflow-diagram",
  "metric-dashboard-spec",
  "onboarding-guide",
  "email-draft",
  // Resources / governance
  "resource-checklist",
  "resource-checklist-generator",
  "risk-review",
  "brand-consistency-audit",
]);

const VALID_SENSITIVITIES = new Set(["public", "internal", "confidential", "low", "medium", "high"]);
const VALID_OUTPUT_FORMATS = new Set(["markdown", "html", "json", "plain-text"]);

// ─── GET handler: list tasks (requires ai_tasks.view) ────────────
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "ai_tasks.view");
  if (guard.denied) {
    return NextResponse.json(
      { success: false, message: guard.response.status === 401 ? "Authentication required." : "Insufficient permissions.", data: null, meta: {}, errors: [guard.response.status === 401 ? "unauthenticated" : "forbidden"] },
      { status: guard.response.status }
    );
  }

  try {
    const tasks = await db.aiTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { requester: { select: { name: true } } },
    });
    const data = tasks.map((t) => ({
      id: t.id,
      workflow: t.workflow,
      objective: t.objective,
      status: t.status,
      sensitivity: t.sensitivity,
      createdAt: t.createdAt.toISOString(),
      requesterName: t.requester?.name || null,
    }));
    return NextResponse.json({ success: true, message: "AI tasks fetched.", data: { tasks: data }, meta: { count: data.length }, errors: [] });
  } catch (e) {
    console.error("[ai/tasks] GET error", e);
    return NextResponse.json({ success: false, message: "Internal error.", data: null, meta: {}, errors: ["server_error"] }, { status: 500 });
  }
}

// ─── POST handler: create task (requires ai_tasks.create) ────────
export async function POST(req: NextRequest) {
  // ─── AUTHORIZATION ───────────────────────────────────────────
  const guard = await requirePermission(req, "ai_tasks.create");
  if (guard.denied) {
    return NextResponse.json(
      { success: false, message: guard.response.status === 401 ? "Authentication required." : "Insufficient permissions.", data: null, meta: {}, errors: [guard.response.status === 401 ? "unauthenticated" : "forbidden"] },
      { status: guard.response.status }
    );
  }
  const requester = guard.session;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    // Rate limit
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const hash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    if (rateLimited(hash)) {
      return fail("Too many requests. Please try again shortly.", ["rate_limited"], 429);
    }

    // Validate required fields
    const workflow = String(body.workflow || "").trim();
    const objective = String(body.objective || "").trim();
    const prompt = String(body.prompt || body.objective || "").trim();

    const errors: string[] = [];
    if (!workflow) errors.push("workflow_required");
    else if (!APPROVED_WORKFLOWS.has(workflow)) errors.push("workflow_invalid");
    if (!objective) errors.push("objective_required");
    if (errors.length) return fail("Validation failed.", errors, 422);

    // Optional fields with defaults
    const sensitivity = VALID_SENSITIVITIES.has(String(body.sensitivity || ""))
      ? String(body.sensitivity)
      : "internal";
    const outputFormat = VALID_OUTPUT_FORMATS.has(String(body.outputFormat || ""))
      ? String(body.outputFormat)
      : "markdown";
    const approvalRequired = body.approvalRequired !== undefined
      ? !!body.approvalRequired
      : true;
    const project = body.project ? String(body.project) : null;
    const deadline = body.deadline ? new Date(String(body.deadline)) : null;

    // Determine initial status
    const status = approvalRequired ? "awaiting-approval" : "draft";

    // Create the task — requester is the authenticated user
    const task = await db.aiTask.create({
      data: {
        requesterId: requester.userId,
        workflow,
        objective,
        prompt,
        sensitivity,
        outputFormat,
        approvalRequired,
        project,
        deadline,
        status,
      },
      include: { requester: { select: { name: true, email: true } } },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: requester.userId,
        action: "ai-task.created",
        resource: "ai-task",
        resourceId: task.id,
        meta: JSON.stringify({ workflow, sensitivity, status, requesterEmail: requester.email }),
        ipHash: hash,
      },
    });

    return ok(
      {
        id: task.id,
        workflow: task.workflow,
        objective: task.objective,
        sensitivity: task.sensitivity,
        outputFormat: task.outputFormat,
        approvalRequired: task.approvalRequired,
        project: task.project,
        status: task.status,
        createdAt: task.createdAt.toISOString(),
        requestedBy: requester.email,
      },
      "AI task created.",
      { requestId: task.id }
    );
  } catch (e) {
    console.error("[ai/tasks] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}
