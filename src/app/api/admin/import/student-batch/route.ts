import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { normalizeStudentRow } from '@/lib/import-normalizers';
import { evaluateIncomingVsCandidates } from '@/lib/student-duplicate-engine';
import { MAX_STUDENT_IMPORT_BYTES, parseStudentCsv, parseStudentXlsx } from '@/lib/student-import-file';

export const runtime = 'nodejs';
const MAX_TEXT_FIELD = 50_000;

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

function listValue(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value).slice(0, MAX_TEXT_FIELD);
  const text = String(value ?? '').trim();
  if (!text) return '[]';
  try {
    const parsed: unknown = JSON.parse(text);
    return JSON.stringify(Array.isArray(parsed) ? parsed : [parsed]).slice(0, MAX_TEXT_FIELD);
  } catch {
    return JSON.stringify([text]).slice(0, MAX_TEXT_FIELD);
  }
}

async function readImport(request: Request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    const sourceCrmName = String(formData.get('sourceCrmName') || 'Old CRM').trim();
    if (!(file instanceof File)) throw Object.assign(new Error('Select a CSV or XLSX file.'), { status: 400 });
    if (!file.size || file.size > MAX_STUDENT_IMPORT_BYTES) throw Object.assign(new Error('File must be between 1 byte and 20 MB.'), { status: 413 });
    const lowerName = file.name.toLowerCase();
    let students: Record<string, string>[];
    if (lowerName.endsWith('.csv')) {
      students = parseStudentCsv(await file.text());
    } else if (lowerName.endsWith('.xlsx')) {
      students = await parseStudentXlsx(new Uint8Array(await file.arrayBuffer()));
    } else {
      throw Object.assign(new Error('Only CSV and XLSX files are supported.'), { status: 415 });
    }
    return { sourceCrmName, fileName: file.name.slice(0, 191), students };
  }

  const data = await request.json();
  return {
    sourceCrmName: String(data.sourceCrmName || 'Old CRM').trim(),
    fileName: String(data.fileName || 'import.json').trim().slice(0, 191),
    students: Array.isArray(data.students) ? data.students : [],
  };
}

async function findCandidates(normalized: ReturnType<typeof normalizeStudentRow>, raw: Record<string, unknown>) {
  const email = normalized.email;
  const normalizedPhone = normalized.phone;
  const rawPhone = String(raw.phone || '').trim();
  const whatsapp = String(raw.whatsapp || '').trim();
  const oldCrmId = normalized.oldCrmId;
  const candidates: any[] = [];

  const clauses: any[] = [];
  for (const value of new Set([email, normalizedPhone, rawPhone, whatsapp].filter(Boolean))) {
    clauses.push({ email: value }, { phone: value });
  }
  if (normalized.studentName) clauses.push({ name: { contains: normalized.studentName } });
  if (clauses.length) {
    const found = await db.student.findMany({
      where: { OR: clauses },
      select: { id: true, studentId: true, name: true, email: true, phone: true, updatedAt: true },
      take: 100,
    }).catch(() => []);
    candidates.push(...found.map((student: any) => ({
      id: student.id,
      studentId: student.studentId,
      email: student.email,
      phone: student.phone,
      studentName: student.name,
      normalizedNameKey: String(student.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      dateOfBirth: '',
    })));
  }

  if (normalized.passportNumber) {
    const passport = await db.studentPassport.findFirst({ where: { passportNumber: normalized.passportNumber }, select: { studentId: true, dateOfBirth: true } }).catch(() => null);
    if (passport?.studentId && !candidates.some((candidate) => candidate.id === passport.studentId)) {
      const student = await db.student.findUnique({ where: { id: passport.studentId }, select: { id: true, studentId: true, name: true, email: true, phone: true } }).catch(() => null);
      if (student) candidates.push({
        id: student.id,
        studentId: student.studentId,
        email: student.email,
        phone: student.phone,
        passportNumber: normalized.passportNumber,
        dateOfBirth: passport.dateOfBirth,
        studentName: student.name,
        normalizedNameKey: String(student.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      });
    }
  }

  if (oldCrmId) {
    const oldEvents = await db.studentEvent.findMany({
      where: { eventType: 'STUDENT_IMPORTED_FROM_OLD_CRM', payload: { contains: oldCrmId.slice(0, 100) } },
      select: { studentId: true, payload: true }, take: 100,
    }).catch(() => []);
    for (const event of oldEvents) {
      let exact = false;
      try { exact = JSON.parse(event.payload || '{}').oldCrmId === oldCrmId; } catch { /* ignore malformed legacy rows */ }
      if (!exact || candidates.some((candidate) => candidate.id === event.studentId)) continue;
      const student = await db.student.findUnique({ where: { id: event.studentId }, select: { id: true, studentId: true, name: true, email: true, phone: true } }).catch(() => null);
      if (student) candidates.push({
        id: student.id, studentId: student.studentId, email: student.email, phone: student.phone,
        oldCrmId, studentName: student.name,
        normalizedNameKey: String(student.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
      });
    }
  }
  return candidates;
}

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required.' }, { status: 403 });

  try {
    const { sourceCrmName, fileName, students } = await readImport(request);
    if (!sourceCrmName || sourceCrmName.length > 191) {
      return NextResponse.json({ success: false, error: 'Source CRM name is required and must be under 192 characters.' }, { status: 400 });
    }
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: 'The import file has no student rows.' }, { status: 400 });
    }
    if (students.length > 25_000) {
      return NextResponse.json({ success: false, error: 'Import is limited to 25,000 student rows.' }, { status: 413 });
    }

    const batch = await db.importBatch.create({
      data: {
        sourceCrmName,
        fileName,
        totalRows: students.length,
        status: 'ready_for_review',
        createdBy: auth.userId,
      },
    });

    let newCount = 0;
    let matchedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    for (let index = 0; index < students.length; index += 1) {
      const row = students[index] || {};
      const rowNumber = index + 2;
      try {
        const n = normalizeStudentRow(Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? '')])));
        const missing: string[] = [];
        if (!n.studentName) missing.push('studentName');
        if (!n.phone && !n.whatsapp && !n.email && !n.passportNumber && !n.oldCrmId) missing.push('phone, whatsapp, email, passportNumber, or oldCrmId');
        const candidates = await findCandidates(n, row);
        const evaluation = evaluateIncomingVsCandidates({
          oldCrmId: n.oldCrmId,
          phone: n.phone,
          whatsapp: n.whatsapp,
          email: n.email,
          passportNumber: n.passportNumber,
          normalizedNameKey: n.normalizedNameKey,
          studentName: n.studentName,
          dateOfBirth: n.dateOfBirth,
        }, candidates);
        const matchedStudentId = evaluation.matchedStudentId || '';
        const possibleDuplicate = evaluation.level !== 'NO_MATCH';
        const status = missing.length ? 'needs_information' : possibleDuplicate ? 'possible_duplicate' : 'new';
        const duplicateRisk = possibleDuplicate
          ? evaluation.level === 'MATCHED' ? 'high' : evaluation.level === 'POSSIBLE_MATCH' ? 'medium' : 'low'
          : 'none';
        const staging = await db.importStagingStudent.create({
          data: {
            batchId: batch.id,
            rowNumber,
            studentName: n.studentName,
            email: n.email,
            phone: n.phone,
            whatsapp: n.whatsapp,
            passportNumber: n.passportNumber,
            dateOfBirth: n.dateOfBirth,
            countryInterest: n.countryInterest,
            courseInterest: n.courseInterest,
            universityInterest: n.universityInterest,
            applicationStatus: String(row.applicationStatus || 'new').slice(0, 100),
            counselorName: String(row.counselorName || '').slice(0, 191),
            oldCrmId: n.oldCrmId,
            documentsJson: listValue(row.documents),
            notesJson: listValue(row.notes),
            communicationJson: listValue(row.communicationHistory),
            paymentStatus: String(row.paymentStatus || 'none').slice(0, 100),
            visaStatus: String(row.visaStatus || 'none').slice(0, 100),
            createdDate: String(row.createdDate || '').slice(0, 100),
            updatedDate: String(row.updatedDate || '').slice(0, 100),
            matchedStudentId,
            duplicateRiskLevel: duplicateRisk,
            status,
            errorDetails: JSON.stringify({
              duplicateLevel: evaluation.level,
              confidence: evaluation.confidence,
              reasons: evaluation.reasons,
              missing,
            }),
          },
        });
        if (possibleDuplicate) { matchedCount += 1; duplicateCount += 1; }
        else if (!missing.length) newCount += 1;
        if (missing.length) {
          errorCount += 1;
          await db.importError.create({ data: { batchId: batch.id, rowNumber, fieldName: missing.join(','), errorMessage: 'Required identity fields are missing; row needs review before import.', rawData: JSON.stringify(row).slice(0, 10_000) } });
        }
        void staging;
      } catch (error) {
        errorCount += 1;
        await db.importError.create({
          data: {
            batchId: batch.id,
            rowNumber,
            fieldName: 'row',
            errorMessage: String(error instanceof Error ? error.message : error).slice(0, 500),
            rawData: JSON.stringify(row).slice(0, 10_000),
          },
        }).catch(() => undefined);
      }
    }

    const updatedBatch = await db.importBatch.update({
      where: { id: batch.id },
      data: { newCount, matchedCount, duplicateCount, errorCount },
    });
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_UPLOADED',
        batchId: batch.id,
        beforeData: '{}',
        afterData: JSON.stringify({ fileName, totalRows: students.length, stagedRows: students.length, status: updatedBatch.status }),
      },
    });

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRows: students.length,
      newCount,
      matchedCount,
      duplicateCount,
      errorCount,
      status: 'ready_for_review',
    }, { status: 201 });
  } catch (error: any) {
    const status = Number.isInteger(error?.status) ? error.status : 400;
    return NextResponse.json({ success: false, error: status === 500 ? 'Import file could not be staged.' : String(error?.message || 'Invalid import file.') }, { status });
  }
});
