// ============================================================
// ALO EDUCATION — Student Portal Auth Middleware
// Separate from PortalSession (employees/admins).
// Students authenticate via OTP or password → StudentSession.
// ============================================================

import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export interface StudentAuthContext {
  studentId: string;     // DB id (cuid)
  studentCode: string;   // AE-2026XXXXXX permanent ID
  email: string;
  phone: string;
  name: string;
  sessionId: string;
  sessionToken: string;
}

// ============================================================
// Generate a unique AE-YYYYXXXXXX student code
// ============================================================
export async function generateStudentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AE-${year}`;

  // Count students this year to get sequential number
  const count = await db.student.count({
    where: {
      studentId: { startsWith: prefix },
    },
  });

  const sequential = String(count + 1).padStart(6, '0');
  return `${prefix}${sequential}`;
}

// ============================================================
// Create a student session (24-hour expiry)
// ============================================================
export async function createStudentSession(
  studentId: string,
  meta?: { ipAddress?: string; userAgent?: string; deviceInfo?: string }
): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.studentSession.create({
    data: {
      studentId,
      token,
      ipAddress: meta?.ipAddress || '',
      userAgent: meta?.userAgent || '',
      deviceInfo: meta?.deviceInfo || '',
      expiresAt,
    },
  });

  return token;
}

// ============================================================
// Revoke all active sessions for a student (logout all devices)
// ============================================================
export async function revokeAllStudentSessions(studentId: string, reason = 'logout'): Promise<void> {
  await db.studentSession.updateMany({
    where: { studentId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

// ============================================================
// Authenticate a student request via Bearer token
// ============================================================
function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') || '';
  const pair = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

export async function authenticateStudentRequest(
  request: Request
): Promise<StudentAuthContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const token = bearerToken && bearerToken !== 'null' && bearerToken !== 'undefined'
    ? bearerToken
    : cookieValue(request, 'alo_student_session');

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required. Please login to your student portal.' },
      { status: 401 }
    );
  }

  const session = await db.studentSession.findUnique({
    where: { token },
  });

  if (!session) {
    return NextResponse.json(
      { success: false, error: 'Invalid session. Please login again.' },
      { status: 401 }
    );
  }

  if (session.revokedAt) {
    return NextResponse.json(
      { success: false, error: 'Session revoked. Please login again.' },
      { status: 401 }
    );
  }

  if (new Date() > session.expiresAt) {
    return NextResponse.json(
      { success: false, error: 'Session expired. Please login again.' },
      { status: 401 }
    );
  }

  const student = await db.student.findUnique({
    where: { id: session.studentId },
  });

  if (!student) {
    return NextResponse.json(
      { success: false, error: 'Student account not found.' },
      { status: 401 }
    );
  }

  if (student.suspended) {
    return NextResponse.json(
      { success: false, error: 'Your account has been suspended. Please contact ALO Education.' },
      { status: 403 }
    );
  }

  // Touch lastActiveAt
  await db.studentSession.update({
    where: { id: session.id },
    data: { createdAt: new Date() },
  });

  return {
    studentId: student.id,
    studentCode: student.studentId, // studentId field = the AE-YYYYXXXXXX code
    email: student.email,
    phone: student.phone,
    name: student.name,
    sessionId: session.id,
    sessionToken: token,
  };
}

// ============================================================
// withStudentAuth — API route HOC for student-protected routes
// ============================================================
type StudentAuthHandler = (
  request: Request,
  auth: StudentAuthContext
) => Promise<NextResponse>;

export function withStudentAuth(handler: StudentAuthHandler) {
  return async (request: Request, context?: { params?: Record<string, string> }): Promise<NextResponse> => {
    const authResult = await authenticateStudentRequest(request);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}

// ============================================================
// Ownership guard — student can ONLY access their own data
// ============================================================
export function guardStudentOwnership(
  auth: StudentAuthContext,
  resourceStudentId: string
): NextResponse | null {
  if (auth.studentId !== resourceStudentId) {
    return NextResponse.json(
      { success: false, error: 'Access denied. You can only access your own data.' },
      { status: 403 }
    );
  }
  return null;
}

// ============================================================
// Log student action to StudentEvent
// ============================================================
export async function logStudentEvent(
  studentId: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
  options?: {
    applicationId?: string;
    actorId?: string;
    actorName?: string;
    actorType?: string;
    ipAddress?: string;
    channel?: string;
  }
): Promise<void> {
  try {
    await db.studentEvent.create({
      data: {
        studentId,
        eventType,
        payload: JSON.stringify({ ...eventData, applicationId: options?.applicationId, actorId: options?.actorId || studentId, actorType: options?.actorType || 'student', actorName: options?.actorName || '', ipAddress: options?.ipAddress, channel: options?.channel || 'portal' }),
      },
    });
  } catch (err) {
    console.error('Failed to log student event:', err);
  }
}
