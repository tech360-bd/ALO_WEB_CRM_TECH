/**
 * DELETE /api/v1/higher-study/alerts/[id]
 * --------------------------------------------------------------------
 * Cancels an alert subscription. The alert must belong to the caller.
 *
 * Returns 200 on success, 404 if the alert doesn't exist or doesn't
 * belong to the caller.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  jsonResponse,
  safeString,
  hashIp,
} from "@/lib/higher-study/api-helpers";
import { rateLimit } from "@/lib/higher-study/rate-limit";
import { resolveCaller, callerWhere } from "../../_lib/caller";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = hashIp(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown",
    process.env.HIGHER_STUDY_REFERRAL_SECRET ?? "alaminn-hs",
  );
  if (rateLimit(ip, 30)) {
    return jsonResponse(
      false,
      "Too many requests. Please slow down.",
      null,
      {},
      ["rate_limited"],
      429,
    );
  }

  try {
    const { id } = await params;
    const cleanId = safeString(id);
    if (!cleanId) {
      return jsonResponse(false, "ID is required.", null, {}, ["id_required"], 400);
    }

    const ctx = resolveCaller(req);
    const where = callerWhere(ctx);
    if (!where) {
      return jsonResponse(
        false,
        "Either an authenticated session or a sessionId is required.",
        null,
        {},
        ["caller_required"],
        400,
      );
    }

    const existing = await db.higherStudyAlert.findFirst({
      where: { id: cleanId, ...where },
      select: { id: true, status: true },
    });
    if (!existing) {
      return jsonResponse(false, "Alert not found.", null, {}, ["not_found"], 404);
    }

    await db.higherStudyAlert.update({
      where: { id: cleanId },
      data: { status: "cancelled" },
    });

    return jsonResponse(true, "Alert cancelled.", { id: cleanId });
  } catch (err) {
    console.error("[higher-study/alerts/[id] DELETE] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
