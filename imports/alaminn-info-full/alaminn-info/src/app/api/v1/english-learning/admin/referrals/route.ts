/**
 * GET /api/v1/english-learning/admin/referrals
 * --------------------------------------------------------------------
 * Paginated list of English Learning referrals, newest first.
 *
 * Query params:
 *  - status        — created | transferred | completed | failed | expired
 *  - referralType  — course-package | tutor-booking | mock-test-bundle
 *  - referralCode  — exact match lookup
 *  - page, limit
 *
 * Permission: `english-learning.referrals.view`.
 */
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  safeString,
} from "@/lib/english-learning/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "english-learning.referrals.view");
  if (guard.denied) return guard.response;

  try {
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const status = safeString(url.searchParams.get("status"));
    const referralType = safeString(url.searchParams.get("referralType"));
    const referralCode = safeString(url.searchParams.get("referralCode"));

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (referralType) where.referralType = referralType;
    if (referralCode) where.referralCode = referralCode;

    const [items, total] = await Promise.all([
      db.englishLearningReferral.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.englishLearningReferral.count({ where }),
    ]);

    return jsonResponse(
      true,
      "Referrals retrieved.",
      { items },
      { pagination: buildPaginationMeta(params, total) },
    );
  } catch (err) {
    console.error("[english-learning/admin/referrals] error", err);
    return jsonResponse(
      false,
      "Internal server error.",
      null,
      {},
      ["internal"],
      500,
    );
  }
}
