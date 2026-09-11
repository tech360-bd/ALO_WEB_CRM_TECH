import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unmapExtension } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/integrations/3cx/extensions/[id]?extension=<ext>
// Here [id] is the extension number (path-param) — we read it from query too for clarity.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // `id` is the extension number itself (route is /extensions/[id])
  const extension = req.nextUrl.searchParams.get("extension") || id;
  const unmappedBy = req.nextUrl.searchParams.get("unmappedBy") || (session.user as any)?.id || "system";

  try {
    const result = await unmapExtension(extension, unmappedBy);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unmap failed" },
      { status: 400 }
    );
  }
}

// GET — convenience: get single extension info (extension is in path)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Look up employee by extension
  const { db } = await import("@/lib/db");
  const employee = await db.employee.findFirst({
    where: { threecxExtension: id },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      designation: true,
      threecxExtension: true,
      status: true,
      department: { select: { name: true } },
    },
  });

  if (!employee) {
    return NextResponse.json({ mapped: false, extension: id });
  }
  return NextResponse.json({ mapped: true, extension: id, employee });
}
