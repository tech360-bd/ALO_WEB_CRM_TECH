'use client';

// ============================================================
// REALTIME NOTIFICATION PROVIDER (spec s86, s54, s85)
// ============================================================
// Bridges the SSE stream into the portal store so notifications arrive without
// the user refreshing.
//
// Why this exists: StudentPortalShell, CounselorPortalShell and CrmAdminShell all
// render a bell from `usePortalStore().notifications`, but nothing ever called the
// store's `setNotifications`. Every one of those bells was therefore permanently
// empty — it showed "No notifications" even when the student had unread items.
// Populating the store here fixes all three shells at once and gives s86 a real
// consumer rather than an unused hook.
//
// Honesty rules:
//   * Only runs for a signed-in session. An anonymous visitor opens no stream.
//   * The connection status is published to the store, so a shell can say
//     "realtime unavailable" instead of implying updates are live (s94).
//   * Incoming items are MERGED with what is already in the store, preserving a
//     locally-marked read state, rather than blindly overwriting it.
//   * Renderless: it owns no layout so it cannot disturb existing screens (s2).
// ============================================================

import * as React from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications';

interface StoreNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function RealtimeNotificationProvider() {
  const token = usePortalStore((state) => state.token);
  const user = usePortalStore((state) => state.user);
  const setNotifications = usePortalStore((state) => state.setNotifications);
  const existing = usePortalStore((state) => state.notifications);

  // A stream is only meaningful for an authenticated session. The route resolves
  // the identity server-side; without a session it would 401 and the hook would
  // sit in a reconnect loop.
  const enabled = Boolean(token) && Boolean(user);

  // Keep the latest store contents available to the merge without making the
  // subscription effect depend on them.
  const existingRef = React.useRef<StoreNotification[]>(existing);
  React.useEffect(() => {
    existingRef.current = existing;
  }, [existing]);

  const { status, notifications } = useRealtimeNotifications({ enabled });

  // Merge live items into the store, newest first, de-duplicated by id.
  React.useEffect(() => {
    if (!enabled) return;
    if (notifications.length === 0) return;

    const byId = new Map<string, StoreNotification>();
    for (const item of existingRef.current) byId.set(item.id, item);

    for (const live of notifications) {
      const previous = byId.get(live.id);
      byId.set(live.id, {
        id: live.id,
        title: live.title,
        message: live.message,
        type: live.type,
        // A locally-marked read flag wins; a redelivery must not resurrect it
        // as unread.
        isRead: previous ? previous.isRead || live.isRead : live.isRead,
        createdAt: live.createdAt,
      });
    }

    const merged = Array.from(byId.values()).sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
    setNotifications(merged.slice(0, 200));
  }, [notifications, enabled, setNotifications]);

  // Publish the transport status so a shell can report an outage honestly
  // instead of showing a bell that silently never updates.
  const setRealtimeStatus = usePortalStore((state) => state.setRealtimeStatus);
  React.useEffect(() => {
    setRealtimeStatus(status);
  }, [status, setRealtimeStatus]);

  return null;
}

export default RealtimeNotificationProvider;
