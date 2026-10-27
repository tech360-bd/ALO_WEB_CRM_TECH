// GET /api/super-admin/security/logins
//
// Login forensics from the two real sources:
//   • `login_attempts` — every attempt, success or failure
//   • `login_security` — the device/session register (IP, browser, OS, status)
//
// A failed-attempt spike per IP is computed from real rows. No score, risk or
// threat number is invented: when a source is empty the response says so.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { unavailable, safeRows } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const FAILED_ATTEMPT_THRESHOLD = 5;

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const hours = Math.min(Math.max(Number(url.searchParams.get('hours') || 24), 1), 720);
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  try {
    const [attempts, activeSessions, securityRows, totalAttempts] = await Promise.all([
      safeRows<{ id: string; email: string; ipAddress: string; success: boolean; failureReason: string; createdAt: Date; userAgent: string; userId: string | null }>(
        () => db.loginAttempt.findMany({
          where: { createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: { id: true, email: true, ipAddress: true, success: true, failureReason: true, createdAt: true, userAgent: true, userId: true },
        }),
      ),
      safeRows<{ id: string; userId: string; ipAddress: string; deviceName: string; userAgent: string; createdAt: Date; expiresAt: Date }>(
        () => db.portalSession.findMany({
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: { id: true, userId: true, ipAddress: true, deviceName: true, userAgent: true, createdAt: true, expiresAt: true },
        }),
      ),
      safeRows<{ id: string; userId: string; ipAddress: string; browser: string | null; operatingSystem: string | null; location: string | null; loginTime: Date; sessionStatus: string; failedAttempts: number }>(
        () => db.loginSecurity.findMany({
          where: { loginTime: { gte: since } },
          orderBy: { loginTime: 'desc' },
          take: 200,
          select: { id: true, userId: true, ipAddress: true, browser: true, operatingSystem: true, location: true, loginTime: true, sessionStatus: true, failedAttempts: true },
        }),
      ),
      db.loginAttempt.count({ where: { createdAt: { gte: since } } }),
    ]);

    const failures = attempts.filter((row) => !row.success);
    const failuresByIp = new Map<string, number>();
    for (const row of failures) {
      const ip = row.ipAddress || 'unknown';
      failuresByIp.set(ip, (failuresByIp.get(ip) || 0) + 1);
    }
    const spikes = [...failuresByIp.entries()]
      .filter(([, count]) => count >= FAILED_ATTEMPT_THRESHOLD)
      .sort((a, b) => b[1] - a[1])
      .map(([ipAddress, count]) => ({ ipAddress, failedAttempts: count }));

    return NextResponse.json({
      success: true,
      windowHours: hours,
      since: since.toISOString(),
      totals: {
        attempts: totalAttempts,
        sampled: attempts.length,
        failures: failures.length,
        activeSessions: activeSessions.length,
        registeredDevices: securityRows.length,
      },
      bruteForceSuspicion: {
        threshold: FAILED_ATTEMPT_THRESHOLD,
        windowHours: hours,
        suspiciousIps: spikes,
        note: spikes.length
          ? `${spikes.length} IP address(es) exceeded ${FAILED_ATTEMPT_THRESHOLD} failed attempts inside ${hours}h.`
          : `No IP address exceeded ${FAILED_ATTEMPT_THRESHOLD} failed attempts in this window.`,
      },
      recentAttempts: attempts.map((row) => ({
        id: row.id,
        email: row.email,
        ipAddress: row.ipAddress,
        success: row.success,
        failureReason: row.failureReason,
        when: row.createdAt.toISOString(),
        userAgent: row.userAgent,
        userId: row.userId,
      })),
      activeSessions: activeSessions.map((row) => ({
        id: row.id,
        userId: row.userId,
        ipAddress: row.ipAddress,
        deviceName: row.deviceName,
        userAgent: row.userAgent,
        startedAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      })),
      deviceRegister: securityRows.map((row) => ({
        id: row.id,
        userId: row.userId,
        ipAddress: row.ipAddress,
        browser: row.browser,
        operatingSystem: row.operatingSystem,
        location: row.location,
        loginTime: row.loginTime.toISOString(),
        sessionStatus: row.sessionStatus,
        failedAttempts: row.failedAttempts,
      })),
    });
  } catch (error) {
    return unavailable('super-admin/security/logins', error);
  }
}

export const GET = withAuth(handleGet);
