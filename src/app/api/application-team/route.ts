import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Application Team dashboard — applications, documents to review, partner submissions
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const applications = await db.application.findMany({
    include: { student: { select: { studentId: true, fullName: true, email: true, mobile: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const documents = await db.document.findMany({
    where: { status: { in: ["UPLOADED", "UNDER_REVIEW"] } },
    include: { student: { select: { studentId: true, fullName: true } } },
    orderBy: { uploadedAt: "desc" },
  });

  const partnerEmails = await db.partnerEmailUpdate.findMany({
    where: { status: "PENDING" },
    orderBy: { receivedAt: "desc" },
  });

  const stageCounts: Record<string, number> = {};
  for (const a of applications) stageCounts[a.stage] = (stageCounts[a.stage] || 0) + 1;

  return NextResponse.json({
    metrics: {
      totalApplications: applications.length,
      documentsToReview: documents.length,
      pendingPartnerEmails: partnerEmails.length,
      submittedToday: applications.filter((a) => new Date(a.updatedAt).toDateString() === new Date().toDateString()).length,
    },
    stageCounts,
    applications: applications.slice(0, 20),
    documentsToReview: documents.slice(0, 20),
    partnerEmailUpdates: partnerEmails,
  });
}
