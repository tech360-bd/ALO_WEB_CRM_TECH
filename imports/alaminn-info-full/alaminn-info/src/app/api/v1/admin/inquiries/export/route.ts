import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/admin-api";
import { toCsv, yyyymmdd, type CsvColumn } from "@/lib/csv";

export const dynamic = "force-dynamic";

type InquiryRow = {
  id: string;
  reference: string;
  type: string;
  status: string;
  contactName: string;
  contactEmail: string;
  createdAt: Date;
};

const COLUMNS: CsvColumn<InquiryRow>[] = [
  { header: "id", key: "id" },
  { header: "reference", key: "reference" },
  { header: "type", key: "type" },
  { header: "status", key: "status" },
  { header: "contactName", key: "contactName" },
  { header: "contactEmail", key: "contactEmail" },
  { header: "createdAt", get: (r) => r.createdAt.toISOString() },
];

/** GET /api/v1/admin/inquiries/export — CSV download of all inquiries. */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "inquiries.export");
  if (guard.denied) return guard.response;

  try {
    const rows = await db.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        reference: true,
        type: true,
        status: true,
        createdAt: true,
        contact: { select: { fullName: true, email: true } },
      },
    });
    const mapped: InquiryRow[] = rows.map((r) => ({
      id: r.id,
      reference: r.reference,
      type: r.type,
      status: r.status,
      contactName: r.contact?.fullName ?? "",
      contactEmail: r.contact?.email ?? "",
      createdAt: r.createdAt,
    }));
    const csv = toCsv(mapped, COLUMNS);
    const filename = `inquiries-${yyyymmdd()}.csv`;
    await writeAudit(guard.session, "inquiries.exported", "Inquiry", undefined, {
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
    console.error("[inquiries/export] error", e);
    return NextResponse.json(
      { success: false, message: "Export failed.", data: null, meta: {}, errors: [(e as Error).message] },
      { status: 500 }
    );
  }
}
