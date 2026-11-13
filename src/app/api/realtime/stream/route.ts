import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { evaluateFlag } from '@/lib/feature-flags';
import {
  clampPollInterval,
  fetchNewNotifications,
  heartbeatFrame,
  toServerSentEvent,
} from '@/lib/realtime';

// ============================================================
// GET /api/realtime/stream — Server-Sent Events (spec s86)
//
// Streams the caller's own notifications as they are written, so application
// status changes, messages and deadlines appear without a manual refresh.
// Cursor-based: reconnecting with `since` resumes without replaying history.
//
// Authenticated manually (not via withAuth) because a stream is not a JSON
// NextResponse. It still fails closed: no session -> 401, flag off -> 404 with
// NOT_CONFIGURED rather than an empty stream that looks healthy.
// ============================================================

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Streams are long-lived; do not let the platform buffer or time them out early.
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const flag = await evaluateFlag('REALTIME_UPDATES', { userId: auth.userId, roles: auth.roles });
  if (!flag.enabled) {
    return NextResponse.json(
      {
        success: false,
        status: 'NOT_CONFIGURED',
        reason: flag.reason,
        error: 'Realtime updates are disabled. Enable the REALTIME_UPDATES feature flag.',
      },
      { status: 404 },
    );
  }

  const url = new URL(request.url);

  // Cheap availability probe used by the client hook to distinguish "realtime
  // is not configured" (404) from a transient network drop, without opening a
  // stream. Keeps reconnect backoff honest instead of guesswork.
  if (url.searchParams.get('probe') === '1') {
    return NextResponse.json({
      success: true,
      status: 'CONFIGURED',
      reason: flag.reason,
      serverTime: new Date().toISOString(),
    });
  }

  const pollMs = clampPollInterval(url.searchParams.get('pollMs'));
  const sinceParam = url.searchParams.get('since');
  const parsedSince = sinceParam ? new Date(sinceParam) : null;
  let cursor = parsedSince && !Number.isNaN(parsedSince.getTime()) ? parsedSince : new Date();

  // Resolve the canonical student id for student sessions so StudentNotification
  // rows are included. Resolved from the session, never from a query parameter.
  let studentId: string | null = null;
  if (auth.userType === 'STUDENT') {
    const student = await db.student
      .findFirst({ where: { userId: auth.userId }, select: { id: true } })
      .catch(() => null);
    studentId = student?.id ?? null;
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      send(
        toServerSentEvent('ready', {
          userId: auth.userId,
          userType: auth.userType,
          pollMs,
          cursor: cursor.toISOString(),
          studentLinked: Boolean(studentId),
        }),
      );

      const timer = setInterval(async () => {
        if (closed) return;
        try {
          const notifications = await fetchNewNotifications({
            portalUserId: auth.userId,
            studentId,
            since: cursor,
            limit: 50,
          });
          for (const notification of notifications) {
            send(toServerSentEvent('notification', notification, notification.id));
            const created = new Date(notification.createdAt);
            if (created > cursor) cursor = created;
          }
          if (notifications.length > 0) {
            send(toServerSentEvent('cursor', { cursor: cursor.toISOString() }));
          } else {
            send(heartbeatFrame());
          }
        } catch (error) {
          // Report the failure to the client instead of going silently quiet:
          // a stream that looks alive but delivers nothing is worse than an
          // explicit error the UI can surface (spec s91).
          send(
            toServerSentEvent('error', {
              message: error instanceof Error ? error.message : 'poll failed',
              at: new Date().toISOString(),
            }),
          );
        }
      }, pollMs);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      });
    },
    cancel() {
      closed = true;
    },
  });

  return new NextResponse(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      // Disable proxy buffering so events reach the browser immediately.
      'x-accel-buffering': 'no',
    },
  });
}
