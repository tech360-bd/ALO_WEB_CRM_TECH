import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Super Admin / Staff course management — CRUD
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q");
  const status = req.nextUrl.searchParams.get("status");
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
export async function POST(req: NextRequest) {
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
export async function PATCH(req: NextRequest) {
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
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await db.coursePage.delete({ where: { id } });
  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "CoursePage", resourceId: id, details: JSON.stringify({ deleted: true }) },
  });
  return NextResponse.json({ message: "Course deleted successfully." });
}
