import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/readiness
 *
 * Kubernetes-style readiness probe. PUBLIC (no auth) — intended to be hit
 * frequently by an external orchestrator (kubelet, load balancer, etc.) to
 * decide whether to route traffic to this instance.
 *
 *   - 200 + { success: true, data: { status: "ready", timestamp } } when the
 *     app can serve traffic (DB reachable within 3 seconds).
 *   - 503 + { success: false, data: { status: "not_ready", reason } } when
 *     the database cannot be reached.
 *
 * SECURITY: never exposes DB URL, internal paths, raw exceptions, or any
 * secret material. The `reason` string is a fixed, non-sensitive label.
 *
 * Recommended probe schedule: every 5–10 seconds.
 */
export async function GET() {
  // 3s timeout promise — resolves false if the DB doesn't respond in time.
  const TIMEOUT_MS = 3000;
  const timeout = new Promise<false>((resolve) => {
    setTimeout(() => resolve(false), TIMEOUT_MS);
  });

  // Best-effort DB ping. Resolves true on success, false on any error.
  const dbOk = db
    .user.count()
    .then(() => true)
    .catch(() => false);

  try {
    const ready = await Promise.race([dbOk, timeout]);
    if (ready) {
      return NextResponse.json(
        {
          success: true,
          message: "Service is ready.",
          data: {
            status: "ready",
            timestamp: new Date().toISOString(),
          },
          meta: {},
          errors: [],
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: "Service is not ready.",
        data: {
          status: "not_ready",
          reason: "database unreachable",
        },
        meta: {},
        errors: ["db_unreachable"],
      },
      { status: 503 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Service is not ready.",
        data: {
          status: "not_ready",
          reason: "unexpected error",
        },
        meta: {},
        errors: ["readiness_check_failed"],
      },
      { status: 503 }
    );
  }
}
