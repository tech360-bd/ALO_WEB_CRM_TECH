import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/university-monitoring/sources
// Returns registered official sources with filters.
export async function GET(req: NextRequest) {
  const entityType = req.nextUrl.searchParams.get("entityType");
  const countrySlug = req.nextUrl.searchParams.get("country");
  const universitySlug = req.nextUrl.searchParams.get("university");
  const status = req.nextUrl.searchParams.get("status");
  const sourceType = req.nextUrl.searchParams.get("sourceType");
  const q = req.nextUrl.searchParams.get("q");
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100"), 500);

  const where: any = {};
  if (entityType) where.entityType = entityType;
  if (countrySlug) where.countrySlug = countrySlug;
  if (universitySlug) where.universitySlug = universitySlug;
  if (status) where.status = status;
  if (sourceType) where.sourceType = sourceType;
  if (q) {
    where.OR = [
      { sourceName: { contains: q } },
      { sourceUrl: { contains: q } },
    ];
  }

  const [sources, total] = await Promise.all([
    db.officialSource.findMany({
      where,
      orderBy: [{ priority: "asc" }, { sourceName: "asc" }],
      take: limit,
      select: {
        id: true, sourceUrl: true, sourceName: true, sourceType: true, category: true, priority: true,
        entityType: true, universitySlug: true, courseSlug: true, countrySlug: true,
        monitoringEnabled: true, checkFrequencyDays: true,
        lastCheckedAt: true, lastHttpStatus: true, lastContentHash: true,
        lastError: true, consecutiveFailures: true,
        status: true, discoveredAt: true, lastVerifiedAt: true,
        _count: { select: { snapshots: true, changes: true, documents: true } },
      },
    }),
    db.officialSource.count({ where }),
  ]);

  return NextResponse.json({ sources, total });
}

// POST /api/university-monitoring/sources
// Super Admin: register a new official source.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sourceUrl, sourceName, sourceType, category, entityType, universitySlug, courseSlug, countrySlug, priority, checkFrequencyDays } = body;

  if (!sourceUrl || !sourceName || !entityType) {
    return NextResponse.json({ error: "sourceUrl, sourceName, and entityType are required" }, { status: 400 });
  }

  const existing = await db.officialSource.findUnique({ where: { sourceUrl } });
  if (existing) {
    return NextResponse.json({ error: "A source with this URL already exists" }, { status: 400 });
  }

  const source = await db.officialSource.create({
    data: {
      sourceUrl,
      sourceName,
      sourceType: sourceType || "UNIVERSITY_OFFICIAL",
      category,
      entityType,
      universitySlug,
      courseSlug,
      countrySlug,
      priority: priority || 1,
      checkFrequencyDays: checkFrequencyDays || 7,
      monitoringEnabled: true,
      status: "ACTIVE",
    },
  });

  await db.auditLog.create({
    data: {
      userId: body.performedBy || "system",
      action: "OFFICIAL_SOURCE_REGISTERED",
      resource: "OfficialSource",
      resourceId: source.id,
      details: JSON.stringify({ sourceUrl, sourceName, entityType }),
    },
  });

  return NextResponse.json({ source, message: "Official source registered" });
}

// PATCH /api/university-monitoring/sources
// Super Admin: update source config (pause/resume/retire).
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, monitoringEnabled, checkFrequencyDays } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: any = {};
  if (status) data.status = status;
  if (typeof monitoringEnabled === "boolean") data.monitoringEnabled = monitoringEnabled;
  if (checkFrequencyDays) data.checkFrequencyDays = checkFrequencyDays;

  const source = await db.officialSource.update({ where: { id }, data });

  await db.auditLog.create({
    data: {
      userId: body.performedBy || "system",
      action: "OFFICIAL_SOURCE_UPDATED",
      resource: "OfficialSource",
      resourceId: id,
      details: JSON.stringify(data),
    },
  });

  return NextResponse.json({ source, message: "Source updated" });
}
