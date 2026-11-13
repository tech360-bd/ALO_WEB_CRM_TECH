'use client';

// ============================================================
// ALO EDUCATION — useRealtimeNotifications (spec s86, s84)
// ============================================================
// Client hook for the SSE stream at /api/realtime/stream.
//
// Behaviour:
//  * Cursor-based resume — reconnects with the last seen timestamp so a
//    dropped connection neither replays history nor loses a notification.
//  * Exponential backoff on failure, capped, so a disabled flag or an outage
//    cannot turn into a request storm from every open browser tab.
//  * Honest status — `status` distinguishes CONNECTED / RECONNECTING /
//    NOT_CONFIGURED / ERROR so the UI can show "realtime unavailable" instead
//    of pretending updates are live (spec s94).
//  * Relative URL only. The browser must never dial a hardcoded host; the
//    request goes to the same origin that served the app.
// ============================================================

import * as React from 'react';

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'not_configured' | 'error';

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

export interface UseRealtimeOptions {
  /** Polling interval requested from the server (clamped server-side). */
  pollMs?: number;
  /** Disable the stream entirely (e.g. on a page that shows no notifications). */
  enabled?: boolean;
  /** Maximum notifications retained in memory. */
  maxItems?: number;
  onNotification?: (notification: RealtimeNotification) => void;
}

const MIN_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 60_000;

export function useRealtimeNotifications(options: UseRealtimeOptions = {}) {
  const { pollMs = 15_000, enabled = true, maxItems = 100, onNotification } = options;

  const [status, setStatus] = React.useState<RealtimeStatus>('idle');
  const [notifications, setNotifications] = React.useState<RealtimeNotification[]>([]);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [unseen, setUnseen] = React.useState(0);

  const cursorRef = React.useRef<string>(new Date().toISOString());
  const attemptsRef = React.useRef(0);
  const sourceRef = React.useRef<EventSource | null>(null);
  const retryTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onNotificationRef = React.useRef(onNotification);

  // Keep the callback ref fresh without re-subscribing on every render.
  React.useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  React.useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setStatus('idle');
      return;
    }

    let disposed = false;

    const clearRetry = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    const close = () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
    };

    const scheduleRetry = () => {
      if (disposed) return;
      clearRetry();
      const backoff = Math.min(
        MAX_BACKOFF_MS,
        MIN_BACKOFF_MS * Math.pow(2, Math.min(attemptsRef.current, 5)),
      );
      attemptsRef.current += 1;
      setStatus('reconnecting');
      retryTimerRef.current = setTimeout(connect, backoff);
    };

    const connect = () => {
      if (disposed) return;
      close();
      setStatus(attemptsRef.current === 0 ? 'connecting' : 'reconnecting');

      // Same-origin relative URL: never a hardcoded host.
      const url = `/api/realtime/stream?pollMs=${encodeURIComponent(String(pollMs))}&since=${encodeURIComponent(cursorRef.current)}`;
      const source = new EventSource(url, { withCredentials: true });
      sourceRef.current = source;

      source.addEventListener('ready', () => {
        attemptsRef.current = 0;
        setStatus('connected');
        setLastError(null);
      });

      source.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notification = JSON.parse(event.data) as RealtimeNotification;
          if (notification.createdAt) cursorRef.current = notification.createdAt;
          setNotifications((previous) => {
            if (previous.some((item) => item.id === notification.id)) return previous;
            return [notification, ...previous].slice(0, maxItems);
          });
          if (!notification.isRead) setUnseen((count) => count + 1);
          onNotificationRef.current?.(notification);
        } catch {
          // Ignore a malformed frame rather than tearing down the stream.
        }
      });

      source.addEventListener('cursor', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as { cursor?: string };
          if (payload.cursor) cursorRef.current = payload.cursor;
        } catch {
          // Ignore.
        }
      });

      source.addEventListener('error', (event: MessageEvent) => {
        // A structured `error` EVENT from our route (poll failure) carries data;
        // a transport error from EventSource does not. Handle both.
        const data = (event as MessageEvent).data;
        if (typeof data === 'string' && data.trim()) {
          try {
            const parsed = JSON.parse(data) as { message?: string };
            setLastError(parsed.message || 'stream error');
          } catch {
            setLastError(String(data));
          }
          return;
        }
        // Transport-level failure: EventSource itself retries, but we also want
        // to detect NOT_CONFIGURED (the route answers 404 JSON, not a stream).
        if (source.readyState === EventSource.CLOSED) {
          probeAvailability().then((available) => {
            if (disposed) return;
            if (!available) {
              setStatus('not_configured');
              setLastError('Realtime updates are not configured for this deployment.');
              return;
            }
            setLastError('Realtime connection lost.');
            scheduleRetry();
          });
        }
      });
    };

    /**
     * Distinguish "flag disabled / route absent" from a transient network drop.
     * A single HEAD-style probe is enough and avoids a reconnect storm.
     */
    const probeAvailability = async (): Promise<boolean> => {
      try {
        const response = await fetch('/api/realtime/stream?probe=1', {
          method: 'GET',
          headers: { accept: 'application/json' },
          credentials: 'same-origin',
        });
        if (response.status === 404) return false;
        // Any stream/other response means the endpoint exists.
        await response.body?.cancel().catch(() => undefined);
        return true;
      } catch {
        return true;
      }
    };

    connect();

    return () => {
      disposed = true;
      clearRetry();
      close();
    };
  }, [enabled, pollMs, maxItems]);

  const markSeen = React.useCallback(() => setUnseen(0), []);

  const clear = React.useCallback(() => {
    setNotifications([]);
    setUnseen(0);
  }, []);

  return { status, notifications, unseen, lastError, markSeen, clear };
}

export default useRealtimeNotifications;
