import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getExtensions, mapExtension } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/integrations/3cx/extensions — list mapped extensions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await getExtensions();
  return NextResponse.json(result);
}

// POST /api/integrations/3cx/extensions — map extension to employee
// Body: { extension, employeeId, mappedBy? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { extension, employeeId, mappedBy } = body;

  if (!extension || !employeeId) {
    return NextResponse.json(
      { error: "extension and employeeId are required" },
      { status: 400 }
    );
  }

  const actorId = mappedBy || (session.user as any)?.id || "system";
  try {
    const result = await mapExtension(extension, employeeId, actorId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Map failed" },
      { status: 400 }
    );
  }
}
