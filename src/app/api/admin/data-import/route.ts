import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

// Maximum file size: 20 MB
const MAX_FILE_SIZE = 20 * 1024 * 1024;

// Formula injection protection: strip leading =, +, -, @
function sanitizeCellValue(val: string): string {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

// Automatic header mapping dictionary
const HEADER_MAPPING_DICT: Record<string, string> = {
  // University
  university: 'officialName',
  'university name': 'officialName',
  institution: 'officialName',
  'institution name': 'officialName',
  country: 'country',
  city: 'city',
  website: 'officialWebsite',
  'official url': 'officialWebsite',
  'official website': 'officialWebsite',

  // Course
  course: 'officialCourseTitle',
  'course name': 'officialCourseTitle',
  program: 'officialCourseTitle',
  programme: 'officialCourseTitle',
  'program name': 'officialCourseTitle',
  'programme title': 'officialCourseTitle',
  award: 'award',
  qualification: 'qualification',
  'study level': 'studyLevel',

  // Fees
  'tuition fee': 'tuitionFee',
  'international fee': 'tuitionFee',
  'annual tuition': 'tuitionFee',
  'fee amount': 'tuitionFee',
  currency: 'feeCurrency',
  'fee year': 'feeYear',

  // Intakes
  intake: 'intakeMonth',
  'start date': 'intakeMonth',
  'start month': 'intakeMonth',
  'intake month': 'intakeMonth',
  'intake year': 'intakeYear',
  'application deadline': 'deadline',

  // Requirements
  'entry requirement': 'academicRequirements',
  'academic requirement': 'academicRequirements',
  gpa: 'minimumGradeOrGpa',
  ielts: 'ieltsOverall',
  'ielts overall': 'ieltsOverall',
  'ielts components': 'ieltsComponentMin',
  pte: 'pteScore',
  toefl: 'toeflScore',
  duolingo: 'duolingoScore',
  'work experience': 'workExperienceRequired',
  'study gap': 'studyGapAllowed',

  // Sources
  'official course url': 'sourceUrl',
  'course url': 'sourceUrl',
  'source url': 'sourceUrl',
  'fee source': 'feeSourceUrl',
};

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & RBAC Check
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) {
      return authResult; // Returns 401 response
    }

    const authContext = authResult as AuthContext;
    const isSuperAdmin = authContext.roles?.includes('SUPER_ADMIN') || authContext.roles?.includes('ADMIN') || authContext.userType === 'admin';

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin authorization required for data import.' }, { status: 403 });
    }

    // 2. Parse Form Data / File Upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const batchName = (formData.get('batchName') as string) || `Batch-${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 20MB limit.' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'Invalid file format. Only CSV and XLSX files are supported.' }, { status: 400 });
    }

    // 3. Read File Content & Parse CSV
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileText = buffer.toString('utf8');
    const lines = fileText.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }

    const rawHeaders = lines[0].split(',').map((h) => h.replace(/^["']|["']$/g, '').trim());
    const mappedHeaders: string[] = rawHeaders.map((h) => {
      const lower = h.toLowerCase();
      return HEADER_MAPPING_DICT[lower] || h;
    });

    const parsedRows: Array<Record<string, string>> = [];
    const rowErrors: Array<{ rowNumber: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map((c) => sanitizeCellValue(c.replace(/^["']|["']$/g, '').trim()));
      const rowObj: Record<string, string> = {};
      
      mappedHeaders.forEach((header, idx) => {
        rowObj[header] = cells[idx] || '';
      });

      if (!rowObj.officialCourseTitle && !rowObj.officialName) {
        rowErrors.push({ rowNumber: i + 1, error: 'Row missing required university or course title' });
      } else {
        parsedRows.push(rowObj);
      }
    }

    // 4. Create Transaction Batch & Staging
    const resultBatch = await db.$transaction(async (tx) => {
      const batch = await tx.crmImportBatch.create({
        data: {
          importType: fileName.endsWith('.xlsx') ? 'xlsx_master' : 'csv_master',
          fileName: file.name,
          uploadedBy: authContext.email || authContext.userId,
          rowsReceived: parsedRows.length + rowErrors.length,
          rowsImported: parsedRows.length,
          rowsFailed: rowErrors.length,
          status: 'STAGED',
          rollbackAvailable: true,
        },
      });

      if (rowErrors.length > 0) {
        await tx.crmImportError.createMany({
          data: rowErrors.map((e) => ({
            batchId: batch.id,
            rowNumber: e.rowNumber,
            field: 'validation',
            errorMessage: e.error,
            rowData: '{}',
          })),
        });
      }

      return batch;
    });

    return NextResponse.json({
      success: true,
      batchId: resultBatch.id,
      fileName: file.name,
      mappedHeaders,
      stagedRows: parsedRows.length,
      errorsEncountered: rowErrors.length,
      status: 'STAGED_FOR_APPROVAL',
      message: 'File parsed and staged into transactional import batch. Super Admin approval required before public commit.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown import error';
    return NextResponse.json(
      { error: 'Import processing failed', details: message },
      { status: 500 }
    );
  }
}
