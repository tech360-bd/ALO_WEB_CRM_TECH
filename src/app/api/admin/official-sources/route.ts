// ============================================================
// /api/admin/official-sources — "+ Add Official Source" (spec §45-48).
// Stores sourceUrl/sourceName/lastVerifiedAt against any content target
// (scholarship, service, resource, university, course...) in the existing
// OfficialSource model. SUPER_ADMIN/ADMIN only; audit-logged.
//
// Preferred source types (spec §48 SOURCE RULE):
//   official_university, official_government, official_visa_authority,
//   official_test_provider, official_scholarship, ALO_editorial, other
export const SOURCE_TYPE_CHOICES = [
  'official_university', 'official_government', 'official_visa_authority',
  'official_test_provider', 'official_scholarship', 'ALO_editorial', 'other',
] as const;
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { contentAuditLog } from "@/lib/content-audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "SUPER_ADMIN" && role !== "ADMIN")) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized — SUPER_ADMIN or ADMIN only" }, { status: 401 });

  const targetType = req.nextUrl.searchParams.get("targetType") || "";
  const targetSlug = req.nextUrl.searchParams.get("targetSlug") || "";
  const where: any = {};
  if (targetType) where.targetType = targetType;
  if (targetSlug) where.targetSlug = targetSlug;

  const sources = await db.officialSource.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []);
  return NextResponse.json({ sources, total: sources.length });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized — SUPER_ADMIN or ADMIN only" }, { status: 401 });

  try {
    const body = await req.json();
    const { sourceUrl, sourceTitle = "", sourceType = "official_university", targetType = "", targetId = "", targetSlug = "", dataSection = "", verificationStatus = "pending", notes = "" } = body as any;
    if (!sourceUrl || !/^https?:\/\//i.test(String(sourceUrl))) {
      return NextResponse.json({ error: "A valid official source URL (https://…) is required" }, { status: 400 });
    }

    const source = await db.officialSource.create({
      data: {
        sourceUrl: String(sourceUrl),
        sourceTitle: String(sourceTitle || ""),
        sourceType: String(sourceType || "official_university"),
        targetType: String(targetType || ""),
        targetId: String(targetId || ""),
        targetSlug: String(targetSlug || ""),
        dataSection: String(dataSection || ""),
        verificationStatus: String(verificationStatus || "pending"),
        lastVerifiedAt: verificationStatus === "verified" ? new Date() : null,
        verifiedBy: verificationStatus === "verified" ? String((session.user as any).email || (session.user as any).id) : "",
        notes: String(notes || ""),
      },
    });

    await contentAuditLog({
      userId: (session.user as any).id,
      action: "OFFICIAL_SOURCE_ADDED",
      resource: "OfficialSource",
      resourceId: source.id,
      details: { targetType: source.targetType, targetSlug: source.targetSlug, sourceUrl: source.sourceUrl },
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to add official source" }, { status: 500 });
  }
}
