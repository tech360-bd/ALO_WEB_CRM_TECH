import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unmapExtension } from "@/lib/threecx-integration";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/integrations/3cx/extensions/[id]?extension=<ext>
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const extension = req.nextUrl.searchParams.get("extension") || id;
  const unmappedBy = req.nextUrl.searchParams.get("unmappedBy") || (session.user as any)?.id || "system";

  try {
    return NextResponse.json(await unmapExtension(extension, unmappedBy));
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unmap failed" }, { status: 400 });
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
  const profile = await db.employeeCommunicationProfile.findFirst({
    where: { threecxExtension: id },
    select: { employeeId: true, threecxExtension: true },
  });
  if (!profile) return NextResponse.json({ mapped: false, extension: id });

  const employee = await db.employee.findUnique({
    where: { id: profile.employeeId },
    select: { id: true, employeeId: true, name: true, designation: true, department: true, status: true },
  });
  if (!employee) return NextResponse.json({ mapped: false, extension: id });

  return NextResponse.json({
    mapped: true,
    extension: id,
    employee: {
      id: employee.id,
      employeeCode: employee.employeeId,
      fullName: employee.name,
      designation: employee.designation,
      threecxExtension: profile.threecxExtension,
      status: employee.status,
      department: employee.department,
    },
  });
}
