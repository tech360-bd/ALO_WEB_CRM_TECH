/**
 * GET /api/google/contacts/status
 *
 * "Is the Google Contacts integration actually working?" — answered from three
 * separate facts, never collapsed into one:
 *
 *   configured   — is a user OAuth credential present for the contacts account?
 *   reachable    — did Google answer a real People API call? (only with ?live=true,
 *                  because each probe costs quota)
 *   lastSync     — when did a sync last run, and what did it do?
 *
 * A deployment can be configured and still be unreachable (People API disabled,
 * scope not consented, wrong account). Reporting only "configured" is exactly the
 * self-deception the brief forbids, so both are returned separately.
 *
 * Never returns a secret: no token, no client secret, no full contact list.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireGoogleAccess } from '@/lib/google/access';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { describeContactsConfig, verifyContactsAccess } from '@/lib/google/contacts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYNC_SOURCE = 'GOOGLE_CONTACTS';

export async function GET(request: Request) {
  const auth = await requireGoogleAccess(request, 'google.integrations.view');
  if (auth instanceof NextResponse) return auth;

  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) return limited;

  const wantLive = new URL(request.url).searchParams.get('live') === 'true';
  const config = describeContactsConfig();

  // Configuration alone is cheap; the database reads are wrapped so a status page
  // still renders when the database is unreachable.
  let lastBatch: {
    id: string;
    totalRows: number;
    newCount: number;
    matchedCount: number;
    duplicateCount: number;
    errorCount: number;
    status: string;
    createdAt: Date;
  } | null = null;
  let importedContacts = 0;
  let pendingReviews = 0;
  let syncState: { lastSyncAt: string | null; syncTokenStored: boolean; healthStatus: string } = {
    lastSyncAt: null,
    syncTokenStored: false,
    healthStatus: 'not_configured',
  };
  let databaseError: string | null = null;

  try {
    const [batch, contacts, reviews, state] = await Promise.all([
      db.importBatch.findFirst({
        where: { sourceCrmName: SYNC_SOURCE },
        orderBy: { createdAt: 'desc' },
        select: { id: true, totalRows: true, newCount: true, matchedCount: true, duplicateCount: true, errorCount: true, status: true, createdAt: true },
      }),
      db.whatsAppContact.count({ where: { source: SYNC_SOURCE } }),
      db.contactMatchReview.count({ where: { status: 'PENDING' } }),
      db.socialIntegration.findFirst({
        where: { provider: 'google_contacts' },
        select: { lastSyncAt: true, metadata: true, healthStatus: true },
      }),
    ]);
    lastBatch = batch ?? null;
    importedContacts = contacts;
    pendingReviews = reviews;
    if (state) {
      let tokenStored = false;
      try {
        const parsed = JSON.parse(state.metadata || '{}') as { syncToken?: string };
        tokenStored = Boolean(parsed.syncToken);
      } catch {
        tokenStored = false;
      }
      syncState = {
        lastSyncAt: state.lastSyncAt ? state.lastSyncAt.toISOString() : null,
        syncTokenStored: tokenStored,
        healthStatus: state.healthStatus,
      };
    }
  } catch {
    databaseError = 'The database could not be read, so last-sync history is unavailable. Configuration below is still accurate.';
  }

  const live = wantLive && config.configured ? await verifyContactsAccess() : null;

  const verdict =
    !config.configured
      ? 'NOT_CONFIGURED'
      : live === null
        ? 'NOT_VERIFIED'
        : live.status === 'READY'
          ? 'PASS'
          : 'FAILED';

  return NextResponse.json(
    {
      success: true,
      service: 'google_contacts',
      account: config.account,
      scope: config.scope,
      configured: config.configured,
      authMode: config.authMode,
      note: config.note,
      /** PASS requires a real Google answer — configuration alone is NOT_VERIFIED. */
      verdict,
      liveVerified: live?.status === 'READY',
      live: live
        ? {
            status: live.status,
            reachable: live.data?.reachable ?? false,
            reason: live.reason ?? null,
            fetchedAt: live.fetchedAt ?? null,
          }
        : null,
      syncedAt: syncState.lastSyncAt,
      incrementalReady: syncState.syncTokenStored,
      importedContacts,
      pendingReviews,
      lastBatch: lastBatch
        ? {
            id: lastBatch.id,
            ranAt: lastBatch.createdAt.toISOString(),
            status: lastBatch.status,
            found: lastBatch.totalRows,
            created: lastBatch.newCount,
            linkedOrFilled: lastBatch.matchedCount,
            duplicates: lastBatch.duplicateCount,
            errors: lastBatch.errorCount,
          }
        : null,
      databaseError,
      /** Where to look next, stated so the answer is actionable. */
      nextSteps: config.configured
        ? [
            'POST /api/google/contacts/sync with {"mode":"dry-run"} to preview the import without writing anything.',
            'Then POST with {"mode":"apply"} to import. Re-runs are idempotent.',
          ]
        : [
            'Enable the People API in the ALO Google Cloud project.',
            `Grant ${config.scope} by consenting once as ${config.account}.`,
            'Store the refresh token as GOOGLE_CONTACTS_REFRESH_TOKEN (plus GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).',
          ],
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
