// ============================================================
// ALO EDUCATION — REALTIME UPDATE LAYER (spec s86)
// ============================================================
// Server-Sent Events over the EXISTING notification tables. No new transport,
// no websocket server to operate, and nothing that requires the client to
// refresh: application status, messages, tasks and notifications arrive as
// they are written.
//
// Design decisions:
//  * SSE rather than WebSocket. Next.js App Router streams SSE natively on the
//    Node runtime, it survives proxies, and it needs no extra infrastructure.
//    (The `examples/websocket` folder in this repo is a reference sample and is
//    not part of the application runtime.)
//  * Poll the database on a bounded interval. The platform already has Redis
//    available (ioredis) but must run correctly without it, so the source of
//    truth stays the database and the interval is the only tuning knob.
//  * Cursor-based. The client sends `since` and only unseen rows are emitted,
//    so reconnects never replay the whole history and never drop a notification.
//  * Scope-correct. A student sees student notifications; a portal user sees
//    their own portal notifications. Cross-tenant leakage is impossible because
//    the query is keyed on the resolved session identity.
// ============================================================

import { db } from '@/lib/db';

export interface RealtimeNotification {
  id: string;
  source: 'portal' | 'student';
  title: string;
  message: string;
  type: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface RealtimeQuery {
  /** Portal user id (PortalNotification.userId). */
  portalUserId?: string | null;
  /** Canonical student id (StudentNotification.studentId). */
  studentId?: string | null;
  /** Only rows created after this cursor. */
  since?: Date | null;
  limit?: number;
}

/**
 * Fetch notifications newer than the cursor for exactly one identity.
 * Both sources are read; an empty identity on one side simply yields nothing.
 */
export async function fetchNewNotifications(
  query: RealtimeQuery,
): Promise<RealtimeNotification[]> {
  const limit = Math.max(1, Math.min(query.limit ?? 50, 200));
  const since = query.since ?? new Date(Date.now() - 24 * 3_600_000);

  const [portalRows, studentRows] = await Promise.all([
    query.portalUserId
      ? db.portalNotification.findMany({
          where: { userId: query.portalUserId, createdAt: { gt: since } },
          orderBy: { createdAt: 'asc' },
          take: limit,
          select: { id: true, title: true, message: true, type: true, actionUrl: true, isRead: true, createdAt: true },
        })
      : Promise.resolve([]),
    query.studentId
      ? db.studentNotification.findMany({
          where: { studentId: query.studentId, createdAt: { gt: since } },
          orderBy: { createdAt: 'asc' },
          take: limit,
          select: { id: true, title: true, message: true, type: true, actionUrl: true, isRead: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  const mapped: RealtimeNotification[] = [
    ...portalRows.map((row) => ({
      id: row.id,
      source: 'portal' as const,
      title: row.title,
      message: row.message,
      type: row.type,
      actionUrl: row.actionUrl || '',
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    })),
    ...studentRows.map((row) => ({
      id: row.id,
      source: 'student' as const,
      title: row.title,
      message: row.message,
      type: row.type,
      actionUrl: row.actionUrl || '',
      isRead: row.isRead,
      createdAt: row.createdAt.toISOString(),
    })),
  ];

  return mapped.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Format a notification as an SSE frame. */
export function toServerSentEvent(event: string, data: unknown, id?: string): string {
  const lines = [`event: ${event}`];
  if (id) lines.push(`id: ${id}`);
  const payload = JSON.stringify(data);
  // SSE data lines must not contain raw newlines.
  for (const line of payload.split('\n')) {
    lines.push(`data: ${line}`);
  }
  return `${lines.join('\n')}\n\n`;
}

/** Heartbeat comment frame — keeps proxies from closing an idle stream. */
export function heartbeatFrame(): string {
  return `: heartbeat ${new Date().toISOString()}\n\n`;
}

export const REALTIME_DEFAULT_POLL_MS = 15_000;
export const REALTIME_MIN_POLL_MS = 5_000;
export const REALTIME_MAX_POLL_MS = 120_000;

export function clampPollInterval(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return REALTIME_DEFAULT_POLL_MS;
  return Math.min(REALTIME_MAX_POLL_MS, Math.max(REALTIME_MIN_POLL_MS, Math.round(parsed)));
}
