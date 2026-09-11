import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createResearchEvidence, getUniversityEvidenceSummary } from "@/lib/source-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/source-intelligence/evidence?university=<slug>
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const universitySlug = req.nextUrl.searchParams.get("university");
  const fieldName = req.nextUrl.searchParams.get("fieldName");
  const verificationStatus = req.nextUrl.searchParams.get("verificationStatus");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  // If only university is provided, return summary
  if (universitySlug && !fieldName && !verificationStatus) {
    const summary = await getUniversityEvidenceSummary(universitySlug);
    return NextResponse.json(summary);
  }

  const where: any = {};
  if (universitySlug) where.universitySlug = universitySlug;
  if (fieldName) where.fieldName = fieldName;
  if (verificationStatus) where.verificationStatus = verificationStatus;

  const [evidence, total] = await Promise.all([
    db.universityResearchEvidence.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      take: limit,
    }),
    db.universityResearchEvidence.count({ where }),
  ]);

  return NextResponse.json({ evidence, total });
}

// POST /api/source-intelligence/evidence — create new research evidence
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    universitySlug,
    courseSlug,
    fieldName,
    fieldValue,
    sourceUrl,
    sourceTitle,
    sourceSection,
    contentHash,
    sourceSnapshot,
    confidence,
    aiAgentId,
  } = body;

  if (!universitySlug || !fieldName || !fieldValue || !sourceUrl) {
    return NextResponse.json(
      { error: "universitySlug, fieldName, fieldValue, sourceUrl are required" },
      { status: 400 }
    );
  }

  const evidence = await createResearchEvidence({
    universitySlug,
    courseSlug: courseSlug ?? null,
    fieldName,
    fieldValue,
    sourceUrl,
    sourceTitle: sourceTitle ?? null,
    sourceSection: sourceSection ?? null,
    contentHash: contentHash ?? null,
    sourceSnapshot: sourceSnapshot ?? null,
    confidence: typeof confidence === "number" ? confidence : 0.5,
    aiAgentId: aiAgentId ?? null,
  });

  return NextResponse.json({ evidence });
}
