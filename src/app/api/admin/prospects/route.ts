import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { checkRateLimit } from '@/lib/rate-limiter';
import {
  validateProspectRow,
  buildImportSummary,
  RELATIONSHIP_STATUSES,
} from '@/lib/prospects/prospect-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Edge RBAC in src/proxy.ts scopes every /api/admin/* route to ADMIN/SUPER_ADMIN.
// This handler re-checks the same set as defense-in-depth and to stay truthful if
// the edge rule is ever widened: everyone who reaches this file is an admin.
const MANAGER_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const TRANSITIONS: Record<string, string[]> = {
  DISCOVERED: ['VERIFIED', 'REVIEW_PENDING', 'REJECTED', 'DO_NOT_CONTACT'],
  VERIFIED: ['REVIEW_PENDING', 'CONTACTED', 'REJECTED', 'DO_NOT_CONTACT'],
  REVIEW_PENDING: ['VERIFIED', 'CONTACTED', 'INTERESTED', 'REJECTED', 'DO_NOT_CONTACT'],
  CONTACTED: ['INTERESTED', 'NEGOTIATION', 'REVIEW_PENDING', 'REJECTED', 'DO_NOT_CONTACT'],
  INTERESTED: ['NEGOTIATION', 'APPROVED_PARTNER', 'REJECTED', 'DO_NOT_CONTACT'],
  NEGOTIATION: ['APPROVED_PARTNER', 'REJECTED', 'DO_NOT_CONTACT'],
  APPROVED_PARTNER: ['DO_NOT_CONTACT'],
  REJECTED: ['DISCOVERED', 'DO_NOT_CONTACT'],
  DO_NOT_CONTACT: [],
};

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip.slice(0, 64);
}

/**
 * /api/admin/prospects — Google prospect sourcing queue.
 *
 * GET    — list prospects (manager roles), optional ?relationshipStatus=.
 * POST   — { rows: [...], dryRun: true|false } CSV/JSON import with
 *          validation + dedupe against the database. Dry-run never writes.
 *          Applies create only records that are valid AND not duplicates.
 * PATCH  — { id, relationshipStatus } lifecycle transition. APPROVED_PARTNER
 *          (partner conversion) is restricted to ADMIN/SUPER_ADMIN — a
 *          researched prospect never becomes an approved partner on its own.
 */

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!MANAGER_ROLES.includes(auth.userType.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'A manager role is required.' }, { status: 403 });
    }
    const status = (new URL(req.url).searchParams.get('relationshipStatus') || '').toUpperCase();
    const where = status && RELATIONSHIP_STATUSES.includes(status as any) ? { relationshipStatus: status } : undefined;
    try {
      const prospects = await db.b2bProspect.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json({ success: true, prospects });
    } catch (error) {
      console.error('[prospects] list failed', { reason: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ success: false, error: 'Could not load prospects.' }, { status: 503 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!MANAGER_ROLES.includes(auth.userType.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'A manager role is required to import prospects.' }, { status: 403 });
    }
    if (!mutationOriginAllowed(req, auth)) {
      return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    }

    const ip = clientIp(req);
    const limit = checkRateLimit(ip, 'b2b_prospect_import');
    if (!limit.allowed) {
      return NextResponse.json({ success: false, error: 'Import rate limit reached. Please try again later.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Invalid import body.' }, { status: 400 });
    }
    const rows: unknown[] = Array.isArray(body.rows) ? body.rows : [];
    const dryRun = body.dryRun !== false;
    if (rows.length === 0 || rows.length > 500) {
      return NextResponse.json({ success: false, error: 'Provide between 1 and 500 rows.' }, { status: 400 });
    }

    const validated = rows.map((row, index) => validateProspectRow(row, index + 1));
    const dedupeKeys = [...new Set(validated.map((r) => r.dedupeKey).filter((k): k is string => Boolean(k)))];
    let existing = new Set<string>();
    if (dedupeKeys.length > 0) {
      try {
        const found = await db.b2bProspect.findMany({
          where: { dedupeKey: { in: dedupeKeys } },
          select: { dedupeKey: true },
        });
        existing = new Set(found.map((r) => r.dedupeKey));
      } catch (error) {
        console.error('[prospects] duplicate lookup failed', { reason: error instanceof Error ? error.message : String(error) });
        return NextResponse.json({ success: false, error: 'Could not check duplicates. Nothing was imported.' }, { status: 503 });
      }
    }

    const summary = buildImportSummary(validated, existing);

    if (dryRun) {
      return NextResponse.json({ success: true, dryRun: true, summary });
    }

    // Apply: insert only valid, non-duplicate rows; keep the audit report honest.
    const creatable = validated.filter((r) => r.ok && r.value).filter((r) => {
      const key = r.dedupeKey || '';
      return !existing.has(key);
    });

    let created = 0;
    const errors: Array<{ index: number; reason: string }> = [];
    for (const row of creatable) {
      const v = row.value!;
      try {
        await db.b2bProspect.create({
          data: {
            organizationName: v.organizationName,
            contactPerson: v.contactPerson,
            businessEmail: v.businessEmail,
            businessPhone: v.businessPhone,
            officialWebsite: v.officialWebsite,
            country: v.country,
            city: v.city,
            organizationType: v.organizationType,
            sourceType: v.sourceType,
            sourceUrl: v.sourceUrl,
            researchDate: v.researchDate,
            researcherId: auth.userId || '',
            verificationStatus: 'DISCOVERED',
            relationshipStatus: 'DISCOVERED',
            outreachPermission: false,
            doNotContact: false,
            dedupeKey: v.dedupeKey,
            notes: v.notes,
          },
        });
        created++;
      } catch (error) {
        errors.push({ index: row.index, reason: error instanceof Error ? error.message : 'create failed' });
      }
    }

    await logAuditAction(auth, 'B2B_PROSPECT_IMPORT', 'b2b_prospects', created > 0 ? 'created' : 'noop', {
      received: summary.received,
      valid: summary.valid,
      invalid: summary.invalid,
      duplicatesInFile: summary.duplicatesInFile,
      duplicatesInDb: summary.duplicatesInDb,
      created,
      errors: errors.length,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      dryRun: false,
      created,
      errors,
      summary,
    });
  })(request);
}

export async function PATCH(request: NextRequest) {
  return withAuth(async (req, auth) => {
    if (!MANAGER_ROLES.includes(auth.userType.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'A manager role is required.' }, { status: 403 });
    }
    if (!mutationOriginAllowed(req, auth)) {
      return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    }
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    const target = typeof body?.relationshipStatus === 'string' ? body.relationshipStatus.toUpperCase() : '';
    if (!id || !RELATIONSHIP_STATUSES.includes(target as any)) {
      return NextResponse.json({ success: false, error: 'id and a valid relationshipStatus are required.' }, { status: 400 });
    }

    // Partner conversion requires real admin authority. Researchers, branch
    // managers and counsellors can prepare the file, never approve the partner.
    if (target === 'APPROVED_PARTNER' && !MANAGER_ROLES.includes(auth.userType.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Only ADMIN or SUPER_ADMIN may approve a partner.' }, { status: 403 });
    }

    try {
      const current = await db.b2bProspect.findUnique({ where: { id } });
      if (!current) return NextResponse.json({ success: false, error: 'Prospect not found.' }, { status: 404 });
      const allowed = TRANSITIONS[current.relationshipStatus] || [];
      if (!allowed.includes(target)) {
        return NextResponse.json({
          success: false,
          error: `Transition ${current.relationshipStatus} -> ${target} is not allowed.`,
        }, { status: 409 });
      }
      const updated = await db.b2bProspect.update({
        where: { id },
        data: {
          relationshipStatus: target,
          verificationStatus: target === 'APPROVED_PARTNER' ? 'APPROVED' : current.verificationStatus,
          doNotContact: target === 'DO_NOT_CONTACT' ? true : current.doNotContact,
        },
      });
      await logAuditAction(auth, 'B2B_PROSPECT_STATUS', 'b2b_prospects', id, {
        from: current.relationshipStatus,
        to: target,
      }).catch(() => null);
      return NextResponse.json({ success: true, prospect: updated });
    } catch (error) {
      console.error('[prospects] status update failed', { reason: error instanceof Error ? error.message : String(error) });
      return NextResponse.json({ success: false, error: 'Could not update the prospect.' }, { status: 503 });
    }
  })(request);
}
