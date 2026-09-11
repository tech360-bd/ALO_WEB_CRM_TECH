import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { seedDefaultBrainAssignments } from "@/lib/agent-extension-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seed — SUPER_ADMIN only. Idempotent.
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only SUPER_ADMIN can seed brain assignments" },
        { status: 403 }
      );
    }

    const result = await seedDefaultBrainAssignments();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
