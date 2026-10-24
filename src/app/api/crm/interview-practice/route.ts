import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCanonicalCounselor, counselorStudentScope } from '@/lib/counselor/student-access';
import { canViewUccB2B } from '@/lib/ucc/document-access';
import {
  configuredWindowHours,
  describePracticeWindow,
  extendPracticeWindow,
  MAX_PRACTICE_WINDOW_HOURS,
} from '@/lib/interview/practice-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Counselor control over interview practice windows (spec §38, §41, §76).
 *
 * GET  — windows for students inside the caller's authorized scope, with the
 *        derived status and remaining time.
 * POST — extend or close one window. Extension is the counselor-controlled path
 *        the specification requires once a 72-hour window lapses; the reason is
 *        mandatory and stored, and practice records are never removed.
 */

export const GET = async (request: Request) => {
  const auth = await requireCanonicalCounselor(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const scope = counselorStudentScope(auth);
    const students = await db.student.findMany({
      where: scope,
      select: { id: true, studentId: true, name: true },
      take: 500,
    });
    if (students.length === 0) {
      return NextResponse.json({ windows: [], windowHours: configuredWindowHours() }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    let visible = students;
    if (!canViewUccB2B(auth)) {
      const confidential = await db.application.findMany({
        where: { studentId: { in: students.map((student) => student.id) }, isB2bConfidential: true },
        select: { studentId: true },
      });
      const hidden = new Set(confidential.map((row) => row.studentId));
      visible = students.filter((student) => !hidden.has(student.id));
    }

    const byId = new Map(visible.map((student) => [student.id, student]));
    const windows = await db.interviewPracticeWindow.findMany({
      where: { studentId: { in: visible.map((student) => student.id) } },
      orderBy: { expiresAt: 'asc' },
      take: 500,
    });

    const hours = configuredWindowHours();
    const now = new Date();

    return NextResponse.json(
      {
        windowHours: hours,
        windows: windows.map((window) => ({
          id: window.id,
          applicationId: window.applicationId,
          student: byId.get(window.studentId)
            ? { studentId: byId.get(window.studentId)!.studentId, name: byId.get(window.studentId)!.name }
            : null,
          studentRecordId: window.studentId,
          extensionCount: window.extensionCount,
          extensionReason: window.extensionReason,
          extendedBy: window.extendedBy,
          state: describePracticeWindow(window, now, hours),
        })),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Practice windows are temporarily unavailable.' }, { status: 503 });
  }
};

export const POST = async (request: Request) => {
  const auth = await requireCanonicalCounselor(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const windowId = typeof input.windowId === 'string' ? input.windowId.trim() : '';
  const action = typeof input.action === 'string' ? input.action : 'extend';
  const reason = typeof input.reason === 'string' ? input.reason.trim() : '';

  if (!windowId) return NextResponse.json({ error: 'windowId is required.' }, { status: 400 });
  if (action !== 'extend' && action !== 'close') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  }
  if (reason.length < 8 || reason.length > 500) {
    return NextResponse.json({ error: 'A reason of 8–500 characters is required.' }, { status: 400 });
  }

  const extraHours = Number(input.hours);
  if (action === 'extend' && (!Number.isFinite(extraHours) || extraHours <= 0 || extraHours > MAX_PRACTICE_WINDOW_HOURS)) {
    return NextResponse.json({ error: `hours must be between 1 and ${MAX_PRACTICE_WINDOW_HOURS}.` }, { status: 400 });
  }

  try {
    const window = await db.interviewPracticeWindow.findUnique({ where: { id: windowId } });
    if (!window) return NextResponse.json({ error: 'Practice window not found.' }, { status: 404 });

    // Re-check the window's student against the caller's scope on the server.
    const scope = counselorStudentScope(auth);
    const student = await db.student.findFirst({
      where: { AND: [{ id: window.studentId }, scope] },
      select: { id: true, studentId: true, name: true },
    });
    if (!student) return NextResponse.json({ error: 'Practice window not found.' }, { status: 404 });

    const now = new Date();

    if (action === 'close') {
      const saved = await db.interviewPracticeWindow.update({
        where: { id: windowId },
        data: { closedAt: now, closedBy: auth.userId, extensionReason: reason },
      });
      return NextResponse.json(
        { success: true, window: describePracticeWindow(saved, now, configuredWindowHours()), note: 'Practice closed. Recorded sessions are untouched.' },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { extendedUntil, extraHours: granted } = extendPracticeWindow(window, now, extraHours);
    const saved = await db.interviewPracticeWindow.update({
      where: { id: windowId },
      data: {
        extendedUntil,
        extensionCount: { increment: 1 },
        extendedBy: auth.userId,
        extensionReason: reason,
        closedAt: null,
        closedBy: '',
      },
    });

    return NextResponse.json(
      {
        success: true,
        grantedHours: granted,
        student: { studentId: student.studentId, name: student.name },
        window: describePracticeWindow(saved, now, configuredWindowHours()),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'The practice window could not be updated.' }, { status: 503 });
  }
};
