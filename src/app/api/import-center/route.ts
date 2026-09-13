import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Import Center — for importing courses/universities/scholarships from external sources
// Also handles public data approval workflow
export async function GET() {
  // Return pending imports + pending approval items
  const pendingCountries = await db.countryPage.findMany({ where: { approvalStatus: { not: "PUBLISHED" } }, select: { slug: true, name: true, approvalStatus: true, verificationStatus: true, updatedAt: true } });
  const pendingUniversities = await db.universityPage.findMany({ where: { approvalStatus: { not: "PUBLISHED" } }, select: { slug: true, name: true, approvalStatus: true, verificationStatus: true, updatedAt: true } });
  const pendingCourses = await db.coursePage.findMany({ where: { approvalStatus: { not: "PUBLISHED" } }, select: { slug: true, name: true, approvalStatus: true, verificationStatus: true, updatedAt: true } });
  const pendingExams = await db.examPage.findMany({ where: { approvalStatus: { not: "PUBLISHED" } }, select: { slug: true, name: true, approvalStatus: true, verificationStatus: true, updatedAt: true } });

  return NextResponse.json({
    pending: { countries: pendingCountries, universities: pendingUniversities, courses: pendingCourses, exams: pendingExams },
    summary: {
      totalPending: pendingCountries.length + pendingUniversities.length + pendingCourses.length + pendingExams.length,
      published: {
        countries: await db.countryPage.count({ where: { approvalStatus: "PUBLISHED" } }),
        universities: await db.universityPage.count({ where: { approvalStatus: "PUBLISHED" } }),
        courses: await db.coursePage.count({ where: { approvalStatus: "PUBLISHED" } }),
        exams: await db.examPage.count({ where: { approvalStatus: "PUBLISHED" } }),
      },
    },
  });
}

// Approve / publish a content item
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { type, slug, action, userId } = body; // type: country|university|course|exam, action: approve|reject|publish
  const modelMap: any = { country: db.countryPage, university: db.universityPage, course: db.coursePage, exam: db.examPage };
  const model = modelMap[type];
  if (!model) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const status = action === "publish" ? "PUBLISHED" : action === "reject" ? "DRAFT" : "PENDING_REVIEW";
  const updated = await model.update({ where: { slug }, data: { approvalStatus: status, verificationStatus: "VERIFIED" } });

  await db.auditLog.create({
    data: { userId, action: "PUBLIC_PUBLISH", resource: type, resourceId: slug, details: JSON.stringify({ action, status }) },
  });

  return NextResponse.json({ item: updated, message: `${type} ${action}d successfully` });
}
