// POST /api/admin/data-import
//
// Catalogue CSV import with the same-data rule (see
// src/lib/course-finder/catalogue-import-service.ts):
//   mode=preview (default) — parse + classify only; no database writes.
//   mode=queue_changes     — records an import batch, queues every material
//                             change to an existing record as a field-level
//                             proposal in UniversityUpdateRequest (status
//                             pending_approval) and logs blocked/invalid rows.
//                             Live catalogue values are never changed here.
// New records are returned to the caller, which may stage them as draft,
// unverified rows through /api/crm/course-import/confirm. Nothing is published.
//
// The previous implementation reported rows as "staged" without storing them,
// parsed XLSX bytes as text and split CSV on raw commas; it has been replaced.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import {
  ImportParseError,
  classifyCatalogueRows,
  parseCatalogueCsv,
  summarize,
  toUpdateRequests,
  rowsForDraftStaging,
  type CatalogueLookup,
} from '@/lib/course-finder/catalogue-import-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const lookup: CatalogueLookup = {
  universities: (ids) => db.crmUniversity.findMany({ where: { universityId: { in: ids } } }) as never,
  courses: (ids) => db.crmCourse.findMany({ where: { courseId: { in: ids } } }) as never,
  intakeFees: (ids) => db.crmCourseIntakeFee.findMany({ where: { courseId: { in: ids } } }) as never,
  requirements: (ids) => db.crmCourseRequirement.findMany({ where: { courseId: { in: ids } }, orderBy: { updatedAt: 'desc' } }) as never,
  universityPool: async () =>
    (await db.crmUniversity.findMany({ select: { universityId: true, name: true, country: true, website: true, officialUrl: true }, take: 20000 }))
      .map((u) => ({ id: u.universityId, name: u.name, country: u.country, website: u.website || u.officialUrl })),
};

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase()) || !['user', 'portal'].includes(auth.identityDomain || '')) {
    return NextResponse.json({ error: 'Catalogue administrator required' }, { status: 403 });
  }
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ error: 'Same-origin request required' }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data with a CSV file' }, { status: 400 });
  }
  const file = form.get('file');
  const mode = form.get('mode') === 'queue_changes' ? 'queue_changes' : 'preview';
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: 'Uploaded file is empty' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File exceeds the 5 MB limit' }, { status: 413 });
  const name = file.name.slice(0, 191);
  if (/\.xlsx?$/i.test(name)) {
    return NextResponse.json({ error: 'XLSX upload is not supported yet. Save the sheet as CSV (UTF-8) and upload that file.' }, { status: 415 });
  }
  if (!/\.csv$/i.test(name)) return NextResponse.json({ error: 'Only .csv files are accepted' }, { status: 415 });

  let rows;
  try {
    rows = parseCatalogueCsv(await file.text());
  } catch (error) {
    if (error instanceof ImportParseError) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ error: 'Could not read the file' }, { status: 400 });
  }

  try {
    const classified = await classifyCatalogueRows(rows, lookup);
    const counts = summarize(classified);
    const proposals = toUpdateRequests(classified);
    const newRows = rowsForDraftStaging(classified).map((r) => r.row);
    const report = classified.map((r) => ({
      rowNumber: r.rowNumber,
      universityId: r.universityId,
      courseId: r.courseId,
      action: r.action,
      issues: r.issues,
      reasons: r.entities.map((e) => ({ entity: e.entity, action: e.result.action, reason: e.result.reason, duplicateOf: e.result.duplicateOf ?? null })),
      changes: r.entities.flatMap((e) => e.result.changes.map((c) => ({ entity: e.entity, ...c }))),
    }));

    if (mode === 'preview') {
      return NextResponse.json({ mode, fileName: name, rowsReceived: rows.length, counts, proposals: proposals.length, rows: report, newRows, published: false, verified: false });
    }

    const actor = `${auth.identityDomain}:${auth.actorUserId || auth.userId}`;
    const result = await db.$transaction(async (tx) => {
      const batch = await tx.crmImportBatch.create({
        data: {
          importType: 'catalogue_csv_same_data_rule',
          fileName: name,
          uploadedBy: actor.slice(0, 191),
          rowsReceived: rows.length,
          rowsImported: 0,
          rowsFailed: counts.INVALID,
          rowsDuplicate: counts.BLOCK_DUPLICATE,
          rowsWarning: counts.PENDING_CHANGE,
          rowsBlocked: counts.BLOCK_DUPLICATE + counts.INVALID,
          rollbackAvailable: false,
          status: proposals.length ? 'changes_queued_for_approval' : 'reviewed_no_changes',
        },
      });

      let queued = 0;
      let alreadyQueued = 0;
      for (const p of proposals) {
        const existing = await tx.universityUpdateRequest.findFirst({
          where: { universityId: p.universityId, courseId: p.courseId, fieldName: p.fieldName, newValue: p.newValue, status: { in: ['pending_approval', 'pending', 'reviewed_unverified'] } },
          select: { id: true },
        });
        if (existing) { alreadyQueued++; continue; }
        await tx.universityUpdateRequest.create({ data: p });
        queued++;
      }

      const problemRows = classified.filter((r) => r.action === 'INVALID' || r.action === 'BLOCK_DUPLICATE');
      if (problemRows.length) {
        await tx.crmImportError.createMany({
          data: problemRows.map((r) => ({
            batchId: batch.id,
            rowNumber: r.rowNumber,
            universityId: r.universityId.slice(0, 191),
            courseId: r.courseId.slice(0, 191),
            field: r.action === 'BLOCK_DUPLICATE' ? 'duplicate' : (r.issues[0]?.column ?? 'row').slice(0, 191),
            errorMessage: (r.action === 'BLOCK_DUPLICATE'
              ? r.entities.find((e) => e.result.action === 'BLOCK_DUPLICATE')?.result.reason ?? 'Probable duplicate'
              : r.issues.map((x) => x.message).join('; ')).slice(0, 191),
            severity: 'error',
            // CrmImportError columns are VARCHAR(191): keep identifiers only.
            rowData: JSON.stringify({ university_id: r.row.university_id, course_id: r.row.course_id, intake_year: r.row.intake_year, intake_month: r.row.intake_month }).slice(0, 191),
          })),
        });
      }

      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CATALOG_IMPORT_CHANGES_QUEUED',
          entityType: 'CrmImportBatch',
          entityId: batch.id,
          metadata: JSON.stringify({ fileName: name, counts, queued, alreadyQueued, identityDomain: auth.identityDomain }),
        },
      });
      return { batchId: batch.id, queued, alreadyQueued };
    });

    return NextResponse.json({
      mode,
      fileName: name,
      rowsReceived: rows.length,
      counts,
      ...result,
      rows: report,
      newRows,
      published: false,
      verified: false,
      message: 'Material changes were queued for Super Admin review; live values are unchanged. New rows can be staged as draft, unverified records.',
    });
  } catch (error) {
    console.error('[admin/data-import] failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ error: 'Import could not be processed; no changes were committed' }, { status: 503 });
  }
}
