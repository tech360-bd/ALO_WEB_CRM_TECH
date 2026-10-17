import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/extensions
// Returns all 3CX extension mappings. Auth: any staff/admin.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getExtensions } = await import("@/lib/threecx-integration");
    const extensions = await getExtensions();
    return NextResponse.json({ extensions });
  } catch (err: any) {
    console.error("[3cx/extensions GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load extensions" }, { status: 500 });
  }
}

// POST /api/integrations/3cx/extensions
// Map (or remap) a 3CX extension to an employee. Auth: any staff/admin.
// Body: { extension, employeeId }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { extension, employeeId } = body || {};
    if (!extension || !employeeId) {
      return NextResponse.json({ error: "extension and employeeId are required" }, { status: 400 });
    }

    const { mapExtension } = await import("@/lib/threecx-integration");
    const result = await mapExtension(
      String(extension),
      String(employeeId),
      (session.user as any).id || undefined
    );
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (err: any) {
    console.error("[3cx/extensions POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to map extension" }, { status: 500 });
  }
}
