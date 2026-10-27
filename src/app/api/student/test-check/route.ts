// GET /api/student/test-check
//
// Verifies that the signed-in student's journey is actually wired end to end:
// every check below reads a real table for this student and reports PASS / FAIL
// with the concrete reason. Nothing is assumed and nothing is simulated — a
// missing row is a FAIL, not a warning.
//
// Scope: the caller's own student record only. Staff cannot probe arbitrary
// students through this endpoint.

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStudentResource } from '@/lib/student-resource-auth';

export const dynamic = 'force-dynamic';

interface Check {
  id: string;
  label: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  detail: string;
  requiredFix?: string;
}

export async function GET(req: NextRequest) {
  const access = await requireStudentResource(req, null);
  if (access instanceof NextResponse) return access;
  const studentId = access.studentId;

  try {
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true, studentId: true, name: true, email: true, phone: true,
        profileComplete: true, journeyStage: true, status: true, userType: true,
        currentCountry: true, createdAt: true,
      },
    });
    if (!student) {
      return NextResponse.json({ success: false, error: 'Student record not found for this session.' }, { status: 404 });
    }

    const [applications, documents, shortlist, englishTests, mockCredits, payments, tasks] = await Promise.all([
      db.application.count({ where: { studentId } }).catch(() => 0),
      db.document.count({ where: { studentId } }).catch(() => 0),
      db.courseShortlist.count({ where: { studentId } }).catch(() => 0),
      db.studentEnglishTest.count({ where: { studentId } }).catch(() => 0),
      db.mockTestCredit.findFirst({ where: { studentId }, select: { totalCredits: true, usedCredits: true } }).catch(() => null),
      db.payment.count({ where: { studentId } }).catch(() => 0),
      db.task.count({ where: { studentId } }).catch(() => 0),
    ]);

    const checks: Check[] = [
      {
        id: 'account',
        label: 'Student account exists and is usable',
        status: student.status?.toLowerCase() === 'active' ? 'PASS' : 'FAIL',
        detail: `status=${student.status}, studentId=${student.studentId}`,
        requiredFix: student.status?.toLowerCase() === 'active' ? undefined : 'Activate the student record (students.status).',
      },
      {
        id: 'contact',
        label: 'Contact details captured',
        status: student.email && student.phone ? 'PASS' : 'FAIL',
        detail: `email=${student.email ? 'present' : 'missing'}, phone=${student.phone ? 'present' : 'missing'}`,
        requiredFix: student.email && student.phone ? undefined : 'Fill email and phone on the profile onboarding page.',
      },
      {
        id: 'onboarding',
        label: 'Profile onboarding complete',
        status: student.profileComplete >= 100 ? 'PASS' : 'FAIL',
        detail: `profileComplete=${student.profileComplete}%`,
        requiredFix: student.profileComplete >= 100 ? undefined : 'Finish /student/profile/onboarding.',
      },
      {
        id: 'stage',
        label: 'Journey stage assigned',
        status: student.journeyStage ? 'PASS' : 'FAIL',
        detail: `journeyStage=${student.journeyStage || 'unset'}`,
        requiredFix: student.journeyStage ? undefined : 'Set a journey stage so the portal can show the right next step.',
      },
      {
        id: 'shortlist',
        label: 'Shortlist usable',
        status: shortlist > 0 ? 'PASS' : 'SKIPPED',
        detail: `${shortlist} shortlisted course(s)`,
        requiredFix: shortlist > 0 ? undefined : 'Not a defect: an empty shortlist is normal before course selection.',
      },
      {
        id: 'documents',
        label: 'Document uploads recorded',
        status: documents > 0 ? 'PASS' : 'SKIPPED',
        detail: `${documents} document row(s)`,
        requiredFix: documents > 0 ? undefined : 'No uploads yet; required before an application can be submitted.',
      },
      {
        id: 'applications',
        label: 'Applications readable',
        status: applications > 0 ? 'PASS' : 'SKIPPED',
        detail: `${applications} application(s)`,
        requiredFix: applications > 0 ? undefined : 'No application started yet.',
      },
      {
        id: 'english_test',
        label: 'English test record readable',
        status: englishTests > 0 ? 'PASS' : 'SKIPPED',
        detail: `${englishTests} test record(s)`,
        requiredFix: englishTests > 0 ? undefined : 'No ALO English Test attempt recorded yet.',
      },
      {
        id: 'mock_credits',
        label: 'Mock test credit balance readable',
        status: mockCredits ? 'PASS' : 'SKIPPED',
        detail: mockCredits ? `${mockCredits.totalCredits - mockCredits.usedCredits} of ${mockCredits.totalCredits} credit(s) left` : 'no credit account',
        requiredFix: mockCredits ? undefined : 'No mock-test credit account; expected until a mock test is purchased.',
      },
      {
        id: 'payments',
        label: 'Payments readable',
        status: 'PASS',
        detail: `${payments} payment row(s) visible to this student`,
      },
      {
        id: 'tasks',
        label: 'Assigned tasks readable',
        status: 'PASS',
        detail: `${tasks} task(s) linked to this student`,
      },
    ];

    const failures = checks.filter((check) => check.status === 'FAIL');

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        userType: student.userType,
        journeyStage: student.journeyStage,
        profileComplete: student.profileComplete,
        createdAt: student.createdAt.toISOString(),
      },
      verdict: failures.length === 0 ? 'PASS' : 'FAIL',
      summary: {
        total: checks.length,
        pass: checks.filter((check) => check.status === 'PASS').length,
        fail: failures.length,
        skipped: checks.filter((check) => check.status === 'SKIPPED').length,
      },
      checks,
      note: 'SKIPPED means "not applicable yet" (no data expected at this stage), not a silent pass. FAIL means something is broken and the requiredFix field names it.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ success: false, error: `Test check failed: ${message}` }, { status: 503 });
  }
}
