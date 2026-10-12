import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCatalogAdmin } from "@/lib/course-finder/catalog-admin-auth";
import { auditActor, isAcceptableSourceUrl } from "@/lib/course-finder/content-page-guards";

// Import Center — for importing courses/universities/scholarships from external sources
// Also handles the public content approval workflow (SUPER_ADMIN/ADMIN only).
// Approval and publication are NOT verification; see PATCH below.
// Uses the shared catalogue-admin guard: ADMIN/SUPER_ADMIN by verified
// userType only (a lowercase "admin" role claim on another user type no longer
// qualifies), and same-origin for mutations.
async function requireImportAdmin(req: NextRequest) {
  return requireCatalogAdmin(req, { level: "admin", mutation: false });
}

export async function GET(req: NextRequest) {
  const auth = await requireImportAdmin(req);
  if (auth instanceof NextResponse) return auth;
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

// Approve / reject / publish / verify a content item.
//
// Phase 1 (2026-10-12): approval, rejection and publication NEVER change
// verificationStatus. Previously every action (including "reject") wrote
// verificationStatus="VERIFIED". Now:
//   approve -> approvalStatus PENDING_REVIEW (verification unchanged)
//   reject  -> approvalStatus DRAFT          (verification unchanged)
//   publish -> approvalStatus PUBLISHED, only if the record is already
//              VERIFIED and carries an https official source URL
//   verify  -> verificationStatus VERIFIED + lastVerifiedAt, SUPER_ADMIN only
//              (not while impersonating), only with an https official source
//              URL on the record. It is an explicit evidence decision and
//              never changes approvalStatus.
const PATCH_ACTIONS = new Set(["approve", "reject", "publish", "verify"]);
const CONTROL_FIELDS = ["verificationStatus", "approvalStatus", "lastVerifiedAt", "status"];

export async function PATCH(req: NextRequest) {
  const auth = await requireCatalogAdmin(req, { level: "admin", mutation: true });
  if (auth instanceof NextResponse) return auth;
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "A JSON body is required" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A JSON object body is required" }, { status: 400 });
  }
  const { type, slug, action } = body; // type: country|university|course|exam
  const present = CONTROL_FIELDS.filter((f) => Object.prototype.hasOwnProperty.call(body, f));
  if (present.length) {
    return NextResponse.json({ error: `Control fields cannot be set directly: ${present.join(", ")}` }, { status: 400 });
  }
  if (typeof action !== "string" || !PATCH_ACTIONS.has(action)) {
    return NextResponse.json({ error: "action must be approve, reject, publish or verify" }, { status: 400 });
  }
  if (typeof slug !== "string" || !slug || slug.length > 200) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }
  const modelMap: Record<string, any> = { country: db.countryPage, university: db.universityPage, course: db.coursePage, exam: db.examPage };
  const model = typeof type === "string" && Object.prototype.hasOwnProperty.call(modelMap, type) ? modelMap[type] : null;
  if (!model) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  if (action === "verify") {
    const superAdmin = await requireCatalogAdmin(req, { level: "superAdmin", mutation: true });
    if (superAdmin instanceof NextResponse) return superAdmin;
  }

  const existing = await model.findUnique({ where: { slug } });
  if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  let data: Record<string, unknown>;
  if (action === "verify") {
    if (!isAcceptableSourceUrl(existing.sourceUrl)) {
      return NextResponse.json(
        { error: "Verification requires an https official source URL recorded on the item" },
        { status: 409 },
      );
    }
    data = { verificationStatus: "VERIFIED", lastVerifiedAt: new Date() };
  } else if (action === "publish") {
    if (existing.verificationStatus !== "VERIFIED" || !isAcceptableSourceUrl(existing.sourceUrl)) {
      return NextResponse.json(
        { error: "Only VERIFIED items with an https official source URL can be published", verificationStatus: existing.verificationStatus },
        { status: 409 },
      );
    }
    data = { approvalStatus: "PUBLISHED" };
  } else {
    data = { approvalStatus: action === "reject" ? "DRAFT" : "PENDING_REVIEW" };
  }

  // Guard against concurrent edits between the read above and this write.
  const guard: Record<string, unknown> = { slug, updatedAt: existing.updatedAt };
  if (action === "publish") guard.verificationStatus = "VERIFIED";
  const result = await model.updateMany({ where: guard, data });
  if (result.count !== 1) {
    return NextResponse.json({ error: "Item changed since it was loaded. Reload and try again." }, { status: 409 });
  }
  const updated = await model.findUnique({ where: { slug } });

  // Attribution comes from the authenticated session, never the request body.
  // AuditLog.userId is a User foreign key: portal identities go in details.
  const { userId, actor } = auditActor(auth);
  await db.auditLog.create({
    data: {
      userId,
      action: action === "verify" ? "PUBLIC_VERIFY" : "PUBLIC_PUBLISH",
      resource: type,
      resourceId: slug,
      actorRole: auth.userType || "",
      details: JSON.stringify({ action, ...data, actor }),
      beforeValue: JSON.stringify({ approvalStatus: existing.approvalStatus, verificationStatus: existing.verificationStatus }),
      afterValue: JSON.stringify({ approvalStatus: updated?.approvalStatus, verificationStatus: updated?.verificationStatus }),
    },
  });

  return NextResponse.json({ item: updated, message: `${type} ${action} recorded` });
}
