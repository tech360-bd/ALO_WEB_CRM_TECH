// International Officer Dashboard — Aggregated metrics for university research, partnerships, communications, contacts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Parallel counts
    const [
      totalUniversitiesResearched,
      totalEvidence,
      totalAgreements,
      pendingAgreements,
      activeAgreements,
      totalContacts,
      universityContacts,
      totalEmails,
      totalResearchActivities,
      pendingActivities,
      totalKnowledgePosts,
      businessStrategies,
    ] = await Promise.all([
      db.crmUniversity.count().catch(() => 0),
      db.universityResearchEvidence.count().catch(() => 0),
      db.universityAgreement.count().catch(() => 0),
      db.universityAgreement.count({ where: { status: { in: ["PENDING", "REQUESTED", "UNDER_REVIEW"] } } }).catch(() => 0),
      db.universityAgreement.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      db.b2BContact.count().catch(() => 0),
      db.b2BContact.count({ where: { type: "UNIVERSITY" } }).catch(() => 0),
      db.officialEmail.count().catch(() => 0),
      db.universityResearchActivity.count().catch(() => 0),
      db.universityResearchActivity.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }).catch(() => 0),
      db.knowledgeSharingPost.count({ where: { category: { in: ["partnership", "research", "business_strategy"] } } }).catch(() => 0),
      db.partnershipBusinessStrategy.count({ where: { status: "ACTIVE" } }).catch(() => 0),
    ]);

    // Recent activities
    const [recentResearchActivities, recentCommunications, recentAgreements, recentEvidence] = await Promise.all([
      db.universityResearchActivity.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
      db.partnershipCommunication.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
      db.universityAgreement.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
      db.universityResearchEvidence.findMany({ orderBy: { createdAt: "desc" }, take: 10 }).catch(() => []),
    ]);

    // Top countries for partnerships — derived from agreements and contacts
    const agreementsByCountry = await db.universityAgreement.groupBy({
      by: ["countrySlug"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }).catch(() => []);

    const contactsByCountry = await db.b2BContact.groupBy({
      by: ["countrySlug"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      metrics: {
        totalUniversitiesResearched,
        totalEvidence,
        totalAgreements,
        pendingAgreements,
        activeAgreements,
        totalContacts,
        universityContacts,
        totalEmails,
        totalResearchActivities,
        pendingActivities,
        totalKnowledgePosts,
        businessStrategies,
      },
      recent: {
        researchActivities: recentResearchActivities,
        communications: recentCommunications,
        agreements: recentAgreements,
        evidence: recentEvidence,
      },
      analytics: {
        agreementsByCountry,
        contactsByCountry,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
