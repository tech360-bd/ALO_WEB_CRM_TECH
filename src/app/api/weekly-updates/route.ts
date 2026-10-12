import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { createWeeklyUpdateCheck } from '@/lib/university-course/unified-service';

const statuses = ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'EDITED', 'MERGED', 'PUBLISHED', 'all'] as const;
const targets = ['university', 'course', 'scholarship', 'country'] as const;
const querySchema = z.object({
  status: z.enum(statuses).default('PENDING_REVIEW'), targetType: z.enum(targets).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).default(50),
});
const text = () => z.string().trim().min(1).max(191);
const proposalSchema = z.object({
  targetType: z.enum(targets), targetId: text(), targetName: text(),
  fieldName: text().regex(/^[A-Za-z][A-Za-z0-9_]*$/).refine(value => !['id', 'status', 'verificationStatus', 'publicationStatus', 'lastVerifiedAt', 'createdBy', 'updatedBy'].includes(value), 'Control fields cannot be proposed here'),
  // Keep the legacy mirrored fields within their MySQL column capacity too.
  oldValue: z.string().max(191).default(''), newValue: z.string().min(1).max(191),
  sourceUrl: z.url().max(191).refine(value => { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; }, 'Use an HTTPS source URL without credentials'),
  evidence: z.string().trim().min(1).max(10000),
  aiConfidence: z.number().finite().min(0).max(1).default(0),
}).strict();

async function authorize(req: NextRequest, mutation = false) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  // Queues have no User/PortalUser FK. Both explicitly identified administrator
  // domains can review them, without treating their IDs as interchangeable.
  if (!auth.userId || !auth.actorUserId || !['user', 'portal'].includes(auth.identityDomain || '') || !['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase())) {
    return NextResponse.json({ error: 'Catalogue administrator access required' }, { status: 403 });
  }
  if (mutation && !mutationOriginAllowed(req, auth)) return NextResponse.json({ error: 'Same-origin request required' }, { status: 403 });
  return auth;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (auth instanceof NextResponse) return auth;
    const parsed = querySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid update filters' }, { status: 400 });
    const { status, targetType, limit } = parsed.data;
    const where = { ...(status === 'all' ? {} : { status }), ...(targetType ? { targetType } : {}) };
    const legacyWhere = { ...(status === 'all' ? {} : { status: status === 'PENDING_REVIEW' ? 'pending_approval' : status.toLowerCase() }), ...(targetType ? { entityType: targetType } : {}) };
    const [weeklyUpdates, universityUpdates] = await Promise.all([
      db.weeklyUpdateRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
      db.universityUpdateRequest.findMany({ where: legacyWhere, orderBy: { createdAt: 'desc' }, take: limit }),
    ]);
    return NextResponse.json({ success: true, weeklyUpdates, universityUpdates,
      total: weeklyUpdates.length + universityUpdates.length,
      message: 'Review proposals only. Counts describe these returned queues, which may overlap; source links and confidence are not proof of verification. No changes are automatically published.',
    });
  } catch (error) {
    console.error('[weekly-updates.list]', error);
    return NextResponse.json({ error: 'Failed to list weekly updates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, true);
    if (auth instanceof NextResponse) return auth;
    const parsed = proposalSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Valid target, field, value, HTTPS source URL and evidence are required' }, { status: 400 });
    const p = parsed.data;
    const proposal = await createWeeklyUpdateCheck(p.targetType, p.targetId, p.targetName, p.fieldName, p.oldValue, p.newValue, p.sourceUrl, p.evidence, p.aiConfidence, auth);
    return NextResponse.json({ success: true, updateRequest: proposal, message: 'Proposal pending human review; nothing verified or published.' }, { status: 201 });
  } catch (error) {
    console.error('[weekly-updates.create]', error);
    return NextResponse.json({ error: 'Failed to create update request' }, { status: 500 });
  }
}
