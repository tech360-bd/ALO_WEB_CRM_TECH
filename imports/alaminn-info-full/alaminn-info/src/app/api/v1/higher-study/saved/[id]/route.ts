/**
 * DELETE /api/v1/higher-study/saved/[id]
 * --------------------------------------------------------------------
 * Removes a saved item. The item must belong to the caller — matched
 * by userId (if authenticated) or sessionId (if anonymous).
 *
 * Returns 200 on success, 404 if the item doesn't exist or doesn't
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

    // Confirm ownership before deleting.
    const existing = await db.higherStudySavedItem.findFirst({
      where: { id: cleanId, ...where },
      select: { id: true },
    });
    if (!existing) {
      return jsonResponse(false, "Saved item not found.", null, {}, ["not_found"], 404);
    }

    await db.higherStudySavedItem.delete({ where: { id: cleanId } });

    return jsonResponse(true, "Saved item removed.", { id: cleanId });
  } catch (err) {
    console.error("[higher-study/saved/[id] DELETE] error", err);
    return jsonResponse(false, "Internal server error.", null, {}, ["internal"], 500);
  }
}
