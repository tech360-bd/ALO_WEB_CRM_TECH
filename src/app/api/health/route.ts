import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Readiness: a running process without a working database must not receive traffic. */
export async function GET() {
  const startedAt = Date.now();
  let connected = false;
  const modules: Record<string, boolean> = {};
  try {
    await db.$queryRaw`SELECT 1`;
    connected = true;
    const checks = {
      universities: () => db.crmUniversity.findFirst({ select: { id: true, universityId: true, verificationStatus: true, publicationStatus: true } }),
      courses: () => db.crmCourse.findFirst({ select: { id: true, courseId: true, verificationStatus: true, publicationStatus: true } }),
      students: () => db.student.findFirst({ select: { id: true, userId: true, studentId: true, status: true } }),
      staff: () => db.portalUser.findFirst({ select: { id: true, status: true, emailVerified: true } }),
      documents: () => db.studentDocument.findFirst({ select: { id: true, storagePath: true, mimeType: true, fileHash: true } }),
      content: () => db.cmsManagedContent.findFirst({ select: { id: true, status: true } }),
    };
    await Promise.all(Object.entries(checks).map(async ([name, check]) => {
      try { await check(); modules[name] = true; } catch { modules[name] = false; }
    }));
  } catch {
    // Public health responses deliberately omit database exceptions/credentials.
    console.error('[readiness] Database probe failed');
  }
  const ready = connected && Object.values(modules).every(Boolean);
  return NextResponse.json({
    status: ready ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    database: { connected },
    modules,
    responseTime_ms: Date.now() - startedAt,
  }, {
    status: ready ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
