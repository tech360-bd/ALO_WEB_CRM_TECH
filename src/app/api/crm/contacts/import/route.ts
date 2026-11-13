/**
 * Contact Hub CSV import.
 *
 * Two explicit phases: `preview` (parse → field mapping → row validation →
 * duplicate detection, no writes) and `commit` (idempotent insert of valid,
 * non-duplicate rows + import history + row-level errors + audit). A retry can
 * target specific row numbers; the duplicate check runs again inside the
 * transaction so a replay cannot create a second contact.
 *
 * Importing a contact NEVER creates marketing consent. No ConsentRecord is
 * written by this endpoint; promotional eligibility still fails closed.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { contactScopeWhere } from '@/lib/contacts/access-scope';
import { contactHubPermissionDenied } from '@/lib/contacts/hub-access';
import {
  DEFAULT_CONTACT_FIELD_MAPPING,
  parseContactCsv,
  validateContactImportRow,
  type ContactFieldMapping,
} from '@/lib/contacts/registry';
import { phoneVariants } from '@/lib/communications/contact-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_CSV_BYTES = 1_000_000;
const MAX_ROWS = 2000;
const ALLOWED_MAPPING_FIELDS = Object.keys(DEFAULT_CONTACT_FIELD_MAPPING);
const LAWFUL_BASIS = new Set(['EXPLICIT_CONSENT', 'EXISTING_CUSTOMER', 'CONTRACTUAL', 'OTHER_DOCUMENTED']);

function normalizeMapping(input: unknown): ContactFieldMapping {
  const mapping = { ...DEFAULT_CONTACT_FIELD_MAPPING };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return mapping;
  for (const field of ALLOWED_MAPPING_FIELDS) {
    const value = (input as Record<string, unknown>)[field];
    if (typeof value === 'string' && /^[a-z0-9_\-\s]{1,64}$/i.test(value.trim())) {
      mapping[field] = value.trim().toLowerCase();
    }
  }
  return mapping;
}

function tagsFor(row: NonNullable<ReturnType<typeof validateContactImportRow>['normalized']>): string[] {
  return [
    ...(row.category ? [row.category] : []),
    ...(row.language ? [row.language] : []),
    ...(row.city ? [`city:${row.city}`] : []),
    ...(row.campaign ? [`campaign:${row.campaign}`] : []),
    'source:CSV_IMPORT',
    'consent:not_imported',
    ...row.tags,
  ].slice(0, 50);
}

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.import', ['MARKETING_MANAGER']);
  if (denied) return denied;
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A JSON body is required.' }, { status: 400 });
  }
  const mode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : 'preview';
  if (!['preview', 'commit'].includes(mode)) {
    return NextResponse.json({ success: false, error: 'mode must be preview or commit.' }, { status: 400 });
  }
  const csv = typeof body.csv === 'string' ? body.csv : '';
  if (!csv || Buffer.byteLength(csv, 'utf8') > MAX_CSV_BYTES) {
    return NextResponse.json({ success: false, error: `CSV is required and must be under ${MAX_CSV_BYTES} bytes.` }, { status: 400 });
  }
  const fileName = typeof body.fileName === 'string' ? body.fileName.trim().slice(0, 191) : 'contacts.csv';
  const mapping = normalizeMapping(body.mapping);
  const { headers, rows } = parseContactCsv(csv);
  if (!headers.length || rows.length > MAX_ROWS) {
    return NextResponse.json({ success: false, error: `CSV must have a header row and at most ${MAX_ROWS} data rows.` }, { status: 400 });
  }

  // A documented lawful basis is mandatory before any import is persisted.
  if (mode === 'commit') {
    const basis = typeof body.lawfulBasis === 'string' ? body.lawfulBasis.trim().toUpperCase() : '';
    const reference = typeof body.lawfulBasisReference === 'string' ? body.lawfulBasisReference.trim().slice(0, 500) : '';
    if (!LAWFUL_BASIS.has(basis) || reference.length < 5) {
      return NextResponse.json({
        success: false,
        error: 'A documented lawfulBasis and lawfulBasisReference (at least 5 characters) are required before importing contacts.',
      }, { status: 400 });
    }
  }

  const requestedRows = Array.isArray(body.rowNumbers)
    ? new Set(body.rowNumbers.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 1))
    : null;

  type EvaluatedRow = {
    rowNumber: number;
    errors: string[];
    duplicate: boolean;
    duplicateReason?: string;
    normalized: ReturnType<typeof validateContactImportRow>['normalized'];
  };

  const evaluated: EvaluatedRow[] = [];
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2; // header is row 1
    const result = validateContactImportRow(headers, rows[index], mapping, rowNumber);
    if (!result.normalized) {
      evaluated.push({ rowNumber, errors: result.errors, duplicate: false, normalized: null });
      continue;
    }
    const normalized = result.normalized;
    const phoneKey = normalized.normalizedPhone;
    const emailKey = normalized.normalizedEmail;
    const errors = [...result.errors];
    // The canonical registry is phone-keyed. Email-only rows cannot be stored
    // without a schema change, so they are reported as row errors rather than
    // being silently dropped or written into a second contact table.
    if (!phoneKey) errors.push('Email-only contacts are not supported by the existing phone-keyed registry; add a verified phone or use the identity review queue.');
    let duplicate = false;
    let duplicateReason: string | undefined;
    if (phoneKey && seenPhones.has(phoneKey)) { duplicate = true; duplicateReason = 'Repeated phone within this CSV file.'; }
    if (!duplicate && emailKey && seenEmails.has(emailKey)) { duplicate = true; duplicateReason = 'Repeated email within this CSV file.'; }
    if (phoneKey) seenPhones.add(phoneKey);
    if (emailKey) seenEmails.add(emailKey);
    evaluated.push({ rowNumber, errors, duplicate, duplicateReason, normalized });
  }

  // Check the live registry for every candidate with a phone (also for preview).
  const candidatePhones = [...new Set(evaluated
    .filter((row) => row.normalized?.normalizedPhone && !row.errors.length && !row.duplicate)
    .map((row) => row.normalized!.normalizedPhone))];
  try {
    const scope = await contactScopeWhere(auth);
    const existing = candidatePhones.length
      ? await db.whatsAppContact.findMany({
          where: { AND: [scope, { normalizedPhone: { in: candidatePhones } }] } as never,
          select: { normalizedPhone: true, email: true },
          take: 2000,
        })
      : [];
    const existingPhones = new Set(existing.map((row) => row.normalizedPhone));
    const existingEmails = new Set(existing.map((row) => row.email?.toLowerCase()).filter(Boolean) as string[]);
    for (const row of evaluated) {
      if (!row.normalized || row.errors.length || row.duplicate) continue;
      if (row.normalized.normalizedPhone && existingPhones.has(row.normalized.normalizedPhone)) {
        row.duplicate = true;
        row.duplicateReason = 'A contact with this normalized phone already exists in the registry.';
      } else if (row.normalized.normalizedEmail && existingEmails.has(row.normalized.normalizedEmail)) {
        row.duplicate = true;
        row.duplicateReason = 'A contact with this email already exists in the registry.';
      }
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Existing contacts could not be checked; import was not performed.' }, { status: 503 });
  }

  const validRows = evaluated.filter((row) => row.normalized && !row.errors.length && !row.duplicate);
  const invalidRows = evaluated.filter((row) => row.errors.length);
  const duplicateRows = evaluated.filter((row) => row.duplicate);

  if (mode === 'preview') {
    return NextResponse.json({
      success: true,
      mode: 'preview',
      fileName,
      headers,
      mapping,
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      duplicateRows: duplicateRows.length,
      rows: evaluated.slice(0, 200).map((row) => ({
        rowNumber: row.rowNumber,
        errors: row.errors,
        duplicate: row.duplicate,
        duplicateReason: row.duplicateReason,
        // Only non-PII normalization metadata is shown in the preview.
        preview: row.normalized ? {
          fullName: row.normalized.fullName,
          normalizedPhone: row.normalized.normalizedPhone,
          normalizedEmail: row.normalized.normalizedEmail,
          category: row.normalized.category,
          language: row.normalized.language,
        } : null,
      })),
      consentImported: false,
      note: 'Preview performs no writes. Commit requires a documented lawful basis and never creates marketing consent.',
      integrationState: 'LIVE_DB',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const rowsToCommit = validRows.filter((row) => !requestedRows || requestedRows.has(row.rowNumber));
  const lawfulBasis = String(body.lawfulBasis).trim().toUpperCase();
  const lawfulBasisReference = String(body.lawfulBasisReference).trim().slice(0, 500);

  try {
    const result = await db.$transaction(async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          sourceCrmName: 'CONTACT_HUB_CSV',
          fileName,
          totalRows: rows.length,
          status: 'processing',
          createdBy: auth.userId,
        },
      });
      let created = 0;
      let duplicates = 0;
      let errors = 0;
      for (const row of rowsToCommit) {
        const normalized = row.normalized!;
        const variants = phoneVariants(normalized.normalizedPhone);
        // Re-check inside the transaction: retry-safe and concurrency-safe with
        // the unique normalizedPhone constraint on WhatsAppContact.
        const exists = await tx.whatsAppContact.findFirst({
          where: { OR: [
            { normalizedPhone: { in: variants } },
            { phone: { in: variants } },
            ...(normalized.normalizedEmail ? [{ normalizedEmail: normalized.normalizedEmail }] : []),
          ] },
          select: { id: true },
        });
        if (exists) { duplicates += 1; continue; }
        try {
          await tx.whatsAppContact.create({
            data: {
              phone: normalized.normalizedPhone,
              normalizedPhone: normalized.normalizedPhone,
              email: normalized.email,
              normalizedEmail: normalized.normalizedEmail,
              displayName: normalized.fullName,
              source: normalized.source || 'CSV_IMPORT',
              countryCode: normalized.country,
              branch: auth.branch || '',
              assignedCounselorId: auth.userId,
              tags: JSON.stringify(tagsFor(normalized)),
            },
          });
          created += 1;
        } catch (error) {
          // A concurrent insert (P2002) is a duplicate, not a failure.
          if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === 'P2002') {
            duplicates += 1;
            continue;
          }
          errors += 1;
          await tx.importError.create({
            data: {
              batchId: batch.id,
              rowNumber: row.rowNumber,
              fieldName: 'row',
              errorMessage: 'Row could not be saved. Retry this row number.',
              rawData: JSON.stringify({ fullName: normalized.fullName, normalizedPhone: normalized.normalizedPhone }),
            },
          });
        }
      }
      for (const row of invalidRows.filter((candidate) => !requestedRows || requestedRows.has(candidate.rowNumber))) {
        errors += 1;
        await tx.importError.create({
          data: {
            batchId: batch.id,
            rowNumber: row.rowNumber,
            fieldName: 'validation',
            errorMessage: row.errors.join('; ').slice(0, 1000),
            rawData: JSON.stringify({ rowNumber: row.rowNumber }),
          },
        });
      }
      await tx.importBatch.update({
        where: { id: batch.id },
        data: { status: 'completed', newCount: created, duplicateCount: duplicates + duplicateRows.length, errorCount: errors },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_IMPORT_COMMITTED',
          entityType: 'ImportBatch',
          entityId: batch.id,
          metadata: JSON.stringify({ fileName, lawfulBasis, lawfulBasisReference, created, duplicates: duplicates + duplicateRows.length, errors, consentImported: false }),
        },
      });
      return { batchId: batch.id, created, duplicates: duplicates + duplicateRows.length, errors };
    });
    return NextResponse.json({
      success: true,
      mode: 'commit',
      ...result,
      skippedExistingDuplicates: duplicateRows.length,
      retriedRows: requestedRows ? [...requestedRows] : null,
      consentImported: false,
      message: 'Import completed. No marketing consent was created by this import.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Import could not be committed; no partial history was retained.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });

export const GET = withAuth(async (_req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.import', ['MARKETING_MANAGER']);
  if (denied) return denied;
  try {
    const batches = await db.importBatch.findMany({
      where: { sourceCrmName: 'CONTACT_HUB_CSV', ...(auth.roles.some((role) => role.toLowerCase() === 'super_admin') ? {} : { createdBy: auth.userId }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ success: true, batches, integrationState: 'LIVE_DB' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Import history is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });
