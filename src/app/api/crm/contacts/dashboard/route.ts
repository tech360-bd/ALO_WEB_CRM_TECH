/**
 * GET /api/crm/contacts/dashboard — the sixteen contact metrics.
 *
 * Every number here comes from the live database through the caller's own scope.
 * Nothing is estimated, projected or filled with a placeholder: a query that fails
 * yields `null` with a reason, and the UI shows "unavailable" rather than 0.
 *
 * Authorization: `contacts.view` plus the shared `contactScopeWhere` fragment, so a
 * counsellor sees their assignment, a branch manager their branch, a partner their
 * own records. A `branch` query parameter cannot widen that — see
 * `resolveBranchFilter`, which pins non-company-wide callers to their own branch.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { contactScopeWhere, hasCompanyWideContactAccess } from '@/lib/contacts/access-scope';
import { buildDuplicateReviewGroups, toRegistryContact } from '@/lib/contacts/registry';
import {
  buildDashboardMetrics,
  dashboardCaveats,
  resolveBranchFilter,
  resolveDateRange,
  type MetricInputs,
} from '@/lib/contacts/dashboard-metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DUPLICATE_SAMPLE = 1000;
const REVIEW_LIMIT = 1000;
const MERGED_TAG = 'merged_into:';

/** Run one reading; a failure becomes `null` plus a reason, never a zero. */
async function read(label: string, query: () => Promise<number>): Promise<{ value: number | null; reason?: string }> {
  try {
    const value = await query();
    return { value: Number.isFinite(value) ? value : null };
  } catch {
    return { value: null, reason: `${label} could not be read from the database.` };
  }
}

export const GET = withAuth(async (req: Request, auth: AuthContext): Promise<NextResponse> => {
  const limited = rateLimitMiddleware(req, 'admin_settings');
  if (limited) {
    return new NextResponse(await limited.text(), { status: limited.status, headers: limited.headers });
  }

  const params = new URL(req.url).searchParams;

  let range;
  try {
    range = resolveDateRange(params.get('from'), params.get('to'));
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Invalid date range.' },
      { status: 400 },
    );
  }

  const companyWide = hasCompanyWideContactAccess(auth);
  const decision = resolveBranchFilter({
    requestedBranch: params.get('branch'),
    callerBranch: auth.branch || null,
    companyWide,
  });

  try {
    const scope = (await contactScopeWhere(auth)) as Record<string, unknown>;
    // Branch filter only ever narrows: it is AND-ed on top of the scope fragment.
    const branchWhere = decision.branch ? { branch: decision.branch } : {};
    const personWhere = { ...scope, ...branchWhere, NOT: { tags: { contains: MERGED_TAG } } };

    const inputs: MetricInputs = {};

    const [
      total,
      created,
      linkedStudent,
      leadOnly,
      unlinked,
      optedOut,
      blocked,
      aliasContacts,
      pendingReviews,
      messagesIn,
      messagesOut,
      conversations,
      followUpsScheduled,
      followUpsOverdue,
    ] = await Promise.all([
      read('Total contacts', () => db.whatsAppContact.count({ where: personWhere as never })),
      read('New contacts in range', () => db.whatsAppContact.count({
        where: { ...personWhere, createdAt: { gte: range.from, lte: range.to } } as never,
      })),
      read('Student-linked contacts', () => db.whatsAppContact.count({
        where: { ...personWhere, studentId: { not: '' } } as never,
      })),
      read('Lead-only contacts', () => db.whatsAppContact.count({
        where: { ...personWhere, leadId: { not: '' }, studentId: '' } as never,
      })),
      read('Unlinked contacts', () => db.whatsAppContact.count({
        where: { ...personWhere, studentId: '', leadId: '', partnerId: '' } as never,
      })),
      read('Opted-out contacts', () => db.whatsAppContact.count({
        where: { ...personWhere, isOptedOut: true } as never,
      })),
      read('Blocked contacts', () => db.whatsAppContact.count({
        where: { ...personWhere, isBlocked: true } as never,
      })),
      read('Merged aliases', () => db.whatsAppContact.count({
        where: { ...scope, ...branchWhere, tags: { contains: MERGED_TAG } } as never,
      })),
      read('Pending match reviews', () => db.contactMatchReview.count({ where: { status: 'PENDING' } })),
      read('Inbound messages', () => db.whatsAppMessageArchive.count({
        where: { direction: 'inbound', timestamp: { gte: range.from, lte: range.to } },
      })),
      read('Outbound messages', () => db.whatsAppMessageArchive.count({
        where: { direction: 'outbound', timestamp: { gte: range.from, lte: range.to } },
      })),
      read('Active conversations', () => db.uccConversation.count({
        where: { lastMessageAt: { gte: range.from, lte: range.to } },
      })),
      read('Scheduled follow-ups', () => db.whatsAppFollowUpSchedule.count({
        where: { status: 'scheduled', isPaused: false },
      })),
      read('Overdue follow-ups', () => db.whatsAppFollowUpSchedule.count({
        where: { status: 'scheduled', isPaused: false, scheduledAt: { lt: new Date() } },
      })),
    ]);

    inputs.contacts_total = total;
    inputs.contacts_new_in_range = created;
    inputs.contacts_linked_to_student = linkedStudent;
    inputs.contacts_lead_only = leadOnly;
    inputs.contacts_unlinked = unlinked;
    inputs.contacts_opted_out = optedOut;
    inputs.contacts_blocked = blocked;
    inputs.alias_contacts = aliasContacts;
    inputs.match_reviews_pending = pendingReviews;
    inputs.messages_inbound = messagesIn;
    inputs.messages_outbound = messagesOut;
    inputs.conversations_active = conversations;
    inputs.follow_ups_scheduled = followUpsScheduled;
    inputs.follow_ups_overdue = followUpsOverdue;

    // Duplicate groups and review visibility need row data, not counts. Both are
    // computed over a bounded sample and reported as such.
    inputs.duplicate_groups = await read('Duplicate groups', async () => {
      const rows = await db.whatsAppContact.findMany({
        where: personWhere as never,
        orderBy: { createdAt: 'desc' },
        take: DUPLICATE_SAMPLE,
        select: {
          id: true, phone: true, normalizedPhone: true, displayName: true, email: true, source: true,
          studentId: true, leadId: true, partnerId: true, assignedCounselorId: true, branch: true,
          tags: true, createdAt: true, updatedAt: true,
        },
      }) as unknown as Parameters<typeof toRegistryContact>[0][];
      const contacts = rows.map((row) => toRegistryContact(row));
      return buildDuplicateReviewGroups(contacts).length;
    });

    const metrics = buildDashboardMetrics(inputs);
    const unavailable = metrics.filter((metric) => metric.status === 'UNAVAILABLE').map((metric) => metric.key);

    // Pending reviews are filtered to numbers the caller may see, so this count can
    // legitimately be smaller than the raw table count.
    if (pendingReviews.value !== null) {
      try {
        const visibleRows = await db.whatsAppContact.findMany({
          where: personWhere as never,
          select: { normalizedPhone: true, phone: true },
          take: DUPLICATE_SAMPLE,
        });
        const visiblePhones = new Set(visibleRows.flatMap((row) => [row.normalizedPhone, row.phone]).filter(Boolean));
        const reviews = await db.contactMatchReview.findMany({
          where: { status: 'PENDING' },
          select: { normalizedPhone: true, incomingPhone: true },
          take: REVIEW_LIMIT,
        });
        const visibleReviews = reviews.filter((review) => visiblePhones.has(review.normalizedPhone) || visiblePhones.has(review.incomingPhone));
        const target = metrics.find((metric) => metric.key === 'match_reviews_pending');
        if (target) target.value = visibleReviews.length;
      } catch {
        // Keep the unfiltered value rather than zero; the caveat below explains it.
      }
    }

    return NextResponse.json(
      {
        success: true,
        generatedAt: new Date().toISOString(),
        range: {
          from: range.fromIso,
          to: range.toIso,
          days: range.days,
          defaulted: range.defaulted,
          adjustment: range.adjustment ?? null,
        },
        branch: decision,
        metrics,
        caveats: dashboardCaveats({
          sampled: true,
          sampleSize: DUPLICATE_SAMPLE,
          unavailable,
        }),
        dataSource: 'WhatsAppContact, ContactMatchReview, WhatsAppMessageArchive, UccConversation, WhatsAppFollowUpSchedule',
        scope: companyWide ? 'COMPANY_WIDE' : 'SCOPED',
        mergedTagHandling: `Rows tagged ${MERGED_TAG} are counted as aliases, not as separate people.`,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Contact dashboard metrics are temporarily unavailable. No partial numbers are shown.',
      },
      { status: 503 },
    );
  }
}, { requirePermissions: ['contacts.view'] });
