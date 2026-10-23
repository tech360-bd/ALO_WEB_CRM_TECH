'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell, CheckCircle, Mail, FileText, Clock, Shield, RefreshCw,
  AlertTriangle, BellOff, Info, CheckCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types — mirror GET /api/employee/notifications
// ============================================================

interface NotificationRow {
  id: string;
  studentId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  actionUrl: string;
  createdAt: string;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

// Icons keyed by the `type` the record actually carries. Anything the
// platform has not emitted falls through to a neutral bell.
const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  task: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  message: { icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  application: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  deadline: { icon: Clock, color: 'text-red-600', bg: 'bg-red-100' },
  system: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-100' },
  info: { icon: Bell, color: 'text-[var(--alo-body)]', bg: 'bg-[var(--alo-surface-muted)]' },
};

const DEFAULT_ICON = { icon: Bell, color: 'text-[var(--alo-body)]', bg: 'bg-[var(--alo-surface-muted)]' };

function startOfToday(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

// Buckets derived from each record's own timestamp.
function groupOf(createdAt: string): 'Today' | 'Yesterday' | 'Earlier' | null {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  const todayStart = startOfToday();
  const time = date.getTime();
  if (time >= todayStart) return 'Today';
  if (time >= todayStart - 24 * 60 * 60 * 1000) return 'Yesterday';
  return 'Earlier';
}

const GROUPS = ['Today', 'Yesterday', 'Earlier'] as const;

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const response = await fetch('/api/employee/notifications');
      if (!response.ok) throw new Error(`Could not load notifications (HTTP ${response.status})`);
      const payload = await response.json();
      if (payload?.success === false) throw new Error(payload?.error || 'Notifications are unavailable');
      setNotifications(Array.isArray(payload?.notifications) ? payload.notifications : []);
      setUnreadCount(Number(payload?.unreadCount) || 0);
      setState({ loading: false, error: null });
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load notifications',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (notificationId: string) => {
    setBusy(true);
    try {
      const response = await fetch('/api/employee/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (!response.ok) return;
      await load();
    } catch {
      // Marking one notification read is best-effort; the list still shows
      // its true state on the next load.
    } finally {
      setBusy(false);
    }
  };

  const markAllRead = async () => {
    setBusy(true);
    try {
      const response = await fetch('/api/employee/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!response.ok) return;
      await load();
    } catch {
      // Same reasoning as markRead.
    } finally {
      setBusy(false);
    }
  };

  const visible = useMemo(
    () => notifications.filter((notification) => filter === 'all' || !notification.isRead),
    [notifications, filter],
  );

  const grouped = useMemo(() => {
    const buckets = new Map<string, NotificationRow[]>();
    visible.forEach((notification) => {
      const group = groupOf(notification.createdAt);
      if (!group) return;
      if (!buckets.has(group)) buckets.set(group, []);
      buckets.get(group)!.push(notification);
    });
    return GROUPS.map((group) => ({ group, items: buckets.get(group) || [] }))
      .filter((entry) => entry.items.length > 0);
  }, [visible]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bell className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
              : 'Nothing is unread'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void markAllRead()}
            disabled={busy || unreadCount === 0}
          >
            <CheckCheck className="mr-1 h-4 w-4" />
            Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className={`mr-1 h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {state.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{state.error}</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2"
                onClick={() => void load()}
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {state.loading ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            Loading notifications…
          </CardContent>
        </Card>
      ) : visible.length === 0 && !state.error ? (
        <Card>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
            <BellOff className="h-8 w-8 opacity-30" />
            <p className="text-sm">
              {notifications.length === 0
                ? 'No notification has been raised yet.'
                : 'No unread notification. Everything is up to date.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map(({ group, items }) => (
            <div key={group} className="space-y-2">
              <h2 className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {group}
              </h2>
              <div className="space-y-2">
                {items.map((notification) => {
                  const meta = TYPE_ICONS[notification.type] || DEFAULT_ICON;
                  const Icon = meta.icon;
                  return (
                    <Card
                      key={notification.id}
                      className={cn(
                        'transition-colors',
                        notification.isRead ? 'bg-white' : 'border-primary/40 bg-primary/[0.03]',
                      )}
                    >
                      <CardContent className="flex items-start gap-3 p-4">
                        <span className={cn('rounded-full p-2', meta.bg)}>
                          <Icon className={cn('h-4 w-4', meta.color)} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">
                              {notification.title || 'Untitled notification'}
                            </p>
                            <Badge variant="outline" className="text-[11px]">
                              {notification.type || 'info'}
                            </Badge>
                            {!notification.isRead ? (
                              <Badge className="bg-blue-100 text-blue-700 text-[11px]">Unread</Badge>
                            ) : null}
                          </div>

                          {notification.message ? (
                            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                              {notification.message}
                            </p>
                          ) : null}

                          <p className="text-muted-foreground mt-1.5 text-[11px]">
                            {formatTimestamp(notification.createdAt)}
                            {notification.studentId ? ` · Student ${notification.studentId}` : ''}
                          </p>

                          {notification.actionUrl ? (
                            <a
                              href={notification.actionUrl}
                              className="mt-2 inline-block text-sm underline underline-offset-2"
                            >
                              Open
                            </a>
                          ) : null}
                        </div>

                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void markRead(notification.id)}
                            disabled={busy}
                          >
                            Mark read
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Grouping is computed from each record&apos;s own timestamp, and the type badge shows
            the type stored on the record. Nothing here is inferred: if the platform has not
            raised a notification, the list is empty.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
