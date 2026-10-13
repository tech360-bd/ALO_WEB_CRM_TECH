/**
 * Alaminn.info — ai-worker (port 3006)
 *
 * Polls the AiTask table for tasks in `queued` status, executes them via
 * z-ai-web-dev-sdk, writes the result back, and advances status to
 * `awaiting-approval` (if approvalRequired) or `delivered` (otherwise).
 *
 * Endpoints:
 *   GET  /health            — { status, uptime, processed, failed, inFlight }
 *   GET  /stats             — detailed processing stats
 *   POST /process/:taskId   — manually trigger processing of a specific task
 *   POST /tick              — manually trigger a poll tick (dev/test)
 *
 * Status transitions performed:
 *   queued → processing → (success) → awaiting-approval | delivered
 *                       → (failure)  → failed (with error in result)
 *
 * Workflow → system-prompt mapping lives in WORKFLOW_PROMPTS below.
 *
 * Auto-restarts on file change via `bun --hot`.
 */

// Resolve PrismaClient from the parent project's node_modules so the
// generated client (with our schema) is used. The local node_modules
// only provides z-ai-web-dev-sdk.
import { PrismaClient } from "/home/z/my-project/node_modules/@prisma/client";
import ZAI from "z-ai-web-dev-sdk";
import { Bun_ } from "../_shared/bun-shim";

const PORT = 3006;
const SERVICE_NAME = "ai-worker";
const TICK_INTERVAL_MS = 5_000; // poll every 5s
const MAX_CONCURRENT = 2; // max 2 tasks in flight
const MAX_OUTPUT_CHARS = 16_000; // truncate LLM output to keep DB rows manageable

const db = new PrismaClient();

// ─── Workflow → system prompt map ───────────────────────────────────
// Each workflow gets a tailored system prompt that constrains the model
// to produce executive-grade output aligned with Al Aminn's brand voice.
const WORKFLOW_PROMPTS: Record<string, string> = {
  "executive-linkedin-post":
    "You are an executive ghostwriter for Al Aminn, a senior operator who transforms strategy into scalable operations. Draft a LinkedIn post (max 1,200 chars) in his voice: confident, concrete, no buzzword salad. Include a hook, 2-3 substantive paragraphs, and a closing question. No hashtags unless asked.",
  "seo-article-draft":
    "You are an SEO content strategist drafting an article for alaminn.info. Produce a well-structured markdown article (800-1,200 words) with H2/H3 headings, a compelling intro, actionable body, and a CTA. Target keyword should appear naturally in title, first paragraph, and one H2. No fluff.",
  "newsletter-draft":
    "You are the editor of Al Aminn's monthly authority newsletter. Draft a concise newsletter (600-900 words) with: a 1-2 sentence intro, 3-4 short sections (each with a headline and 2-3 sentences), and a closing CTA. Tone: senior, generous, no hype.",
  "case-study-draft":
    "You are a case study writer. Produce a structured markdown case study with sections: Context, Challenge, Role, Intervention, System Built, Verified Outcome, Confidentiality Status. Be specific and honest — no invented metrics.",
  "partnership-proposal":
    "You are drafting a partnership proposal on behalf of Al Aminn. Produce a markdown document with: Executive Summary, Mutual Value, Proposed Scope, Roles & Responsibilities, Success Metrics, Next Steps. Professional, specific, no jargon.",
  "university-research-brief":
    "You are a research analyst producing a brief on a target university. Output markdown sections: Overview, Strengths, Relevant Programmes, Research Areas, Notable Faculty, Application Notes. Factual, sourced, no fabrication.",
  "operations-audit":
    "You are an operations auditor. Produce a markdown audit summary with: Scope, Methodology, Findings (by area), Risk Rating, Recommendations (prioritized). Honest, specific, actionable.",
  "sales-process-review":
    "You are a sales operations consultant. Produce a markdown review with: Current State, Gaps, Recommended Process, Stage Definitions, Metrics to Track. Practical, no theory.",
  "crm-requirements-draft":
    "You are a CRM architect. Produce a markdown requirements document with: Business Context, User Roles, Core Workflows, Data Model, Integrations, Success Criteria. Specific, buildable.",
  "presentation-outline":
    "You are an executive speechwriter. Produce a presentation outline with: Working Title, Audience, Core Message, Slide-by-Slide Outline (10-15 slides), Talking Points per slide, Suggested Visuals. Tight, narrative-driven.",
  "speaking-notes":
    "You are drafting speaking notes for an executive talk. Output markdown with: Opening Hook, 3-5 Key Talking Points (each with a story/example), Anticipated Questions + Suggested Answers, Closing. Conversational, memorable.",
  "media-response":
    "You are drafting a media response on behalf of Al Aminn. Produce a concise, on-message response (200-400 words) that addresses the question, reinforces key messages, and bridges to positive territory. No speculation.",
  "monthly-authority-report":
    "You are compiling Al Aminn's monthly authority report. Output markdown with: Executive Summary, Key Wins, Content Published, Pipeline Updates, Ecosystem Activity, Risks & Watch Items, Next Month Focus. Specific, no filler.",
  "competitor-research":
    "You are a competitive intelligence analyst. Produce a markdown brief with: Competitor Overview, Positioning, Strengths, Weaknesses, Recent Moves, Implications for Us. Factual, sourced, no invention.",
  "resource-checklist":
    "You are producing a resource checklist for an executive engagement. Output markdown with: a checklist of 10-20 items grouped by category, each with a 1-sentence rationale. Practical, complete.",
  "risk-review":
    "You are a risk analyst. Produce a markdown review with: Risk Register (5-10 risks), each with Likelihood, Impact, Mitigation, Owner. Honest, prioritized.",
  "brand-consistency-audit":
    "You are a brand auditor. Produce a markdown audit with: Brand Touchpoints Reviewed, Consistency Findings (by touchpoint), Recommendations (prioritized). Specific, actionable.",
};

const DEFAULT_PROMPT =
  "You are an AI assistant supporting Al Aminn's executive platform. Produce a clear, well-structured markdown response to the user's objective. Be specific, honest, and avoid filler. Do not invent facts, metrics, or quotes.";

// ─── Stats ──────────────────────────────────────────────────────────
const stats = {
  startedAt: Date.now(),
  polled: 0,
  processed: 0,
  succeeded: 0,
  failed: 0,
  inFlight: 0,
  lastTickAt: 0,
  lastError: null as string | null,
  workflowCounts: {} as Record<string, number>,
};

// ─── Process a single task ──────────────────────────────────────────
async function processTask(taskId: string): Promise<void> {
  stats.inFlight++;
  try {
    // Atomically claim the task: only proceed if still `queued`
    const claimed = await db.aiTask.updateMany({
      where: { id: taskId, status: "queued" },
      data: { status: "processing" },
    });
    if (claimed.count === 0) {
      // Someone else got it, or status changed
      return;
    }

    const task = await db.aiTask.findUnique({ where: { id: taskId } });
    if (!task) {
      stats.inFlight--;
      return;
    }

    console.log(
      `[ai-worker] Processing task ${task.id} (workflow: ${task.workflow})`,
    );

    stats.workflowCounts[task.workflow] =
      (stats.workflowCounts[task.workflow] || 0) + 1;

    // Build the prompt
    const systemPrompt =
      WORKFLOW_PROMPTS[task.workflow] || DEFAULT_PROMPT;
    const userPrompt = `${task.objective}\n\n---\n\nFull brief:\n${task.prompt}`;

    // Call z-ai-web-dev-sdk
    let zai: ZAI;
    try {
      zai = await ZAI.create();
    } catch (e) {
      throw new Error(
        `Failed to initialize ZAI SDK: ${e instanceof Error ? e.message : String(e)}. The ai-worker cannot execute tasks without the SDK. Ensure z-ai-web-dev-sdk is installed and credentials are available.`,
      );
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    // Extract the response text
    let resultText: string;
    if (typeof completion === "string") {
      resultText = completion;
    } else if (completion?.choices?.[0]?.message?.content) {
      resultText = completion.choices[0].message.content;
    } else if (completion?.content) {
      resultText = completion.content;
    } else {
      resultText = JSON.stringify(completion, null, 2);
    }

    // Truncate if too long
    if (resultText.length > MAX_OUTPUT_CHARS) {
      resultText =
        resultText.slice(0, MAX_OUTPUT_CHARS) +
        "\n\n...[output truncated at " +
        MAX_OUTPUT_CHARS +
        " chars]";
    }

    // Determine next status
    const nextStatus = task.approvalRequired
      ? "awaiting-approval"
      : "delivered";

    await db.aiTask.update({
      where: { id: taskId },
      data: {
        status: nextStatus,
        result: resultText,
        completedAt: new Date(),
      },
    });

    stats.succeeded++;
    console.log(
      `[ai-worker] Task ${task.id} → ${nextStatus} (result: ${resultText.length} chars)`,
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error(`[ai-worker] Task ${taskId} FAILED:`, errMsg);
    stats.failed++;
    stats.lastError = errMsg;
    try {
      await db.aiTask.update({
        where: { id: taskId },
        data: {
          status: "failed",
          result: `**Execution failed:** ${errMsg}`,
          completedAt: new Date(),
        },
      });
    } catch (updateErr) {
      console.error(
        `[ai-worker] Failed to mark task ${taskId} as failed:`,
        updateErr,
      );
    }
  } finally {
    stats.inFlight--;
    stats.processed++;
  }
}

// ─── Poll tick ──────────────────────────────────────────────────────
async function tick(): Promise<void> {
  stats.lastTickAt = Date.now();
  stats.polled++;
  if (stats.inFlight >= MAX_CONCURRENT) return;

  try {
    const queued = await db.aiTask.findMany({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
      take: MAX_CONCURRENT - stats.inFlight,
      select: { id: true },
    });

    if (queued.length === 0) return;

    console.log(
      `[ai-worker] Found ${queued.length} queued task(s); processing...`,
    );

    // Process in parallel (up to MAX_CONCURRENT)
    await Promise.allSettled(queued.map((t) => processTask(t.id)));
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    console.error("[ai-worker] Tick error:", errMsg);
    stats.lastError = errMsg;
  }
}

// ─── Start the poller ───────────────────────────────────────────────
const tickTimer = setInterval(tick, TICK_INTERVAL_MS);
console.log(
  `[ai-worker] Poller started (interval: ${TICK_INTERVAL_MS}ms, max concurrent: ${MAX_CONCURRENT})`,
);

// Run one tick immediately on boot
tick().catch((e) =>
  console.error("[ai-worker] Initial tick failed:", e),
);

// ─── HTTP server (for health checks + manual triggers) ──────────────
const server = await Bun_.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          service: SERVICE_NAME,
          uptime: Math.floor((Date.now() - stats.startedAt) / 1000),
          processed: stats.processed,
          succeeded: stats.succeeded,
          failed: stats.failed,
          inFlight: stats.inFlight,
        }),
        { headers: { "content-type": "application/json" } },
      );
    }

    if (path === "/stats") {
      return new Response(
        JSON.stringify(
          {
            ...stats,
            uptimeSeconds: Math.floor(
              (Date.now() - stats.startedAt) / 1000,
            ),
          },
          null,
          2,
        ),
        { headers: { "content-type": "application/json" } },
      );
    }

    if (path.startsWith("/process/") && req.method === "POST") {
      const taskId = path.replace("/process/", "");
      if (!taskId) {
        return new Response(
          JSON.stringify({ error: "Missing taskId" }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
      }
      processTask(taskId).catch((e) =>
        console.error("[ai-worker] Manual process error:", e),
      );
      return new Response(
        JSON.stringify({
          message: "Processing triggered",
          taskId,
        }),
        { headers: { "content-type": "application/json" } },
      );
    }

    if (path === "/tick" && req.method === "POST") {
      tick().catch((e) =>
        console.error("[ai-worker] Manual tick error:", e),
      );
      return new Response(
        JSON.stringify({ message: "Tick triggered" }),
        { headers: { "content-type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found", path }),
      { status: 404, headers: { "content-type": "application/json" } },
    );
  },
});

console.log(
  `[ai-worker] Listening on http://localhost:${server.port} (pid: ${process.pid})`,
);

// ─── Graceful shutdown ──────────────────────────────────────────────
const shutdown = async (signal: string) => {
  console.log(`[ai-worker] Received ${signal}, shutting down...`);
  clearInterval(tickTimer);
  server.stop(true);
  await db.$disconnect();
  process.exit(0);
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
