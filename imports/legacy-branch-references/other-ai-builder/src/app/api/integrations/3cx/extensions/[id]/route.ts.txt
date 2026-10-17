import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/integrations/3cx/extensions/[id]
// Unmap a 3CX extension from any employee.
// The [id] parameter is the extension string (URL-encoded if needed).
// Auth: admin only.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "extension id is required" }, { status: 400 });
    }

    const { unmapExtension } = await import("@/lib/threecx-integration");
    const result = await unmapExtension(id, (session.user as any).id || undefined);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[3cx/extensions/[id] DELETE] error", err);
    return NextResponse.json({ error: err?.message || "Failed to unmap extension" }, { status: 500 });
  }
}
