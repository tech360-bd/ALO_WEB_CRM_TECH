import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/admin-api";
import { toCsv, yyyymmdd, type CsvColumn } from "@/lib/csv";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  resource: string | null;
  resourceId: string | null;
  actorName: string;
  createdAt: Date;
  meta: string | null;
};

const COLUMNS: CsvColumn<AuditRow>[] = [
  { header: "id", key: "id" },
  { header: "action", key: "action" },
  { header: "resource", key: "resource" },
  { header: "resourceId", key: "resourceId" },
  { header: "actorName", key: "actorName" },
  { header: "createdAt", get: (r) => r.createdAt.toISOString() },
  { header: "meta", key: "meta" },
];

/** GET /api/v1/admin/audit-logs/export — CSV download of all audit logs. */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "audit_logs.export");
  if (guard.denied) return guard.response;

  try {
    const rows = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        meta: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
    });
    const mapped: AuditRow[] = rows.map((r) => ({
      id: r.id,
      action: r.action,
      resource: r.resource,
      resourceId: r.resourceId,
      actorName: r.actor?.name || r.actor?.email || "—",
      createdAt: r.createdAt,
      meta: r.meta,
    }));
    const csv = toCsv(mapped, COLUMNS);
    const filename = `audit-logs-${yyyymmdd()}.csv`;
    await writeAudit(guard.session, "audit_logs.exported", "AuditLog", undefined, {
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
    console.error("[audit-logs/export] error", e);
    return NextResponse.json(
      { success: false, message: "Export failed.", data: null, meta: {}, errors: [(e as Error).message] },
      { status: 500 }
    );
  }
}
