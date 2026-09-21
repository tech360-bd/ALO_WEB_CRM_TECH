import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";

// Super Admin / Staff course management — CRUD
async function listAdminCourses(req: Request, _auth: AuthContext) {
  const searchParams = new URL(req.url).searchParams;
  const search = searchParams.get("q");
  const status = searchParams.get("status");
  const where: any = {};
  if (status) where.approvalStatus = status;
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { subject: { contains: search } },
    ];
  }

  const courses = await db.coursePage.findMany({
    where,
    include: {
      university: { select: { name: true, slug: true, city: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  // Fetch country info separately
  const countrySlugs = Array.from(new Set(courses.map((c) => c.countrySlug).filter(Boolean)));
  const countries = countrySlugs.length > 0 ? await db.countryPage.findMany({ where: { slug: { in: countrySlugs } }, select: { slug: true, name: true, shortName: true, flag: true } }) : [];
  const cmap: Record<string, any> = {};
  for (const c of countries) cmap[c.slug] = c;
  const coursesWithCountry = courses.map((c) => ({ ...c, country: cmap[c.countrySlug] || null }));

  return NextResponse.json({
    courses: coursesWithCountry,
    summary: {
      total: await db.coursePage.count(),
      published: await db.coursePage.count({ where: { approvalStatus: "PUBLISHED" } }),
      draft: await db.coursePage.count({ where: { approvalStatus: "DRAFT" } }),
      pendingReview: await db.coursePage.count({ where: { approvalStatus: "PENDING_REVIEW" } }),
    },
  });
}

// Create course
async function createAdminCourse(req: Request, _auth: AuthContext) {
  const body = await req.json();
  const course = await db.coursePage.create({
    data: {
      slug: body.slug,
      name: body.name,
      universitySlug: body.universitySlug,
      countrySlug: body.countrySlug,
      city: body.city,
      level: body.level,
      subject: body.subject,
      duration: body.duration,
      intake: body.intake,
      tuition: body.tuition,
      scholarship: body.scholarship,
      englishRequirement: body.englishRequirement,
      academicRequirement: body.academicRequirement,
      overview: body.overview,
      modules: JSON.stringify(body.modules || []),
      careerOutcomes: JSON.stringify(body.careerOutcomes || []),
      documents: JSON.stringify(body.documents || []),
      faqs: JSON.stringify(body.faqs || []),
      deadline: body.deadline,
      sourceUrl: body.sourceUrl,
      lastVerifiedAt: new Date(),
      verificationStatus: "VERIFIED",
      approvalStatus: body.approvalStatus || "DRAFT",
    },
  });
  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "CoursePage", resourceId: course.id, details: JSON.stringify({ name: body.name, slug: body.slug }) },
  });
  return NextResponse.json({ course, message: "Course created successfully." });
}

// Update course
async function updateAdminCourse(req: Request, _auth: AuthContext) {
  const body = await req.json();
  const { id, ...data } = body;
  const course = await db.coursePage.update({
    where: { id },
    data: { ...data, lastVerifiedAt: new Date() },
  });
  await db.auditLog.create({
    data: { action: "PROFILE_UPDATE", resource: "CoursePage", resourceId: id, details: JSON.stringify(Object.keys(data)) },
  });
  return NextResponse.json({ course, message: "Course updated successfully." });
}

// Delete course
async function deleteAdminCourse(req: Request, _auth: AuthContext) {
  const { id } = await req.json();
  await db.coursePage.delete({ where: { id } });
  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "CoursePage", resourceId: id, details: JSON.stringify({ deleted: true }) },
  });
  return NextResponse.json({ message: "Course deleted successfully." });
}

const ADMIN_COURSE_ACCESS = { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "MARKETING_MANAGER"] };
export const GET = withAuth(listAdminCourses, ADMIN_COURSE_ACCESS);
export const POST = withAuth(createAdminCourse, ADMIN_COURSE_ACCESS);
export const PATCH = withAuth(updateAdminCourse, ADMIN_COURSE_ACCESS);
export const DELETE = withAuth(deleteAdminCourse, ADMIN_COURSE_ACCESS);
