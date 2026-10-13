/**
 * GET /api/v1/higher-study/admin/referrals
 * --------------------------------------------------------------------
 * Paginated list of HigherStudyReferral records.
 *
 * Query: ?status&referralType&page&limit
 *
 * Permission: `higher-study.referrals.view`
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  safeString,
} from "@/lib/higher-study/api-helpers";
import { internalError } from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "higher-study.referrals.view");
  if (guard.denied) return guard.response;

  try {
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const status = safeString(url.searchParams.get("status"));
    const referralType = safeString(url.searchParams.get("referralType"));

    const where: Prisma.HigherStudyReferralWhereInput = {};
    if (status) where.status = status;
    if (referralType) where.referralType = referralType;

    const [items, total] = await Promise.all([
      db.higherStudyReferral.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.higherStudyReferral.count({ where }),
    ]);

    return jsonResponse(
      true,
      "Referrals retrieved.",
      { items },
      { pagination: buildPaginationMeta(params, total) },
    );
  } catch (err) {
    console.error("[admin/referrals GET] error", err);
    return internalError();
  }
}
