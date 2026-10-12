import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, type AuthContext } from "@/lib/auth-middleware";
import {
  EDITOR_APPROVAL_STATES,
  EDITOR_VERIFICATION_DOWNGRADES,
  NEEDS_REVIEW,
  UNVERIFIED,
  changesFacts,
  isAcceptableSourceUrl,
  sanitizeCoursePageFields,
  auditActor,
  withoutUnchanged,
} from "@/lib/course-finder/content-page-guards";

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

// Create course.
// Phase 1 (2026-10-12): creation never marks content VERIFIED and never sets a
// verification date. The CoursePage schema defaults are VERIFIED/PUBLISHED, so
// both values are always written explicitly. Only allow-listed content fields
// are accepted; publication goes through the publish transition below.
async function createAdminCourse(req: Request, auth: AuthContext) {
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "A JSON object body is required" }, { status: 400 });
  const controlError = rejectControlFields(body, ["verificationStatus", "lastVerifiedAt"]);
  if (controlError) return controlError;
  const approvalStatus = body.approvalStatus === undefined ? "DRAFT" : body.approvalStatus;
  if (!EDITOR_APPROVAL_STATES.includes(approvalStatus as any)) {
    return NextResponse.json(
      { error: "New course pages start as DRAFT or PENDING_REVIEW. Publishing requires a verified record." },
      { status: 422 },
    );
  }
  const sanitized = sanitizeCoursePageFields(body);
  if (!sanitized.ok) return NextResponse.json({ error: sanitized.error }, { status: 400 });
  const data = sanitized.data;
  for (const required of ["slug", "name", "universitySlug", "countrySlug"]) {
    if (!data[required]) return NextResponse.json({ error: `${required} is required` }, { status: 400 });
  }
  const course = await db.coursePage.create({
    data: {
      city: "",
      level: "",
      subject: "",
      duration: "",
      intake: "",
      tuition: "",
      englishRequirement: "",
      academicRequirement: "",
      overview: "",
      ...data,
      lastVerifiedAt: null,
      verificationStatus: UNVERIFIED,
      approvalStatus: approvalStatus as string,
    } as any,
  });
  await db.auditLog.create({
    data: {
      action: "DATA_IMPORT",
      resource: "CoursePage",
      resourceId: course.id,
      actorRole: auth.userType || "",
      userId: auditActor(auth).userId,
      details: JSON.stringify({ name: data.name, slug: data.slug, verificationStatus: UNVERIFIED, approvalStatus, actor: auditActor(auth).actor }),
    },
  });
  return NextResponse.json({ course, message: "Course created as an unverified draft." });
}

// Update course.
// Phase 1: the body is never spread into Prisma. Content fields are
// allow-listed and validated; verification can only be downgraded here;
// approval can move to DRAFT/PENDING_REVIEW, and to PUBLISHED only for
// ADMIN/SUPER_ADMIN on a record that is already VERIFIED with a source URL.
// Editing a factual field of a VERIFIED record sends it back to review.
async function updateAdminCourse(req: Request, auth: AuthContext) {
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "A JSON object body is required" }, { status: 400 });
  const id = body.id;
  if (typeof id !== "string" || !id || id.length > 191) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const controlError = rejectControlFields(body, ["lastVerifiedAt"]);
  if (controlError) return controlError;

  const existing = await db.coursePage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  // The admin form re-sends every field. Values identical to the stored record
  // are not changes, so legacy values (e.g. an old http source URL) do not
  // block unrelated edits.
  const changedFields: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(body)) {
    if ((value ?? null) !== ((existing as any)[field] ?? null)) changedFields[field] = value;
  }
  const sanitized = sanitizeCoursePageFields(changedFields);
  if (!sanitized.ok) return NextResponse.json({ error: sanitized.error }, { status: 400 });

  // Normalisation (e.g. "" -> null, JSON re-serialisation) can turn a resent
  // value into the stored value; such fields are not changes either.
  const data: Record<string, unknown> = { ...withoutUnchanged(sanitized.data, existing as any) };
  const factsChanged = changesFacts(data, existing as any);
  let verificationStatus: string = existing.verificationStatus;
  let approvalStatus: string = existing.approvalStatus;

  // Verification: unchanged, or an explicit downgrade. Never an upgrade.
  if (body.verificationStatus !== undefined && body.verificationStatus !== existing.verificationStatus) {
    if (!EDITOR_VERIFICATION_DOWNGRADES.includes(body.verificationStatus as any)) {
      return NextResponse.json(
        { error: "Verification cannot be granted by editing. Use the evidence-backed verify action." },
        { status: 403 },
      );
    }
    verificationStatus = body.verificationStatus as string;
  }
  if (factsChanged && verificationStatus === "VERIFIED") verificationStatus = NEEDS_REVIEW;

  // Approval transitions.
  const requestedApproval = body.approvalStatus;
  const approvalRequested = requestedApproval !== undefined && requestedApproval !== existing.approvalStatus;
  if (approvalRequested) {
    if (requestedApproval === "PUBLISHED") {
      if (!["ADMIN", "SUPER_ADMIN"].includes((auth.userType || "").toUpperCase())) {
        return NextResponse.json({ error: "Only ADMIN or SUPER_ADMIN can publish course pages" }, { status: 403 });
      }
    } else if (!EDITOR_APPROVAL_STATES.includes(requestedApproval as any)) {
      return NextResponse.json({ error: "Unsupported approvalStatus" }, { status: 400 });
    }
    approvalStatus = requestedApproval as string;
  }

  if (Object.keys(data).length === 0 && !approvalRequested && verificationStatus === existing.verificationStatus) {
    return NextResponse.json({ course: existing, message: "No changes." });
  }

  const sourceUrl = (data.sourceUrl !== undefined ? data.sourceUrl : existing.sourceUrl) as string | null;
  if (approvalStatus === "PUBLISHED" && (verificationStatus !== "VERIFIED" || !isAcceptableSourceUrl(sourceUrl))) {
    if (!approvalRequested) {
      // An edit to a live page that leaves it unverified takes it out of
      // publication for review instead of keeping unverified content live.
      approvalStatus = "PENDING_REVIEW";
    } else {
      return NextResponse.json(
        { error: "Only VERIFIED course pages with an https official source URL can be published", verificationStatus },
        { status: 409 },
      );
    }
  }

  if (verificationStatus !== existing.verificationStatus) data.verificationStatus = verificationStatus;
  if (approvalStatus !== existing.approvalStatus) data.approvalStatus = approvalStatus;

  // Optimistic concurrency: only apply if the record has not changed since it was read.
  const result = await db.coursePage.updateMany({ where: { id, updatedAt: existing.updatedAt }, data: data as any });
  if (result.count !== 1) {
    return NextResponse.json({ error: "Course changed since it was loaded. Reload and try again." }, { status: 409 });
  }
  const course = await db.coursePage.findUnique({ where: { id } });
  await db.auditLog.create({
    data: {
      action: "PROFILE_UPDATE",
      resource: "CoursePage",
      resourceId: id,
      actorRole: auth.userType || "",
      userId: auditActor(auth).userId,
      details: JSON.stringify({ fields: Object.keys(data), factsChanged, actor: auditActor(auth).actor }),
      beforeValue: JSON.stringify({ verificationStatus: existing.verificationStatus, approvalStatus: existing.approvalStatus }),
      afterValue: JSON.stringify({ verificationStatus, approvalStatus }),
    },
  });
  return NextResponse.json({
    course,
    message: factsChanged && existing.verificationStatus === "VERIFIED"
      ? "Course updated. Verified facts changed, so it now needs review."
      : "Course updated successfully.",
  });
}

// Delete course (ADMIN/SUPER_ADMIN only; marketing roles cannot delete).
async function deleteAdminCourse(req: Request, auth: AuthContext) {
  const body = await readJsonObject(req);
  const id = body?.id;
  if (typeof id !== "string" || !id || id.length > 191) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const existing = await db.coursePage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  await db.coursePage.delete({ where: { id } });
  const { userId, actor } = auditActor(auth);
  await db.auditLog.create({
    data: {
      action: "DATA_IMPORT",
      resource: "CoursePage",
      resourceId: id,
      userId,
      actorRole: auth.userType || "",
      details: JSON.stringify({ deleted: true, actor }),
      beforeValue: JSON.stringify({ slug: existing.slug, name: existing.name, verificationStatus: existing.verificationStatus, approvalStatus: existing.approvalStatus, sourceUrl: existing.sourceUrl }),
    },
  });
  return NextResponse.json({ message: "Course deleted successfully." });
}

async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const parsed = await req.json();
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function rejectControlFields(body: Record<string, unknown>, extra: string[]): NextResponse | null {
  const forbidden = [...extra, "createdAt", "updatedAt", "university", "universityId"];
  const present = forbidden.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
  if (present.length) {
    return NextResponse.json({ error: `Control fields cannot be set from a request body: ${present.join(", ")}` }, { status: 400 });
  }
  return null;
}

const ADMIN_COURSE_ACCESS = { requireUserTypes: ["ADMIN", "SUPER_ADMIN", "MARKETING_MANAGER"] };
export const GET = withAuth(listAdminCourses, ADMIN_COURSE_ACCESS);
export const POST = withAuth(createAdminCourse, ADMIN_COURSE_ACCESS);
export const PATCH = withAuth(updateAdminCourse, ADMIN_COURSE_ACCESS);
export const DELETE = withAuth(deleteAdminCourse, { requireUserTypes: ["ADMIN", "SUPER_ADMIN"] });
