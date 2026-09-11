import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { initiateClickToCall } from "@/lib/threecx-integration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/integrations/3cx/click-to-call
// Body: { extension, destination }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { extension, destination } = body;

  if (!extension || !destination) {
    return NextResponse.json(
      { error: "extension and destination are required" },
      { status: 400 }
    );
  }

  try {
    const result = await initiateClickToCall(extension, destination);
    if (!result.success) {
      return NextResponse.json(result, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Click-to-call failed" },
      { status: 500 }
    );
  }
}
