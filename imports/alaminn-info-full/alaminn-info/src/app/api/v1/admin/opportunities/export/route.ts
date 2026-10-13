import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/admin-api";
import { toCsv, yyyymmdd, type CsvColumn } from "@/lib/csv";

export const dynamic = "force-dynamic";

type OpportunityRow = {
  id: string;
  title: string;
  stage: string;
  priority: string;
  contactName: string;
  value: number | null;
  createdAt: Date;
};

const COLUMNS: CsvColumn<OpportunityRow>[] = [
  { header: "id", key: "id" },
  { header: "title", key: "title" },
  { header: "stage", key: "stage" },
  { header: "priority", key: "priority" },
  { header: "contactName", key: "contactName" },
  { header: "value", key: "value" },
  { header: "createdAt", get: (r) => r.createdAt.toISOString() },
];

/** GET /api/v1/admin/opportunities/export — CSV download of all opportunities. */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "opportunities.export");
  if (guard.denied) return guard.response;

  try {
    const rows = await db.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        stage: true,
        priority: true,
        value: true,
        createdAt: true,
        contact: { select: { fullName: true } },
      },
    });
    const mapped: OpportunityRow[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      stage: r.stage,
      priority: r.priority,
      contactName: r.contact?.fullName ?? "",
      value: r.value,
      createdAt: r.createdAt,
    }));
    const csv = toCsv(mapped, COLUMNS);
    const filename = `opportunities-${yyyymmdd()}.csv`;
    await writeAudit(guard.session, "opportunities.exported", "Opportunity", undefined, {
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
    console.error("[opportunities/export] error", e);
    return NextResponse.json(
      { success: false, message: "Export failed.", data: null, meta: {}, errors: [(e as Error).message] },
      { status: 500 }
    );
  }
}
