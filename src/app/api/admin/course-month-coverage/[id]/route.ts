import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';

export const dynamic = 'force-dynamic';

const Decision = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().trim().max(1000).default(''),
}).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requireMonitoringAdmin(request);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(request, guard.actor.auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id || id.length > 191) return NextResponse.json({ success: false, error: 'Invalid coverage record id.' }, { status: 400 });
  const parsed = Decision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid decision.' }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const current = await tx.courseMonthCoverage.findUnique({ where: { id }, include: { course: { select: { courseId: true, courseTitle: true, university: { select: { name: true, website: true, officialUrl: true } } } } } });
      if (!current) throw Object.assign(new Error('Coverage record not found.'), { status: 404 });
      if (current.approvalStatus !== 'PENDING') throw Object.assign(new Error(`Coverage record is already ${current.approvalStatus}.`), { status: 409 });

      if (parsed.data.action === 'APPROVE') {
        if (!['VERIFIED_AVAILABLE', 'VERIFIED_NOT_OFFERED', 'NOT_PUBLISHED'].includes(current.availabilityStatus)) {
          throw Object.assign(new Error('Only evidence-reviewed records in VERIFIED_AVAILABLE, VERIFIED_NOT_OFFERED or NOT_PUBLISHED status can be approved. Pending, unavailable and conflicting sources must remain unpublished.'), { status: 409 });
        }
        const urls = JSON.parse(current.sourceUrls || '[]');
        if (!Array.isArray(urls) || urls.length === 0 || urls.some((value) => {
          try { return new URL(value).protocol !== 'https:'; } catch { return true; }
        })) throw Object.assign(new Error('Approval requires at least one valid HTTPS source URL.'), { status: 409 });
        const officialHosts = [current.course.university.website, current.course.university.officialUrl].flatMap((value) => {
          try { return [new URL(value).hostname.toLowerCase()]; } catch { return []; }
        });
        if (!officialHosts.length || urls.some((value) => {
          const host = new URL(value).hostname.toLowerCase();
          return !officialHosts.some((officialHost) => host === officialHost || host.endsWith(`.${officialHost}`));
        })) throw Object.assign(new Error('Approval refused: evidence URLs must belong to the CRM university official website domain.'), { status: 409 });
        if (!current.lastVerifiedAt || current.confidence <= 0) throw Object.assign(new Error('Approval requires dated source verification and a non-zero confidence score.'), { status: 409 });
      }

      const nextStatus = parsed.data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      const now = new Date();
      const changed = await tx.courseMonthCoverage.updateMany({ where: { id, approvalStatus: 'PENDING' }, data: {
        approvalStatus: nextStatus,
        approvedBy: parsed.data.action === 'APPROVE' ? guard.actor.userId : null,
        approvedAt: parsed.data.action === 'APPROVE' ? now : null,
        rejectedBy: parsed.data.action === 'REJECT' ? guard.actor.userId : null,
        rejectedAt: parsed.data.action === 'REJECT' ? now : null,
        reviewNotes: parsed.data.notes || null,
      } });
      if (changed.count !== 1) throw Object.assign(new Error('This record was decided by another reviewer.'), { status: 409 });

      const versionNumber = await tx.courseMonthCoverageVersion.count({ where: { coverageId: id } });
      await tx.courseMonthCoverageVersion.create({ data: {
        coverageId: id,
        version: versionNumber + 1,
        action: parsed.data.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        snapshot: JSON.stringify({ record: current, decision: nextStatus, reviewedAt: now.toISOString(), reviewedBy: guard.actor.userId }),
        sourceHash: current.contentHash,
        actorId: guard.actor.userId,
        notes: parsed.data.notes || null,
      } });
      await tx.auditLog.create({ data: {
        userId: guard.actor.userId,
        action: parsed.data.action === 'APPROVE' ? 'COURSE_MONTH_COVERAGE_APPROVED' : 'COURSE_MONTH_COVERAGE_REJECTED',
        resource: 'CourseMonthCoverage',
        resourceId: id,
        actorRole: 'SUPER_ADMIN',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        userAgent: request.headers.get('user-agent') || '',
        details: JSON.stringify({ courseId: current.courseId, courseTitle: current.course.courseTitle, university: current.course.university.name, calendarMonth: current.calendarMonth, availabilityStatus: current.availabilityStatus, sourceUrls: current.sourceUrls, notes: parsed.data.notes || null }),
      } });

      return tx.courseMonthCoverage.findUnique({ where: { id } });
    }, { isolationLevel: 'Serializable' });

    return NextResponse.json({ success: true, record: result, published: parsed.data.action === 'APPROVE' });
  } catch (error) {
    const status = error && typeof error === 'object' && 'status' in error ? Number((error as { status: unknown }).status) : 500;
    if (status >= 400 && status < 500) return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Decision failed.' }, { status });
    throw error;
  }
}
