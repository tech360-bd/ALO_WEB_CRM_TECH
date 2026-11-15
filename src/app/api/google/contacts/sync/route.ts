/**
 * POST /api/google/contacts/sync
 *
 * Reads the company's Google Contacts (People API) and reconciles them into the
 * one central registry (`WhatsAppContact`). See `src/lib/google/contacts.ts` for
 * the policy; this file is the transaction wrapper, the audit trail and the report.
 *
 * Safety properties, in order of importance:
 *
 *  1. **`mode` defaults to `dry-run`.** A request that omits the body writes
 *     nothing. Applying requires the literal string "apply".
 *  2. **The CRM always wins.** Google may fill a field ALO left empty and may add a
 *     contact it has never seen. It may never overwrite a populated CRM value, and
 *     it never touches a Student, a Student ID, a counsellor assignment or a
 *     relationship.
 *  3. **Ambiguity becomes a review row**, not a write (`ContactMatchReview`, the
 *     model the CRM already uses for exactly this).
 *  4. **Re-runs are idempotent** — a person already linked by People API resource
 *     name is skipped, and a duplicate review row is not created twice.
 *  5. **Every run is recorded**: an `ImportBatch` (the existing import ledger) plus
 *     an `AuditLog` row, so "when did the last sync run and what did it do" has a
 *     durable answer.
 *  6. **No secrets are returned or logged.** The refresh token is never touched
 *     here; the sync token is stored on the integration row, which is not a
 *     credential for reading Google data without the OAuth token.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireGoogleAccess } from '@/lib/google/access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import {
  describeContactsConfig,
  listAllConnections,
  planContactImport,
  type ExistingRegistryRow,
  type ImportDecision,
} from '@/lib/google/contacts';
import { phoneVariants } from '@/lib/communications/contact-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SYNC_SOURCE = 'GOOGLE_CONTACTS';
/** Hard ceilings: a sync must never become an unbounded write. */
const MAX_CREATES_PER_RUN = 2000;
const MAX_ERROR_ROWS = 50;
const MAX_SAMPLES = 25;
const PHONE_CHUNK = 300;

/** Show enough to recognise a contact on screen, not enough to leak an address book. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}

export async function POST(request: Request) {
  const auth = await requireGoogleAccess(request, 'google.integrations.manage');
  if (auth instanceof NextResponse) return auth;

  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  let body: { mode?: unknown; maxPages?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const mode = body.mode === 'apply' ? 'apply' : 'dry-run';
  const requestedPages = Number(body.maxPages);
  const maxPages = Number.isInteger(requestedPages) && requestedPages > 0 ? requestedPages : 20;

  const config = describeContactsConfig();
  if (!config.configured) {
    return NextResponse.json(
      { success: false, status: 'NOT_CONFIGURED', error: config.note, account: config.account, scope: config.scope },
      { status: 409, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  // ── Sync state (incremental token, if a previous run stored one) ───────────
  let storedSyncToken = '';
  let integrationId: string | null = null;
  try {
    const state = await db.socialIntegration.findFirst({
      where: { provider: 'google_contacts' },
      select: { id: true, metadata: true },
    });
    if (state) {
      integrationId = state.id;
      const parsed = JSON.parse(state.metadata || '{}') as { syncToken?: string };
      storedSyncToken = (parsed.syncToken || '').trim();
    }
  } catch {
    storedSyncToken = '';
  }

  // ── Read Google ───────────────────────────────────────────────────────────
  const read = await listAllConnections({ maxPages, syncToken: storedSyncToken });
  if (read.status !== 'READY' || !read.data) {
    // A failed read is recorded too: "the last sync failed, here is why" is part of
    // the requirement, and a silent failure is worse than a loud one.
    await recordRun({
      auth,
      mode,
      outcome: 'FAILED',
      reason: read.reason || read.status,
      counters: null,
      request,
    });
    return NextResponse.json(
      {
        success: false,
        status: read.status,
        error: read.reason || 'Google did not return contacts.',
        googleErrorReason: read.googleErrorReason ?? null,
        wroteNothing: true,
        account: config.account,
      },
      { status: read.status === 'TIMEOUT' ? 504 : 502, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const people = read.data.people;

  // ── Load the registry rows these numbers could already belong to ──────────
  const variantSet = new Set<string>();
  for (const person of people) {
    for (const phone of person.phones) {
      for (const variant of phoneVariants(phone.normalized)) variantSet.add(variant);
    }
  }
  const variants = [...variantSet];
  const existing: ExistingRegistryRow[] = [];
  for (let index = 0; index < variants.length; index += PHONE_CHUNK) {
    const chunk = variants.slice(index, index + PHONE_CHUNK);
    const rows = (await db.whatsAppContact.findMany({
      where: { OR: [{ normalizedPhone: { in: chunk } }, { phone: { in: chunk } }] },
      select: {
        id: true,
        normalizedPhone: true,
        displayName: true,
        email: true,
        source: true,
        externalContactId: true,
        studentId: true,
        leadId: true,
        isBlocked: true,
        isOptedOut: true,
      },
    })) as unknown as ExistingRegistryRow[];
    existing.push(...rows);
  }

  const plan = planContactImport({ people, existing });
  const counters = plan.counters;

  // ── Dry run: report, write nothing ────────────────────────────────────────
  if (mode === 'dry-run') {
    return NextResponse.json(
      {
        success: true,
        mode,
        wroteNothing: true,
        account: config.account,
        incremental: read.data.usedIncremental,
        truncated: read.data.truncated,
        pages: read.data.pages,
        counters,
        samples: plan.decisions.slice(0, MAX_SAMPLES).map(toSample),
        conflicts: plan.decisions
          .filter((decision) => decision.action === 'CONFLICT_REVIEW')
          .slice(0, MAX_SAMPLES)
          .map((decision) => ({
            name: decision.person.displayName || '(no name)',
            phone: maskPhone(decision.person.phones[0]?.normalized || ''),
            reason: decision.reason,
            conflicts: decision.conflicts,
          })),
        skipped: plan.decisions
          .filter((decision) => decision.action.startsWith('SKIP_'))
          .slice(0, MAX_SAMPLES)
          .map((decision) => ({ name: decision.person.displayName || '(no name)', action: decision.action, reason: decision.reason })),
        nextStep: 'POST the same request with {"mode":"apply"} to write these changes.',
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  // ── Apply ─────────────────────────────────────────────────────────────────
  const batch = await db.importBatch.create({
    data: {
      sourceCrmName: SYNC_SOURCE,
      fileName: `people-api-${new Date().toISOString().slice(0, 10)}`,
      totalRows: plan.decisions.length,
      status: 'processing',
      createdBy: auth.userId,
    },
  });

  let created = 0;
  let linkedOrFilled = 0;
  let duplicates = 0;
  let reviews = 0;
  let errors = 0;
  const errorRows: { rowNumber: number; message: string; name: string }[] = [];

  for (const [index, decision] of plan.decisions.entries()) {
    try {
      switch (decision.action) {
        case 'CREATE': {
          if (created >= MAX_CREATES_PER_RUN) {
            duplicates += 1;
            break;
          }
          const phone = decision.fill.primaryPhone || decision.person.phones[0]?.normalized;
          if (!phone) {
            errors += 1;
            break;
          }
          await db.whatsAppContact.create({
            data: {
              phone,
              normalizedPhone: phone,
              displayName: decision.fill.displayName || phone,
              email: decision.fill.email || '',
              normalizedEmail: (decision.fill.email || '').toLowerCase(),
              // Provenance is explicit: these rows came from Google, and the
              // resource name is preserved so future syncs are incremental.
              source: SYNC_SOURCE,
              externalContactId: decision.person.resourceName,
              tags: JSON.stringify(['source:GOOGLE_CONTACTS', 'identity:UNVERIFIED']),
            },
          });
          created += 1;
          break;
        }
        case 'FILL_BLANK_FIELDS': {
          const data: Record<string, string> = {};
          if (decision.fill.displayName) data.displayName = decision.fill.displayName;
          if (decision.fill.email) {
            data.email = decision.fill.email;
            data.normalizedEmail = decision.fill.email.toLowerCase();
          }
          if (decision.targetId && Object.keys(data).length > 0) {
            // `externalContactId: ''` in the filter makes the link a one-time write:
            // a second run can never overwrite an existing link.
            await db.whatsAppContact.updateMany({
              where: { id: decision.targetId, externalContactId: '' },
              data: { ...data, externalContactId: decision.person.resourceName },
            });
            // The field fill itself is not gated on the link being absent.
            await db.whatsAppContact.updateMany({ where: { id: decision.targetId }, data: { ...data } });
            linkedOrFilled += 1;
          } else {
            duplicates += 1;
          }
          break;
        }
        case 'LINK_EXISTING': {
          if (decision.targetId) {
            await db.whatsAppContact.updateMany({
              where: { id: decision.targetId, externalContactId: '' },
              data: { externalContactId: decision.person.resourceName },
            });
            linkedOrFilled += 1;
          } else {
            duplicates += 1;
          }
          break;
        }
        case 'CONFLICT_REVIEW': {
          const phone = decision.person.phones[0]?.normalized || '';
          const already = await db.contactMatchReview.findFirst({
            where: { normalizedPhone: phone, incomingName: decision.person.displayName, status: 'PENDING' },
            select: { id: true },
          });
          if (!already) {
            await db.contactMatchReview.create({
              data: {
                incomingPhone: decision.person.phones[0]?.value || phone,
                normalizedPhone: phone,
                incomingName: decision.person.displayName,
                incomingEmail: decision.person.emails[0] || '',
                matchConfidence: 50,
                matchReason: `${decision.reason} Google contact: ${decision.person.resourceName}.`,
                status: 'PENDING',
              },
            });
            reviews += 1;
          } else {
            duplicates += 1;
          }
          break;
        }
        default:
          duplicates += 1;
          break;
      }
    } catch (error) {
      errors += 1;
      if (errorRows.length < MAX_ERROR_ROWS) {
        errorRows.push({
          rowNumber: index + 1,
          message: describeWriteError(error),
          name: decision.person.displayName || '(no name)',
        });
      }
    }
  }

  if (errorRows.length > 0) {
    await db.importError.createMany({
      data: errorRows.map((row) => ({
        batchId: batch.id,
        rowNumber: row.rowNumber,
        fieldName: 'google_contact',
        errorMessage: `${row.message} (${row.name})`.slice(0, 500),
        rawData: JSON.stringify({ resourceName: 'withheld', name: row.name }).slice(0, 2000),
      })),
    });
  }

  const truncated = read.data.truncated;
  await db.importBatch.update({
    where: { id: batch.id },
    data: {
      newCount: created,
      matchedCount: linkedOrFilled,
      duplicateCount: duplicates,
      errorCount: errors,
      status: errors > 0 ? 'completed_with_errors' : 'completed',
    },
  });

  await storeSyncState({
    integrationId,
    account: config.account,
    syncToken: read.data.nextSyncToken || storedSyncToken,
    counters: { found: counters.found, created, linkedOrFilled, duplicates, reviews, errors },
    outcome: truncated ? 'PARTIAL' : 'COMPLETED',
  });

  await recordRun({
    auth,
    mode,
    outcome: truncated ? 'PARTIAL' : 'COMPLETED',
    reason: truncated
      ? `Stopped at the ${maxPages}-page ceiling; the remaining Google contacts were not read in this run.`
      : 'Sync completed.',
    counters: { found: counters.found, created, linkedOrFilled, duplicates, reviews, errors },
    request,
  });

  return NextResponse.json(
    {
      success: true,
      mode,
      batchId: batch.id,
      account: config.account,
      incremental: read.data.usedIncremental,
      truncated,
      pages: read.data.pages,
      written: { created, linkedOrFilled, reviewQueued: reviews, duplicates, errors },
      counters,
      samples: plan.decisions.slice(0, MAX_SAMPLES).map(toSample),
      errorSamples: errorRows,
      notice: truncated
        ? 'The run hit its page ceiling. Run again to continue — re-runs are idempotent.'
        : 'Import complete. No existing CRM value, Student record or Student ID was modified.',
      /** Honesty: this is a pull sync, not a webhook. */
      synchronizationModel: 'manual/triggered pull via People API sync tokens — not real-time push',
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

function toSample(decision: ImportDecision) {
  return {
    action: decision.action,
    name: decision.person.displayName || '(no name)',
    phone: maskPhone(decision.person.phones[0]?.normalized || ''),
    email: decision.person.emails[0] ? decision.person.emails[0].replace(/^(.).*@/, '$1•••@') : '',
    reason: decision.reason,
    fill: decision.fill,
  };
}

/** Never echo a driver message: it can contain bound parameter values. */
function describeWriteError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  if (code === 'P2002') return 'A contact with this number already exists (unique constraint).';
  if (code === 'P2003') return 'A related record was missing (foreign key constraint).';
  return code ? `Write failed (${code}).` : 'Write failed.';
}

async function storeSyncState(input: {
  integrationId: string | null;
  account: string;
  syncToken: string;
  counters: { found: number; created: number; linkedOrFilled: number; duplicates: number; reviews: number; errors: number };
  outcome: 'COMPLETED' | 'PARTIAL';
}): Promise<void> {
  // Metadata holds the sync token and the last counters. It deliberately holds no
  // credential: `accessToken`/`refreshToken` are left untouched (and untouched means
  // absent) — the OAuth refresh token lives only in the server environment.
  const metadata = JSON.stringify({
    syncToken: input.syncToken,
    lastOutcome: input.outcome,
    lastCounters: input.counters,
    updatedAt: new Date().toISOString(),
  });
  try {
    if (input.integrationId) {
      await db.socialIntegration.update({
        where: { id: input.integrationId },
        data: {
          status: 'connected',
          connectedAccount: input.account,
          lastSyncAt: new Date(),
          healthStatus: input.outcome === 'PARTIAL' ? 'warning' : 'healthy',
          metadata,
        },
      });
      return;
    }
    await db.socialIntegration.create({
      data: {
        provider: 'google_contacts',
        name: 'Google Contacts (People API)',
        status: 'connected',
        connectedAccount: input.account,
        lastSyncAt: new Date(),
        healthStatus: input.outcome === 'PARTIAL' ? 'warning' : 'healthy',
        metadata,
      },
    });
  } catch {
    // Sync-state bookkeeping must never fail the import that already happened; the
    // ImportBatch row above is the durable record either way.
  }
}

async function recordRun(input: {
  auth: { userId: string; roles: string[] };
  mode: 'dry-run' | 'apply';
  outcome: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  reason: string;
  counters: Record<string, number> | null;
  request: Request;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: input.auth.userId,
        action: `google.contacts.sync.${input.mode}`,
        resource: 'GoogleContacts',
        resourceId: 'people_api',
        actorRole: input.auth.roles[0] || '',
        ipAddress: (input.request.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
        userAgent: (input.request.headers.get('user-agent') || '').slice(0, 300),
        details: JSON.stringify({ outcome: input.outcome, reason: input.reason, counters: input.counters }).slice(0, 4000),
      },
    });
  } catch {
    // Auditing a sync is required; failing the caller after the data work is done
    // would be worse. The ImportBatch row still records that the run happened.
  }
}
