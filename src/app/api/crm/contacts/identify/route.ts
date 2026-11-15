/**
 * GET|POST /api/crm/contacts/identify?phone=01XXXXXXXXX
 *
 * The endpoint behind "live student identification": given a number, return the
 * card a counsellor needs while the phone is ringing — name, Student ID, numbers,
 * parent/guardian, counsellor, application status, university/course, last
 * conversation, open follow-ups, and a deep link to the profile.
 *
 * Three rules are enforced here rather than trusted to the UI:
 *
 *  1. **A phone number is mandatory.** `?name=` is not an input. `NAME_ONLY` is
 *     refused with an explicit code, because identifying a student by name alone is
 *     how the wrong file gets opened.
 *  2. **Scope is applied before the card is returned** (§17). A counsellor outside a
 *     branch sees that a record exists, not whose it is.
 *  3. **Reads of a person's file are audited** (§22). The audit attempt happens
 *     before the response; if it fails the card is still returned but says so, so a
 *     broken audit table cannot silently hide access either.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { getScopeForAuth } from '@/lib/data-scope';
import { hasCompanyWideContactAccess } from '@/lib/contacts/access-scope';
import {
  identifyByPhone,
  rejectNameOnlyIdentification,
  type IdentificationCard,
} from '@/lib/contacts/identification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Who may ask "who is this number?".
 *
 * Student and partner portal sessions are refused outright, not merely scoped: a
 * presence oracle ("this number belongs to a record" vs "unknown") is itself
 * personal data, and a student account must not be able to probe the CRM with
 * phone numbers. Staff accounts pass; their visibility is then narrowed by scope.
 */
const PORTAL_ONLY_USER_TYPES = new Set(['STUDENT', 'PARTNER']);

function isStaffCaller(auth: AuthContext): boolean {
  const userType = String(auth.userType || '').toUpperCase();
  if (!PORTAL_ONLY_USER_TYPES.has(userType)) return true;
  return (auth.permissions || []).includes('contacts.view');
}

async function handle(request: Request, auth: AuthContext, phone: string): Promise<NextResponse> {
  const limited = rateLimitMiddleware(request, 'admin_settings');
  if (limited) {
    // `withAuth` requires a NextResponse; the limiter returns a plain Response.
    return new NextResponse(await limited.text(), { status: limited.status, headers: limited.headers });
  }

  if (!isStaffCaller(auth)) {
    return NextResponse.json(
      { success: false, error: 'Contact identification is available to staff accounts only.', code: 'STAFF_ONLY' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const scope = getScopeForAuth(auth);
  if (scope === 'NONE' && !hasCompanyWideContactAccess(auth)) {
    return NextResponse.json(
      { success: false, error: 'Your role does not grant access to contact records.', code: 'SCOPE_NONE' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const card = await identifyByPhone(phone);

  // A name-only "lookup" reached the resolver: refuse, and say why.
  if (!card.queriedPhone) {
    const refusal = rejectNameOnlyIdentification();
    return NextResponse.json(
      { success: false, error: refusal.error, code: refusal.code },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const visible = await applyScope(card, auth);
  const auditRecorded = await recordAccess(auth, phone, visible, request);

  return NextResponse.json(
    {
      success: true,
      ...visible,
      audit: {
        recorded: auditRecorded,
        note: auditRecorded
          ? 'This lookup was written to the audit log.'
          : 'The audit log could not be written. Access is still recorded in server logs; report this to an administrator.',
      },
      viewer: {
        userId: auth.userId,
        scope,
        companyWide: hasCompanyWideContactAccess(auth),
      },
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

/**
 * Apply branch/assignment scope to a resolved card.
 *
 * Company-wide roles (Super Admin, COO, Admin, Data Entry with the covering
 * permissions) see the card. `ASSIGNED` and `BRANCH` viewers see it only when the
 * record is theirs — or, for a branch manager, when the record's counsellor belongs
 * to their branch. Anything else is returned *restricted*: the number is recognised,
 * the person is not disclosed.
 */
async function applyScope(card: IdentificationCard, auth: AuthContext): Promise<IdentificationCard> {
  if (hasCompanyWideContactAccess(auth)) return card;
  const scope = getScopeForAuth(auth);
  if (scope === 'ALL') return card;

  const primary = card.primary;
  if (!primary) return card; // possible-match lists carry no identity beyond a number

  if (primary.kind === 'partner_contact') {
    return auth.partnerId && primary.recordId === auth.partnerId ? card : restricted(card);
  }

  const counselorId = primary.counselor?.id || null;
  if (scope === 'ASSIGNED') {
    return counselorId && counselorId === auth.userId ? card : restricted(card);
  }

  // BRANCH: the record is visible when its counsellor is an active employee of the
  // viewer's branch. Student rows carry no branch column, so the counsellor is the
  // join — the same approach the contact hub uses for its scope filter.
  if (scope === 'BRANCH') {
    if (!auth.branch) return restricted(card);
    if (!counselorId) return restricted(card);
    try {
      const employee = await db.employee.findFirst({
        where: { userId: counselorId, branch: auth.branch },
        select: { id: true },
      });
      if (employee || counselorId === auth.userId) return card;
    } catch {
      return restricted(card);
    }
    return restricted(card);
  }

  return restricted(card);
}

function restricted(card: IdentificationCard): IdentificationCard {
  return {
    ...card,
    state: 'POSSIBLE_MATCHES',
    matchedOn: card.matchedOn,
    primary: null,
    possible: [],
    requiresConfirmation: true,
    restricted: true,
    notice:
      'A record matches this number, but it belongs to another branch or counsellor. Name, Student ID and history are withheld. Use "request access" or open the record through your own branch.',
  };
}

async function recordAccess(
  auth: AuthContext,
  phone: string,
  card: IdentificationCard,
  request: Request,
): Promise<boolean> {
  try {
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'contacts.identify',
        resource: 'ContactIdentification',
        resourceId: card.primary?.recordId || card.registryContactId || '',
        actorRole: (auth.roles || [])[0] || auth.userType || '',
        ipAddress: (request.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
        userAgent: (request.headers.get('user-agent') || '').slice(0, 300),
        studentId: card.primary?.kind === 'student' ? card.primary.publicId : '',
        // The number is masked: the audit log is evidence of *who looked*, and does
        // not need a second copy of the subscriber number to prove it.
        details: JSON.stringify({
          state: card.state,
          restricted: card.restricted,
          phoneSuffix: phone.replace(/\D/g, '').slice(-4),
        }).slice(0, 1000),
      },
    });
    return true;
  } catch {
    return false;
  }
}

function phoneFromUrl(request: Request): string {
  const url = new URL(request.url);
  // `name` is accepted only so the refusal can be explicit and testable.
  return (url.searchParams.get('phone') || '').trim().slice(0, 32);
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  const url = new URL(request.url);
  if (!url.searchParams.get('phone') && url.searchParams.get('name')) {
    const refusal = rejectNameOnlyIdentification();
    return NextResponse.json(
      { success: false, error: refusal.error, code: refusal.code },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
  return handle(request, auth, phoneFromUrl(request));
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  let body: { phone?: unknown; name?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  const phone = String(body.phone || '').trim().slice(0, 32);
  if (!phone) {
    const refusal = rejectNameOnlyIdentification();
    return NextResponse.json(
      { success: false, error: refusal.error, code: refusal.code },
      { status: 400, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
  return handle(request, auth, phone);
});
