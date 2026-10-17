import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/source-intelligence/evidence
// Lists UniversityResearchEvidence records. Auth: admin only.
// Query params: universitySlug?, verificationStatus?, evidenceType?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const where: any = {};
    if (sp.get("universitySlug")) where.universitySlug = sp.get("universitySlug");
    if (sp.get("verificationStatus")) where.verificationStatus = sp.get("verificationStatus");
    if (sp.get("evidenceType")) where.evidenceType = sp.get("evidenceType");

    const limit = Math.min(parseInt(sp.get("limit") || "100", 10) || 100, 500);
    const xdb = db as unknown as {
      universityResearchEvidence: {
        findMany: (args: Record<string, unknown>) => Promise<any[]>;
      };
    };
    const evidence = await xdb.universityResearchEvidence.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ evidence });
  } catch (err: any) {
    console.error("[source-intelligence/evidence GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load evidence" }, { status: 500 });
  }
}

// POST /api/source-intelligence/evidence
// Create a new UniversityResearchEvidence record.
// Auth: admin only.
// Body: ResearchEvidenceParams
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.universitySlug || !body?.sourceUrl || !body?.claim) {
      return NextResponse.json(
        { error: "universitySlug, sourceUrl, claim are required" },
        { status: 400 }
      );
    }

    const { createResearchEvidence } = await import("@/lib/source-intelligence");
    const result = await createResearchEvidence(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[source-intelligence/evidence POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create evidence" }, { status: 500 });
  }
}
