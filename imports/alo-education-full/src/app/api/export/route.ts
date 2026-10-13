import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse } from '@/lib/access-control';

const EXPORTABLE_TYPES = [
  'students',
  'leads',
  'applications',
  'universities',
  'courses',
  'finance',
] as const;

type ExportType = (typeof EXPORTABLE_TYPES)[number];

/**
 * Escapes a value for CSV. Wraps in quotes if it contains comma, quote, or newline. */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string from an array of objects.
 */
function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const lines: string[] = [];
  lines.push(headers.map(csvEscape).join(','));
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

/**
 * Creates a CSV download response.
 */
function csvResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

// ─── GET: CSV Export ─────────────────────────────────────────

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') as ExportType | null;
  const format = sp.get('format') || 'csv';

  if (!type || !EXPORTABLE_TYPES.includes(type as ExportType)) {
    return NextResponse.json(
      { success: false, error: `Invalid type. Must be one of: ${EXPORTABLE_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  if (format !== 'csv') {
    return NextResponse.json(
      { success: false, error: 'Only CSV format is supported currently.' },
      { status: 400 }
    );
  }

  try {
    const timestamp = new Date().toISOString().slice(0, 10);

    switch (type) {
      case 'students': {
        const students = await db.student.findMany({
          select: {
            studentId: true, fullName: true, firstName: true, lastName: true,
            email: true, mobile: true, gender: true, nationality: true,
            dateOfBirth: true, studyDestination: true, studyLevel: true,
            intake: true, status: true, profileCompletion: true,
            englishTestStatus: true, fundingStatus: true,
            createdAt: true, updatedAt: true,
          },
          take: 10000,
          orderBy: { createdAt: 'desc' },
        });
        const headers = [
          'studentId', 'fullName', 'firstName', 'lastName', 'email', 'mobile',
          'gender', 'nationality', 'dateOfBirth', 'studyDestination', 'studyLevel',
          'intake', 'status', 'profileCompletion', 'englishTestStatus',
          'fundingStatus', 'createdAt', 'updatedAt',
        ];
        return csvResponse(`alo-students-${timestamp}.csv`, toCSV(headers, students as unknown as Record<string, unknown>[]));
      }

      case 'leads': {
        const leads = await db.lead.findMany({
          select: {
            leadId: true, fullName: true, email: true, phone: true,
            source: true, preferredCountry: true, preferredCourse: true,
            status: true, leadScore: true, leadTier: true, priority: true,
            counselorId: true, followUpDate: true, branch: true,
            createdAt: true, updatedAt: true,
          },
          take: 10000,
          orderBy: { createdAt: 'desc' },
        });
        const headers = [
          'leadId', 'fullName', 'email', 'phone', 'source',
          'preferredCountry', 'preferredCourse', 'status', 'leadScore',
          'leadTier', 'priority', 'counselorId', 'followUpDate',
          'branch', 'createdAt', 'updatedAt',
        ];
        return csvResponse(`alo-leads-${timestamp}.csv`, toCSV(headers, leads as unknown as Record<string, unknown>[]));
      }

      case 'applications': {
        const applications = await db.application.findMany({
          select: {
            applicationId: true, university: true, course: true,
            country: true, intake: true, studyLevel: true,
            stage: true, priority: true, deadline: true,
            counselorId: true, appTeamOfficerId: true,
            studentId: true, createdAt: true, updatedAt: true,
          },
          take: 10000,
          orderBy: { createdAt: 'desc' },
        });
        const headers = [
          'applicationId', 'university', 'course', 'country', 'intake',
          'studyLevel', 'stage', 'priority', 'deadline', 'counselorId',
          'appTeamOfficerId', 'studentId', 'createdAt', 'updatedAt',
        ];
        return csvResponse(`alo-applications-${timestamp}.csv`, toCSV(headers, applications as unknown as Record<string, unknown>[]));
      }

      case 'universities': {
        const universities = await db.universityPage.findMany({
          select: {
            slug: true, name: true, city: true, countrySlug: true,
            ranking: true, tuitionRange: true, scholarshipAvailable: true,
            applicationFee: true, contactEmail: true, officialWebsite: true,
            createdAt: true, updatedAt: true,
          },
          take: 10000,
          orderBy: { name: 'asc' },
        });
        const headers = [
          'slug', 'name', 'city', 'countrySlug', 'ranking',
          'tuitionRange', 'scholarshipAvailable', 'applicationFee',
          'contactEmail', 'officialWebsite', 'createdAt', 'updatedAt',
        ];
        return csvResponse(`alo-universities-${timestamp}.csv`, toCSV(headers, universities as unknown as Record<string, unknown>[]));
      }

      case 'courses': {
        const courses = await db.coursePage.findMany({
          select: {
            slug: true, name: true, level: true, subject: true,
            universitySlug: true, countrySlug: true, duration: true,
            tuition: true, scholarshipAvailable: true, internship: true,
            createdAt: true, updatedAt: true,
          },
          take: 10000,
          orderBy: { name: 'asc' },
        });
        const headers = [
          'slug', 'name', 'level', 'subject', 'universitySlug',
          'countrySlug', 'duration', 'tuition', 'scholarshipAvailable',
          'internship', 'createdAt', 'updatedAt',
        ];
        return csvResponse(`alo-courses-${timestamp}.csv`, toCSV(headers, courses as unknown as Record<string, unknown>[]));
      }

      case 'finance': {
        // Export payments with student info
        const payments = await db.payment.findMany({
          select: {
            paymentId: true, type: true, amount: true, currency: true,
            status: true, method: true, studentId: true,
            commissionAmount: true, commissionStatus: true,
            createdAt: true, updatedAt: true,
            invoices: {
              select: { invoiceNo: true, totalAmount: true, status: true, dueDate: true },
            },
          },
          take: 10000,
          orderBy: { createdAt: 'desc' },
        });
        const rows = payments.map((p) => ({
          paymentId: p.paymentId,
          type: p.type,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          method: p.method || '',
          studentId: p.studentId,
          commissionAmount: p.commissionAmount || 0,
          commissionStatus: p.commissionStatus || '',
          invoiceCount: p.invoices.length,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
        const headers = [
          'paymentId', 'type', 'amount', 'currency', 'status', 'method',
          'studentId', 'commissionAmount', 'commissionStatus', 'invoiceCount',
          'createdAt', 'updatedAt',
        ];
        return csvResponse(`alo-finance-${timestamp}.csv`, toCSV(headers, rows));
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Export type not implemented.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Export failed.' },
      { status: 500 }
    );
  }
}
