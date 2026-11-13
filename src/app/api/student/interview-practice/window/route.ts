import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';
import {
  canPractise,
  configuredWindowHours,
  createPracticeWindow,
  describePracticeWindow,
} from '@/lib/interview/practice-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Student practice window (spec §38).
 *
 * GET  — the caller's window state, remaining time and practice history count.
 * POST — open the window (pack generated/downloaded) or, with
 *        `{ action: 'restart' }`, restart it only when a previous window has
 *        already expired *and* no extension was granted — the specification
 *        makes extension counselor-controlled, so a student cannot extend
 *        their own access by calling this repeatedly.
 *
 * Nothing here deletes practice records: expiry only stops new sessions.
 */

function applicationKey(value: string | null): string {
  return (value ?? '').trim().slice(0, 191);
}

async function loadWindow(studentId: string, applicationId: string) {
  return db.interviewPracticeWindow.findUnique({
    where: { studentId_applicationId: { studentId, applicationId } },
  });
}

export const GET = withStudentAuth(async (request, auth) => {
  const url = new URL(request.url);
  const applicationId = applicationKey(url.searchParams.get('applicationId'));
  const hours = configuredWindowHours();

  try {
    const [window, sessionCount, completedCount] = await Promise.all([
      loadWindow(auth.studentId, applicationId),
      db.aiInterviewSession.count({ where: { studentId: auth.studentId } }),
      db.aiInterviewSession.count({ where: { studentId: auth.studentId, status: { not: 'in_progress' } } }),
    ]);

    const state = describePracticeWindow(window, new Date(), hours);

    return NextResponse.json(
      {
        window: state,
        windowHours: hours,
        canPractise: canPractise(state),
        practice: { sessions: sessionCount, completed: completedCount },
        extensionPolicy:
          'When the window lapses, ask your counselor for an extension. Your practice history is kept either way.',
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Practice window is temporarily unavailable.' }, { status: 503 });
  }
});

export const POST = withStudentAuth(async (request, auth) => {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const action = typeof input.action === 'string' ? input.action : 'start';
  const applicationId = applicationKey(typeof input.applicationId === 'string' ? input.applicationId : null);
  const hours = configuredWindowHours();
  const now = new Date();

  if (action !== 'start' && action !== 'restart') {
    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  }

  if (applicationId) {
    const application = await db.application.findFirst({
      where: { id: applicationId, studentId: auth.studentId },
      select: { id: true },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found for this student.' }, { status: 404 });
    }
  }

  try {
    const existing = await loadWindow(auth.studentId, applicationId);
    const current = describePracticeWindow(existing, now, hours);

    if (existing && canPractise(current)) {
      return NextResponse.json(
        {
          success: true,
          alreadyOpen: true,
          window: current,
          windowHours: hours,
          canPractise: true,
          note: 'Your practice window is already open. Opening it again does not add time.',
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }

    if (existing && current.expired) {
      // An extension is counselor-controlled: once one has been granted, a
      // student cannot restart the clock themselves.
      if (current.extended || (existing.extensionCount ?? 0) > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your practice window has ended. Ask your counselor for an extension — your practice history is kept.',
            window: current,
            canPractise: false,
          },
          { status: 403, headers: { 'Cache-Control': 'no-store' } },
        );
      }
      if (action !== 'restart') {
        return NextResponse.json(
          {
            success: false,
            error: 'Your practice window has ended. Ask your counselor for an extension, or restart a fresh window.',
            window: current,
            canPractise: false,
            canRestart: true,
          },
          { status: 409, headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }

    const created = createPracticeWindow(now, hours);
    const saved = await db.interviewPracticeWindow.upsert({
      where: { studentId_applicationId: { studentId: auth.studentId, applicationId } },
      create: {
        studentId: auth.studentId,
        applicationId,
        startsAt: created.startsAt,
        expiresAt: created.expiresAt,
        packGeneratedAt: now,
      },
      update: {
        startsAt: created.startsAt,
        expiresAt: created.expiresAt,
        packGeneratedAt: now,
        closedAt: null,
        closedBy: '',
      },
    });

    const state = describePracticeWindow(saved, now, hours);
    return NextResponse.json(
      {
        success: true,
        restarted: Boolean(existing),
        window: state,
        windowHours: hours,
        canPractise: canPractise(state),
      },
      { status: existing ? 200 : 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Your practice window could not be opened.' }, { status: 503 });
  }
});
