/**
 * PROPOSED FILE — src/app/api/admin/courses/[id]/limited-publication/route.ts
 *
 * Super-Admin-only control surface for the limited-information publication
 * pathway. Nothing here changes `verificationStatus`; approval is a separate row.
 *
 * Ordering rule (same lesson as section C): authorisation is decided before the
 * body is parsed, so an unauthorised caller cannot distinguish a malformed
 * request from a well-formed one, nor probe which course ids exist.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { isSameOrigin, requireSuperAdmin } from '@/lib/super-admin/access';
import {
  evaluateLimitedPublication,
  LIMITED_PUBLICATION_STATE,
  type LimitedPublicationEvidence,
} from '@/lib/partial-publication/limited-publication-policy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ACTIONS = ['approve', 'revoke', 'request'] as const;

function parseAllEvidence(courseSlug: string, universitySlug: string) {
  return db.crmOfficialEvidence.findMany({
    where: { entityType: 'COURSE', courseSlug, universitySlug, verificationStatus: 'VERIFIED' },
    select: {
      evidenceKey: true,
      sourceUrl: true,
      entityType: true,
      courseSlug: true,
      universitySlug: true,
      verificationStatus: true,
      contentHash: true,
      fieldScope: true,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (req: Request, auth: AuthContext) => {
    // 1. Authorisation. A real, non-acting Super Admin — never an Acting-As session.
    const guard = requireSuperAdmin(auth);
    if (!guard.ok) return guard.response;
    if (!isSameOrigin(req)) {
      return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
    }

    // 2. Input shape. Only now can the caller learn anything about validity.
    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const action = String(body.action || '');
    if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
      return NextResponse.json({ success: false, error: `action must be one of ${ACTIONS.join(', ')}.` }, { status: 400 });
    }
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
    if (!reason) {
      return NextResponse.json({ success: false, error: 'A reason is required for the audit trail.' }, { status: 400 });
    }

    const { id } = await params;
    const course = await db.crmCourse.findFirst({
      where: { OR: [{ id }, { courseId: id }, { slug: id }] },
      select: {
        id: true, courseId: true, slug: true, universityId: true, courseTitle: true,
        studyLevel: true, studyMode: true, campus: true, academicYear: true, country: true,
        verificationStatus: true, publicationStatus: true, durationMonths: true,
        tuitionFee: true, deadline: true,
        university: { select: { name: true, slug: true, universityId: true } },
        limitedPublication: true,
      },
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const universitySlug = course.university?.slug || course.university?.universityId || '';
    const evidence = (await parseAllEvidence(course.slug, universitySlug)) as LimitedPublicationEvidence[];

    const policyCourse = {
      id: course.id,
      courseId: course.courseId,
      slug: course.slug,
      universityId: course.universityId,
      universitySlug,
      universityName: course.university?.name || '',
      courseTitle: course.courseTitle,
      studyLevel: course.studyLevel,
      studyMode: course.studyMode,
      campus: course.campus,
      academicYear: course.academicYear,
      country: course.country,
      verificationStatus: course.verificationStatus,
      publicationStatus: course.publicationStatus,
      durationMonths: course.durationMonths,
      tuitionFee: course.tuitionFee,
      deadline: course.deadline,
    };

    if (action === 'revoke') {
      const existing = course.limitedPublication;
      if (!existing) {
        return NextResponse.json({ success: false, error: 'No limited-publication record to revoke.' }, { status: 404 });
      }
      await db.$transaction([
        db.crmCourseLimitedPublication.update({
          where: { id: existing.id },
          data: {
            state: LIMITED_PUBLICATION_STATE.REVOKED,
            revokedByUserId: auth.userId,
            revokedAt: new Date(),
            reason,
          },
        }),
        db.crmAuditLog.create({
          data: {
            actorUserId: auth.userId,
            actorRole: auth.roles.join(','),
            action: 'COURSE_LIMITED_PUBLICATION_REVOKED',
            beforeData: JSON.stringify({ state: existing.state }),
            afterData: JSON.stringify({ state: LIMITED_PUBLICATION_STATE.REVOKED, reason }),
          },
        }),
      ]);
      return NextResponse.json({ success: true, data: { state: LIMITED_PUBLICATION_STATE.REVOKED } });
    }

    // 3. Pre-flight: build the approval this Super Admin is asking for, then let
    //    the policy decide. Deny list, verification status, evidence quality and
    //    snapshot consistency are all evaluated before anything is written.
    const evidenceSnapshotKeys = [...new Set(evidence.map((row) => row.evidenceKey))].sort();
    const candidateApproval = {
      id: course.limitedPublication?.id || 'preflight',
      courseId: course.id,
      state: action === 'approve' ? LIMITED_PUBLICATION_STATE.APPROVED : LIMITED_PUBLICATION_STATE.PENDING_APPROVAL,
      approvedByUserId: auth.userId,
      approvedByRoles: auth.roles,
      approvedAt: action === 'approve' ? new Date().toISOString() : '',
      revokedAt: null,
      evidenceSnapshotKeys,
    };

    const decision = evaluateLimitedPublication({
      course: policyCourse,
      evidence,
      approval: candidateApproval,
    });

    if (action === 'approve' && !decision.publishable) {
      return NextResponse.json(
        { success: false, error: 'Course is not eligible for limited publication.', blockers: decision.blockedBy },
        { status: 409 },
      );
    }

    const data = {
      state: candidateApproval.state,
      approvedByUserId: action === 'approve' ? auth.userId : '',
      approvedByRoles: JSON.stringify(action === 'approve' ? auth.roles : []),
      approvedAt: action === 'approve' ? new Date() : null,
      evidenceSnapshotKeys: JSON.stringify(evidenceSnapshotKeys),
      reason,
    };

    await db.$transaction([
      db.crmCourseLimitedPublication.upsert({
        where: { courseId: course.id },
        create: { courseId: course.id, ...data },
        update: data,
      }),
      db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId,
          actorRole: auth.roles.join(','),
          action: action === 'approve'
            ? 'COURSE_LIMITED_PUBLICATION_APPROVED'
            : 'COURSE_LIMITED_PUBLICATION_REQUESTED',
          beforeData: JSON.stringify({ state: course.limitedPublication?.state || null }),
          afterData: JSON.stringify({ state: candidateApproval.state, reason, evidenceSnapshotKeys }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        state: candidateApproval.state,
        fields: decision.publishable ? decision.fields : [],
        suppressed: decision.publishable ? decision.suppressed : [],
        blockers: decision.publishable ? [] : decision.blockedBy,
      },
    });
  })(request);
}

/** Read-only view of the current approval and the exact public payload. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(async (req: Request, auth: AuthContext) => {
    const guard = requireSuperAdmin(auth);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const course = await db.crmCourse.findFirst({
      where: { OR: [{ id }, { courseId: id }, { slug: id }] },
      select: { id: true, slug: true, limitedPublication: true },
    });
    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { courseId: course.id, approval: course.limitedPublication } });
  })(request);
}
