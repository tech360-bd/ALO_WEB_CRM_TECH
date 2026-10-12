import { mutationOriginAllowed } from '@/lib/request-origin';
import { canUseUnscopedUccAdmin } from '@/lib/ucc/document-access';
// ============================================================
// /api/crm/ucc/ocr/process
// POST — Start or reprocess an OCR job
// GET  — List OCR jobs (by jobId or studentId)
// NOTE: OCR field extraction is a queued operation. In production,
//       connect to Google Vision API, AWS Textract, or similar.
//       This endpoint creates field stubs awaiting real OCR output.
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

const FIELD_CONFIG: Record<string, { fields: string[]; labels: string[] }> = {
  passport: {
    fields: ['full_name', 'passport_number', 'date_of_birth', 'expiry_date', 'nationality', 'gender', 'place_of_birth'],
    labels: ['Full Name', 'Passport Number', 'Date of Birth', 'Expiry Date', 'Nationality', 'Gender', 'Place of Birth'],
  },
  ielts_certificate: {
    fields: ['candidate_name', 'test_date', 'overall_score', 'listening', 'reading', 'writing', 'speaking', 'centre_number'],
    labels: ['Candidate Name', 'Test Date', 'Overall Score', 'Listening', 'Reading', 'Writing', 'Speaking', 'Test Centre Number'],
  },
  pte_certificate: {
    fields: ['candidate_name', 'test_date', 'overall_score', 'listening', 'reading', 'writing', 'speaking'],
    labels: ['Candidate Name', 'Test Date', 'Overall Score', 'Listening', 'Reading', 'Writing', 'Speaking'],
  },
  academic_transcript: {
    fields: ['student_name', 'institution', 'degree', 'cgpa', 'graduation_year', 'subject'],
    labels: ['Student Name', 'Institution', 'Degree', 'CGPA / GPA', 'Graduation Year', 'Subject / Major'],
  },
  bank_statement: {
    fields: ['account_holder', 'bank_name', 'statement_date', 'balance', 'account_number_masked'],
    labels: ['Account Holder', 'Bank Name', 'Statement Date', 'Balance', 'Account Number (Masked)'],
  },
  offer_letter: {
    fields: ['student_name', 'institution', 'course', 'intake_date', 'tuition_fee', 'campus'],
    labels: ['Student Name', 'Institution', 'Course', 'Intake Date', 'Tuition Fee', 'Campus'],
  },
  cas: {
    fields: ['student_name', 'cas_number', 'institution', 'course', 'expiry_date'],
    labels: ['Student Name', 'CAS Number', 'Institution', 'Course', 'CAS Expiry Date'],
  },
};

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (request.method !== 'GET' && !mutationOriginAllowed(request, auth)) return NextResponse.json({error:'Same-origin request required.'},{status:403});
    if (!canUseUnscopedUccAdmin(auth)) return NextResponse.json({success:false,code:'UCC_OWNERSHIP_SCOPE_PENDING',error:'Private UCC access is restricted to canonical administrators until domain-aware ownership is verified.'},{status:403});

    const { ocrJobId, forceReprocess } = await request.json() as {
      ocrJobId: string;
      forceReprocess?: boolean;
    };

    if (!ocrJobId) {
      return NextResponse.json({ success: false, error: 'ocrJobId is required.' }, { status: 400 });
    }

    const job = await db.ocrJob.findUnique({
      where: { id: ocrJobId },
      include: { fields: true },
    });

    if (!job) {
      return NextResponse.json({ success: false, error: 'OCR job not found.' }, { status: 404 });
    }

    if (job.status === 'completed' && !forceReprocess) {
      const fullJob = await db.ocrJob.findUnique({
        where: { id: ocrJobId },
        include: { fields: true, suggestions: true },
      });
      return NextResponse.json({ success: true, job: fullJob, message: 'OCR already completed.' });
    }

    // Update to processing
    await db.ocrJob.update({ where: { id: ocrJobId }, data: { status: 'processing' } });

    const fieldConfig = FIELD_CONFIG[job.documentType];

    if (fieldConfig) {
      if (forceReprocess) {
        await db.ocrFieldExtraction.deleteMany({ where: { ocrJobId } });
      }

      await db.ocrFieldExtraction.createMany({
        data: fieldConfig.fields.map((fieldKey, idx) => ({
          ocrJobId,
          fieldKey,
          fieldLabel: fieldConfig.labels[idx],
          extractedValue: '',
          confidence: 0,
          pageNumber: 1,
          sourceText: 'Awaiting OCR engine — connect Google Vision API or AWS Textract in production.',
        })),
      });
    }

    // Mark as review_required — human must verify values once OCR engine fills them
    await db.ocrJob.update({
      where: { id: ocrJobId },
      data: {
        status: 'review_required',
        rawText: 'OCR engine integration required. Connect a real OCR service (Google Vision API, AWS Textract, or Tesseract) to extract field values.',
        confidenceScore: 0,
      },
    });

    await logAuditAction(auth, 'OCR_JOB_INITIATED', 'OcrJob', ocrJobId, {
      documentType: job.documentType,
      fieldsCreated: fieldConfig?.fields.length ?? 0,
    });

    const updatedJob = await db.ocrJob.findUnique({
      where: { id: ocrJobId },
      include: { fields: true, suggestions: true },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: 'OCR field stubs created. Human review required to verify and complete extracted values.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (request.method !== 'GET' && !mutationOriginAllowed(request, auth)) return NextResponse.json({error:'Same-origin request required.'},{status:403});
    if (!canUseUnscopedUccAdmin(auth)) return NextResponse.json({success:false,code:'UCC_OWNERSHIP_SCOPE_PENDING',error:'Private UCC access is restricted to canonical administrators until domain-aware ownership is verified.'},{status:403});

    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const studentId = url.searchParams.get('studentId');
    const status = url.searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (jobId) where.id = jobId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const jobs = await db.ocrJob.findMany({
      where,
      include: { fields: true, suggestions: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
