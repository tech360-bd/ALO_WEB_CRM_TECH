import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/admin-api";
import { toCsv, yyyymmdd, type CsvColumn } from "@/lib/csv";

export const dynamic = "force-dynamic";

type SubscriberRow = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  subscribedAt: Date;
};

const COLUMNS: CsvColumn<SubscriberRow>[] = [
  { header: "id", key: "id" },
  { header: "email", key: "email" },
  { header: "status", key: "status" },
  // NewsletterSubscriber has no dedicated `source` field — we use
  // `interest` (the segment/topic they subscribed under) as the
  // closest semantic match. `subscribedAt` maps to `createdAt`.
  { header: "source", key: "source" },
  { header: "subscribedAt", get: (r) => r.subscribedAt.toISOString() },
];

/** GET /api/v1/admin/newsletter/export — CSV download of all subscribers. */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "newsletter.export");
  if (guard.denied) return guard.response;

  try {
    const rows = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        interest: true,
        createdAt: true,
      },
    });
    const mapped: SubscriberRow[] = rows.map((r) => ({
      id: r.id,
      email: r.email,
      status: r.status,
      source: r.interest,
      subscribedAt: r.createdAt,
    }));
    const csv = toCsv(mapped, COLUMNS);
    const filename = `newsletter-${yyyymmdd()}.csv`;
    await writeAudit(guard.session, "newsletter.exported", "NewsletterSubscriber", undefined, {
      count: mapped.length,
      filename,
    });
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    console.error("[newsletter/export] error", e);
    return NextResponse.json(
      { success: false, message: "Export failed.", data: null, meta: {}, errors: [(e as Error).message] },
      { status: 500 }
    );
  }
}
