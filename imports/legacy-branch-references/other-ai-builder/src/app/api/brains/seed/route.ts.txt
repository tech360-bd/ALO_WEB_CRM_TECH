import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/seed
// Seed default skill + tool assignments for existing AiAgents (idempotent).
// Auth: super admin / admin.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { seedDefaultBrainAssignments } = await import("@/lib/agent-extension-registry");
    const result = await seedDefaultBrainAssignments();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[brains/seed] error", err);
    return NextResponse.json({ error: err?.message || "Seed failed" }, { status: 500 });
  }
}
