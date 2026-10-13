import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/analytics — aggregate analytics for last N days (?days=30) */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;

  const url = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get("days") || "30")));
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalEvents, topPages, topSources, topEvents, daily] = await Promise.all([
    db.analyticsEvent.count({ where: { createdAt: { gte: start } } }),
    db.analyticsEvent.groupBy({
      by: ["page"],
      where: { createdAt: { gte: start }, page: { not: null } },
      _count: { page: true },
      orderBy: { _count: { page: "desc" } },
      take: 20,
    }),
    db.analyticsEvent.groupBy({
      by: ["utmSource"],
      where: { createdAt: { gte: start }, utmSource: { not: null } },
      _count: { utmSource: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 20,
    }),
    db.analyticsEvent.groupBy({
      by: ["eventName"],
      where: { createdAt: { gte: start } },
      _count: { eventName: true },
      orderBy: { _count: { eventName: "desc" } },
      take: 20,
    }),
    db.analyticsEvent.groupBy({
      by: ["page"],
      where: { createdAt: { gte: start } },
      _count: { page: true },
      orderBy: { _count: { page: "desc" } },
      take: 100,
    }),
  ]);

  return ok({
    windowDays: days,
    totalEvents,
    topPages: topPages.map((p) => ({ page: p.page, count: p._count.page })),
    topSources: topSources.map((s) => ({ source: s.utmSource, count: s._count.utmSource })),
    topEvents: topEvents.map((e) => ({ event: e.eventName, count: e._count.eventName })),
    daily: daily.map((d) => ({ page: d.page, count: d._count.page })),
  }, "Analytics loaded.");
}
