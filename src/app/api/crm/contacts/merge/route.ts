/**
 * POST /api/crm/contacts/merge — confirmation-based contact merge.
 *
 * Three modes, and the default is the harmless one:
 *
 *   `preview`  — build and return the plan. Writes nothing.
 *   `execute`  — apply the plan the preview produced, in one transaction.
 *   `restore`  — reverse a merge from its audit snapshot.
 *
 * Safety properties, in order of importance:
 *
 *  1. **Nothing merges automatically.** This endpoint is only reachable by an
 *     explicit, authorised request; a shared phone number alone never triggers it.
 *  2. **Explicit grant.** Executing requires `contacts.merge_execute`, which is
 *     separate from `contacts.merge_review` (reviewing a match request is routine;
 *     rewriting the registry is not).
 *  3. **Scope.** Both rows must be inside the caller's branch/assignment scope, or
 *     the request is a 404 — the same rule every other contact read follows.
 *  4. **Preview must match execute.** The confirmation token is derived from the ids
 *     and both rows' `updatedAt`, so any concurrent edit makes the token stale and
 *     the execute is refused rather than applied to unseen data.
 *  5. **Transactional and optimistic.** Every write is guarded by the `updatedAt`
 *     the plan was built from; a row that changed mid-flight aborts the whole
 *     transaction.
 *  6. **Nothing is deleted.** The source rows become aliases of the destination
 *     (see `src/lib/contacts/merge.ts`), so numbers stay searchable, conversations
 *     keep their numbers, consents stay attached, and the merge is reversible.
 *  7. **Recoverable.** The full before/after snapshot is written to `PortalAuditLog`,
 *     which is what `restore` replays.
 *  8. **Student identity is untouchable.** Conflicting `studentId`/`leadId`/
 *     `partnerId` values are a hard refusal in the planner, not a warning here.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { contactScopeWhere } from '@/lib/contacts/access-scope';
import { contactHubPermissionDenied } from '@/lib/contacts/hub-access';
import {
  mergedInto,
  parseTags,
  planContactMerge,
  serializeTags,
  summarizeMergePlan,
  MAX_MERGE_SOURCES,
  type MergeContactRow,
} from '@/lib/contacts/merge';
import { phoneVariants } from '@/lib/communications/contact-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Body = {
  mode?: unknown;
  destinationId?: unknown;
  sourceIds?: unknown;
  reason?: unknown;
  confirmationToken?: unknown;
  auditId?: unknown;
};

const MIN_REASON_LENGTH = 10;

const ROW_SELECT = {
  id: true,
  phone: true,
  normalizedPhone: true,
  displayName: true,
  profileName: true,
  email: true,
  normalizedEmail: true,
  countryCode: true,
  externalContactId: true,
  studentId: true,
  leadId: true,
  partnerId: true,
  assignedCounselorId: true,
  branch: true,
  source: true,
  isBlocked: true,
  isOptedOut: true,
  optedOutAt: true,
  tags: true,
  updatedAt: true,
  createdAt: true,
} as const;

type RawRow = {
  id: string;
  phone: string;
  normalizedPhone: string;
  displayName: string;
  profileName: string;
  email: string;
  normalizedEmail: string;
  countryCode: string;
  externalContactId: string;
  studentId: string;
  leadId: string;
  partnerId: string;
  assignedCounselorId: string;
  branch: string;
  source: string;
  isBlocked: boolean;
  isOptedOut: boolean;
  optedOutAt: Date | null;
  tags: string;
  updatedAt: Date;
  createdAt: Date;
};

function toMergeRow(row: RawRow): MergeContactRow {
  return {
    id: row.id,
    phone: row.phone,
    normalizedPhone: row.normalizedPhone,
    displayName: row.displayName,
    profileName: row.profileName,
    email: row.email,
    normalizedEmail: row.normalizedEmail,
    countryCode: row.countryCode,
    externalContactId: row.externalContactId,
    studentId: row.studentId,
    leadId: row.leadId,
    partnerId: row.partnerId,
    assignedCounselorId: row.assignedCounselorId,
    branch: row.branch,
    source: row.source,
    isBlocked: row.isBlocked,
    isOptedOut: row.isOptedOut,
    optedOutAt: row.optedOutAt ? row.optedOutAt.toISOString() : null,
    tags: parseTags(row.tags),
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

/** What history hangs off each number, so nothing looks lost during a preview. */
async function describeAttachedHistory(rows: MergeContactRow[]) {
  const variantsByRow = rows.map((row) => ({ id: row.id, variants: phoneVariants(row.normalizedPhone) }));
  const allVariants = [...new Set(variantsByRow.flatMap((entry) => entry.variants))];
  const counts: Record<string, Record<string, number | null>> = {};

  for (const row of rows) {
    const variants = phoneVariants(row.normalizedPhone);
    const safe = async (query: () => Promise<number>): Promise<number | null> => {
      try {
        return await query();
      } catch {
        return null; // Table missing or unreadable: report unknown, never 0.
      }
    };
    counts[row.id] = {
      conversations: await safe(() => db.uccConversation.count({ where: { participantPhone: { in: variants } } })),
      messages: await safe(() => db.whatsAppMessageArchive.count({
        where: { OR: [{ senderPhone: { in: variants } }, { receiverPhone: { in: variants } }] },
      })),
      communicationMessages: await safe(() => db.communicationMessage.count({
        where: { OR: [{ senderContact: { in: variants } }, { recipientContact: { in: variants } }] },
      })),
      consents: await safe(() => db.communicationConsent.count({ where: { contactId: row.id } })),
      followUpSchedules: await safe(() => db.whatsAppFollowUpSchedule.count({ where: { contactId: row.id } })),
    };
  }

  return { counts, sharedNumberCount: allVariants.length };
}

export const POST = withAuth(async (req: Request, auth: AuthContext): Promise<NextResponse> => {
  const limited = rateLimitMiddleware(req, 'admin_settings');
  if (limited) {
    // `withAuth` requires a NextResponse; the limiter returns a plain Response.
    return new NextResponse(await limited.text(), { status: limited.status, headers: limited.headers });
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const mode = body?.mode === 'execute' ? 'execute' : body?.mode === 'restore' ? 'restore' : 'preview';

  // Preview is a read; execute and restore are mutations and are gated separately.
  if (mode === 'preview') {
    const denied = contactHubPermissionDenied(auth, 'contacts.merge_review', ['BRANCH_MANAGER']);
    if (denied) return denied;
  } else {
    const denied = contactHubPermissionDenied(auth, 'contacts.merge_execute', ['SUPER_ADMIN']);
    if (denied) return denied;
    if (!mutationOriginAllowed(req, auth)) {
      return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    }
  }

  if (mode === 'restore') return restoreMerge(auth, body);

  const destinationId = String(body?.destinationId || '').trim();
  const sourceIds = Array.isArray(body?.sourceIds)
    ? [...new Set(body.sourceIds.map((value) => String(value).trim()).filter(Boolean))].slice(0, MAX_MERGE_SOURCES + 1)
    : [];

  if (!destinationId || sourceIds.length === 0) {
    return NextResponse.json(
      { success: false, error: 'A destination contact and at least one source contact are required.' },
      { status: 400 },
    );
  }

  try {
    const scope = await contactScopeWhere(auth);
    const rows = (await db.whatsAppContact.findMany({
      where: { ...scope, id: { in: [destinationId, ...sourceIds] } } as never,
      select: ROW_SELECT,
    })) as unknown as RawRow[];

    const byId = new Map(rows.map((row) => [row.id, row]));
    if (!byId.has(destinationId)) {
      return NextResponse.json(
        { success: false, error: 'The destination contact is outside your authorized scope or does not exist.' },
        { status: 404 },
      );
    }
    const missing = sourceIds.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'One or more source contacts are outside your authorized scope or do not exist.',
          missing,
        },
        { status: 404 },
      );
    }

    const destination = toMergeRow(byId.get(destinationId) as RawRow);
    const sources = sourceIds.map((id) => toMergeRow(byId.get(id) as RawRow));
    const plan = planContactMerge({ destination, sources });

    if (mode === 'preview') {
      const history = await describeAttachedHistory([destination, ...sources]);
      return NextResponse.json(
        {
          success: true,
          mode,
          wroteNothing: true,
          plan,
          summary: summarizeMergePlan(plan),
          history,
          rows: { destination, sources },
          /** What the operator must do next; stated so the flow is unambiguous. */
          nextStep: plan.ok
            ? 'Review the plan, then POST again with mode "execute", the same ids, a reason of at least 10 characters and this confirmationToken.'
            : 'Resolve the blockers first; nothing can be merged while they remain.',
        },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    // `history` is only needed by the preview; executing skips those extra reads.

    // ── execute ────────────────────────────────────────────────────────────
    const reason = String(body?.reason || '').trim();
    if (reason.length < MIN_REASON_LENGTH) {
      return NextResponse.json(
        { success: false, error: `A written reason of at least ${MIN_REASON_LENGTH} characters is required to merge contacts.` },
        { status: 400 },
      );
    }
    const providedToken = String(body?.confirmationToken || '').trim();
    if (!plan.ok) {
      return NextResponse.json({ success: false, error: 'Merge refused by policy.', blockers: plan.blockers, plan }, { status: 409 });
    }
    if (!providedToken || providedToken !== plan.confirmationToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'This preview is stale — the contact data changed. Run the preview again before merging.',
          code: 'STALE_PREVIEW',
          confirmationToken: plan.confirmationToken,
        },
        { status: 409 },
      );
    }

    const result = await db.$transaction(async (tx) => {
      // Re-check state inside the transaction and apply with an optimistic guard.
      const freshRows = (await tx.whatsAppContact.findMany({
        where: { id: { in: [destinationId, ...sourceIds] } },
        select: ROW_SELECT,
      })) as unknown as RawRow[];
      if (freshRows.length !== 1 + sourceIds.length) {
        throw new MergeAbort('A contact disappeared before the merge could be applied.', 409);
      }
      const freshDestination = toMergeRow(freshRows.find((row) => row.id === destinationId) as RawRow);
      const freshSources = sourceIds.map((id) => toMergeRow(freshRows.find((row) => row.id === id) as RawRow));
      const freshPlan = planContactMerge({ destination: freshDestination, sources: freshSources });
      if (!freshPlan.ok) throw new MergeAbort(`Merge refused by policy: ${freshPlan.blockers[0]}`, 409);
      if (freshPlan.confirmationToken !== providedToken) {
        throw new MergeAbort('The contact data changed while the merge was being applied. Nothing was written.', 409);
      }

      const destinationGuard = await tx.whatsAppContact.updateMany({
        where: { id: destinationId, updatedAt: new Date(freshDestination.updatedAt) },
        data: {
          displayName: freshPlan.destinationUpdate.displayName,
          profileName: freshPlan.destinationUpdate.profileName,
          email: freshPlan.destinationUpdate.email,
          normalizedEmail: freshPlan.destinationUpdate.normalizedEmail,
          countryCode: freshPlan.destinationUpdate.countryCode,
          externalContactId: freshPlan.destinationUpdate.externalContactId,
          studentId: freshPlan.destinationUpdate.studentId,
          leadId: freshPlan.destinationUpdate.leadId,
          partnerId: freshPlan.destinationUpdate.partnerId,
          assignedCounselorId: freshPlan.destinationUpdate.assignedCounselorId,
          branch: freshPlan.destinationUpdate.branch,
          isOptedOut: freshPlan.destinationUpdate.isOptedOut,
          optedOutAt: freshPlan.destinationUpdate.optedOutAt ? new Date(freshPlan.destinationUpdate.optedOutAt) : null,
          isBlocked: freshPlan.destinationUpdate.isBlocked,
          tags: serializeTags(freshPlan.destinationUpdate.tags),
        },
      });
      if (destinationGuard.count !== 1) {
        throw new MergeAbort('The destination contact was modified by someone else. Nothing was written.', 409);
      }

      for (const [index, alias] of freshPlan.aliasUpdates.entries()) {
        const guard = await tx.whatsAppContact.updateMany({
          where: { id: alias.id, updatedAt: new Date(freshSources[index].updatedAt) },
          data: {
            studentId: alias.studentId,
            leadId: alias.leadId,
            partnerId: alias.partnerId,
            assignedCounselorId: alias.assignedCounselorId,
            branch: alias.branch,
            isOptedOut: alias.isOptedOut,
            optedOutAt: alias.optedOutAt ? new Date(alias.optedOutAt) : null,
            isBlocked: alias.isBlocked,
            tags: serializeTags(alias.tags),
          },
        });
        if (guard.count !== 1) {
          throw new MergeAbort('A source contact was modified by someone else. Nothing was written.', 409);
        }
      }

      const after = (await tx.whatsAppContact.findMany({
        where: { id: { in: [destinationId, ...sourceIds] } },
        select: { id: true, updatedAt: true },
      })) as unknown as { id: string; updatedAt: Date }[];

      const audit = await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_MERGED',
          entityType: 'WhatsAppContact',
          entityId: destinationId,
          ipAddress: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
          userAgent: (req.headers.get('user-agent') || '').slice(0, 300),
          metadata: JSON.stringify({
            version: 1,
            reason,
            confirmationToken: providedToken,
            policy: freshPlan.policy,
            before: { destination: freshDestination, sources: freshSources },
            after: {
              destination: freshPlan.destinationUpdate,
              aliases: freshPlan.aliasUpdates,
              updatedAt: Object.fromEntries(after.map((row) => [row.id, row.updatedAt.toISOString()])),
            },
            preserved: freshPlan.preserved,
          }),
        },
        select: { id: true },
      });

      // Queryable merge history (spec §10, §22): one row per pair, written in the
      // same transaction as the merge so rolled-back merges leave no phantom rows.
      for (const source of freshSources) {
        await tx.contactMergeHistory.create({
          data: {
            destinationContactId: destinationId,
            sourceContactId: source.id,
            destinationPhone: freshDestination.normalizedPhone || '',
            sourcePhone: source.normalizedPhone || source.phone || '',
            mergedById: auth.actorUserId || auth.userId,
            mergedByRole: (auth.roles || []).join(','),
            preservedGoogleAliases: JSON.stringify(freshPlan.preserved.googleAliases || []),
            mergeReason: reason || '',
            mergeAuditId: audit.id,
          },
        });
      }

      // One decision record per merged pair, so the review queue shows how the
      // duplicate was resolved instead of leaving it open forever.
      for (const source of freshSources) {
        await tx.contactMatchReview.create({
          data: {
            incomingPhone: source.phone,
            normalizedPhone: source.normalizedPhone,
            incomingName: source.displayName,
            incomingEmail: source.email,
            matchedStudentId: freshPlan.preserved.studentIdentity || null,
            matchedLeadId: freshPlan.preserved.leadIdentity || null,
            matchedPartnerId: freshPlan.preserved.partnerIdentity || null,
            matchConfidence: 100,
            matchReason: `Merged into ${freshDestination.normalizedPhone} (${destinationId}) by ${auth.userId}. Audit ${audit.id}.`,
            status: 'MERGED',
            decision: 'MERGED_INTO_DESTINATION',
            decidedBy: auth.userId,
            decidedAt: new Date(),
          },
        });
      }

      return { auditId: audit.id, aliasCount: freshPlan.aliasUpdates.length };
    });

    return NextResponse.json({
      success: true,
      mode,
      merged: true,
      destinationId,
      aliasedSourceIds: sourceIds,
      auditId: result.auditId,
      summary: summarizeMergePlan(plan),
      restored: false,
      note: 'Nothing was deleted. The source numbers remain searchable as aliases of the destination, and this merge can be reversed with mode "restore".',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof MergeAbort) {
      return NextResponse.json({ success: false, error: error.message, code: 'MERGE_ABORTED' }, { status: error.status });
    }
    return NextResponse.json(
      { success: false, error: 'The merge could not be completed. Nothing was written.' },
      { status: 503 },
    );
  }
}, { requirePermissions: ['contacts.view'] });

class MergeAbort extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Reverse a merge from its audit snapshot. */
async function restoreMerge(auth: AuthContext, body: Body | null): Promise<NextResponse> {
  const auditId = String(body?.auditId || '').trim();
  if (!auditId) {
    return NextResponse.json({ success: false, error: 'The merge audit id is required to restore.' }, { status: 400 });
  }

  try {
    const audit = (await db.portalAuditLog.findFirst({
      where: { id: auditId, action: 'CONTACT_MERGED' },
      select: { id: true, entityId: true, metadata: true, createdAt: true },
    })) as { id: string; entityId: string; metadata: string; createdAt: Date } | null;
    if (!audit) {
      return NextResponse.json({ success: false, error: 'No merge record with that id exists.' }, { status: 404 });
    }

    const snapshot = JSON.parse(audit.metadata || '{}') as {
      before?: { destination?: RawRow; sources?: RawRow[] };
      after?: { updatedAt?: Record<string, string> };
    };
    const beforeDestination = snapshot.before?.destination;
    const beforeSources = snapshot.before?.sources ?? [];
    const afterUpdatedAt = snapshot.after?.updatedAt ?? {};
    if (!beforeDestination || beforeSources.length === 0) {
      return NextResponse.json({ success: false, error: 'The merge record is incomplete and cannot be replayed.' }, { status: 409 });
    }

    // Scope: the caller must still be able to see every row the merge touched.
    const scope = await contactScopeWhere(auth);
    const ids = [beforeDestination.id, ...beforeSources.map((row) => row.id)];
    const visible = (await db.whatsAppContact.findMany({
      where: { ...scope, id: { in: ids } } as never,
      select: { id: true, updatedAt: true, tags: true },
    })) as unknown as { id: string; updatedAt: Date; tags: string }[];
    if (visible.length !== ids.length) {
      return NextResponse.json(
        { success: false, error: 'The merged contacts are outside your authorized scope, so the merge cannot be reversed.' },
        { status: 404 },
      );
    }

    // Refuse if anything changed since the merge: replaying over newer edits would
    // destroy work that the snapshot knows nothing about.
    for (const row of visible) {
      const expected = afterUpdatedAt[row.id];
      if (expected && row.updatedAt.toISOString() !== expected) {
        return NextResponse.json(
          {
            success: false,
            error: 'A contact has been edited since the merge, so it cannot be restored without overwriting that work. Review the record manually.',
            code: 'STATE_CHANGED',
          },
          { status: 409 },
        );
      }
      if (row.id !== beforeDestination.id && !mergedInto(parseTags(row.tags))) {
        return NextResponse.json(
          { success: false, error: 'The merge is no longer in place for one of these contacts.', code: 'NOT_MERGED' },
          { status: 409 },
        );
      }
    }

    await db.$transaction(async (tx) => {
      await tx.whatsAppContact.update({
        where: { id: beforeDestination.id },
        data: restoreData(beforeDestination),
      });
      for (const source of beforeSources) {
        await tx.whatsAppContact.update({ where: { id: source.id }, data: restoreData(source) });
      }
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_MERGE_REVERSED',
          entityType: 'WhatsAppContact',
          entityId: beforeDestination.id,
          metadata: JSON.stringify({ reversesAuditId: auditId, mergedAt: audit.createdAt.toISOString() }),
        },
      });
    });

    return NextResponse.json({
      success: true,
      mode: 'restore',
      restored: true,
      auditId,
      note: 'Both contacts were restored to their pre-merge field values. Conversations, consents and guardians were never moved, so no history needed undoing.',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'The merge could not be reversed. Nothing was changed.' }, { status: 503 });
  }
}

function restoreData(row: RawRow) {
  return {
    displayName: row.displayName,
    profileName: row.profileName,
    email: row.email,
    normalizedEmail: row.normalizedEmail,
    countryCode: row.countryCode,
    externalContactId: row.externalContactId,
    studentId: row.studentId,
    leadId: row.leadId,
    partnerId: row.partnerId,
    assignedCounselorId: row.assignedCounselorId,
    branch: row.branch,
    isOptedOut: row.isOptedOut,
    optedOutAt: row.optedOutAt ? new Date(row.optedOutAt) : null,
    isBlocked: row.isBlocked,
    tags: row.tags,
  };
}
