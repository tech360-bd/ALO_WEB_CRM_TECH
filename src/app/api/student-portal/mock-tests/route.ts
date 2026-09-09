import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/mock-tests
// Returns available mock tests + student credit balance
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (_req, auth) => {
    try {
      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      // Get available mock tests
      const mockTests = await db.mockTest.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      // Get student's credit balance
      let credits = { totalCredits: 0, usedCredits: 0, available: 0 };
      try {
        const creditRecord = await db.mockTestCredit.findFirst({
          where: { studentId: profile.id },
        });
        if (creditRecord) {
          credits = {
            totalCredits: creditRecord.totalCredits,
            usedCredits: creditRecord.usedCredits,
            available: creditRecord.totalCredits - creditRecord.usedCredits,
          };
        }
      } catch {
        // MockTestCredit table may not exist yet
        credits = { totalCredits: 3, usedCredits: 0, available: 3 };
      }

      // Get recent test sessions (TestSession has no @relation to TestResult)
      let recentSessions: unknown[] = [];
      try {
        const sessions = await db.testSession.findMany({
          where: { studentId: profile.id },
          orderBy: { startedAt: 'desc' },
          take: 10,
        });

        // Enrich with results manually
        const sessionIds = sessions.map(s => s.id);
        const results = sessionIds.length > 0
          ? await db.testResult.findMany({
              where: { sessionId: { in: sessionIds } },
            })
          : [];
        const resultMap = Object.fromEntries(results.map(r => [r.sessionId, r]));
        recentSessions = sessions.map(s => ({ ...s, result: resultMap[s.id] || null }));
      } catch {
        // TestSession table may not exist yet
        recentSessions = [];
      }

      return NextResponse.json({
        success: true,
        data: {
          mockTests,
          credits,
          recentSessions,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch mock tests';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/mock-tests
// Start a new test session
// Body: { testId, testType }
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { testId, testType } = body;

      if (!testId || !testType) {
        return NextResponse.json(
          { success: false, error: 'testId and testType are required.' },
          { status: 400 }
        );
      }

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      // Check credits (gracefully handle if table doesn't exist)
      try {
        const creditRecord = await db.mockTestCredit.findFirst({
          where: { studentId: profile.id },
        });

        if (creditRecord) {
          const available = creditRecord.totalCredits - creditRecord.usedCredits;
          if (available <= 0) {
            return NextResponse.json(
              { success: false, error: 'No test credits remaining. Please purchase more credits.' },
              { status: 400 }
            );
          }

          // Deduct a credit
          await db.mockTestCredit.updateMany({
            where: { studentId: profile.id },
            data: { usedCredits: { increment: 1 } },
          });
        }
      } catch {
        // If no credit record exists, allow the test (free tier)
      }

      // Create test session
      const session = await db.testSession.create({
        data: {
          studentId: profile.id,
          testId,
          testType,
          status: 'in_progress',
          duration: 0,
        },
      });

      // Audit log
      await logAuditAction(auth, 'MOCK_TEST_STARTED', 'TestSession', session.id, {
        testId,
        testType,
      });

      return NextResponse.json({ success: true, data: session }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start test session';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
