import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { writeAudit } from "@/lib/admin-api";
import { toCsv, yyyymmdd, type CsvColumn } from "@/lib/csv";

export const dynamic = "force-dynamic";

type ContactRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  role: string | null;
  status: string;
  createdAt: Date;
};

const COLUMNS: CsvColumn<ContactRow>[] = [
  { header: "id", key: "id" },
  { header: "fullName", key: "fullName" },
  { header: "email", key: "email" },
  { header: "phone", key: "phone" },
  { header: "organization", key: "organization" },
  { header: "role", key: "role" },
  { header: "status", key: "status" },
  { header: "createdAt", get: (r) => r.createdAt.toISOString() },
];

/** GET /api/v1/admin/contacts/export — CSV download of all contacts. */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.export");
  if (guard.denied) return guard.response;

  try {
    const rows = await db.contact.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        organization: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    const csv = toCsv(rows as ContactRow[], COLUMNS);
    const filename = `contacts-${yyyymmdd()}.csv`;
    await writeAudit(guard.session, "contacts.exported", "Contact", undefined, {
      count: rows.length,
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
    console.error("[contacts/export] error", e);
    return NextResponse.json(
      { success: false, message: "Export failed.", data: null, meta: {}, errors: [(e as Error).message] },
      { status: 500 }
    );
  }
}
