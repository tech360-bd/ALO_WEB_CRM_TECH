'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  FileUp,
  Shield,
  MessageSquare,
  Clock,
  Award,
  CreditCard,
  Settings,
  Check,
  CheckCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */
type NotificationType =
  | 'application'
  | 'document'
  | 'visa'
  | 'message'
  | 'deadline'
  | 'scholarship'
  | 'payment'
  | 'system';

type NotificationGroup = 'today' | 'yesterday' | 'this-week' | 'earlier';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  group: NotificationGroup;
  navigateTo: string;
}

/* ================================================================== */
/*  ICON & COLOR MAP                                                   */
/* ================================================================== */
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  application: { icon: FileText, color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]' },
  document: { icon: FileUp, color: 'text-crm-warning-text', bg: 'bg-crm-warning-bg' },
  visa: { icon: Shield, color: 'text-[var(--alo-brand)]', bg: 'bg-[var(--alo-brand-pale)]' },
  message: { icon: MessageSquare, color: 'text-crm-success-text', bg: 'bg-crm-success-bg' },
  deadline: { icon: Clock, color: 'text-crm-danger-text', bg: 'bg-crm-danger-bg' },
  scholarship: { icon: Award, color: 'text-crm-success-text', bg: 'bg-crm-success-bg' },
  payment: { icon: CreditCard, color: 'text-[var(--alo-cta-active)]', bg: 'bg-[var(--alo-cta-soft)]' },
  system: { icon: Settings, color: 'text-[var(--alo-text-muted)]', bg: 'bg-[var(--alo-page)]' },
};

/* ================================================================== */
/*  NOTE ON THE REMOVED MOCK DATA                                     */
/* ================================================================== */
/* A hard-coded INITIAL_NOTIFICATIONS array of ten invented rows used to live  */
/* here and was used as the component's INITIAL STATE. Because the fetch only   */
/* replaced it when the API returned a non-empty list, every failure path - no   */
/* token, network error, success:false, or a student who genuinely has no        */
/* notifications - left fabricated items such as "Conditional offer received     */
/* from University of Aberdeen" on a real student's screen. That is prohibited   */
/* by spec s92 and is misinformation about the student's own file, so the list   */
/* was deleted rather than left dormant where it could be reused.                */

const GROUP_LABELS: Record<NotificationGroup, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  'this-week': 'This Week',
  earlier: 'Earlier',
};

const GROUP_ORDER: NotificationGroup[] = ['today', 'yesterday', 'this-week', 'earlier'];

/* ================================================================== */
/*  NOTIFICATION CARD                                                  */
/* ================================================================== */
function NotificationCard({
  notification,
  onMarkRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate: (view: string) => void;
}) {
  const { icon: Icon, color, bg } = TYPE_CONFIG[notification.type];

  return (
    <Card
      className={cn(
        'relative border transition-colors hover:border-[var(--alo-border)] hover:shadow-sm cursor-pointer',
        !notification.isRead && 'border-l-4 border-l-blue-500 bg-[var(--alo-brand-pale)]/30'
      )}
      onClick={() => onNavigate(notification.navigateTo)}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Unread dot */}
        {!notification.isRead && (
          <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
            <span className="block size-2.5 rounded-full bg-[var(--alo-brand)]" />
          </span>
        )}

        {/* Icon */}
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bg)}>
          <Icon className={cn('size-4.5', color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium leading-snug text-[var(--alo-text)]',
                !notification.isRead && 'font-semibold'
              )}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <Button
 variant="ghost"
 size="sm"
 className="shrink-0 h-7 px-2 text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)]"
 onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
              >
                <Check className="size-3.5 mr-1" />
                Mark read
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-[var(--alo-body)] line-clamp-2">
            {notification.description}
          </p>
          <p className="mt-1.5 text-xs text-[var(--alo-text-muted)]">{notification.timeAgo}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export function StudentNotifications() {
  const { setView, token } = usePortalStore();
  // Never seed with fabricated notifications (spec s92). This panel tells a
  // student about their OWN offers, documents and deadlines, so invented rows
  // are misinformation, not placeholder styling. Start empty and distinguish
  // three real states: not yet loaded, loaded-and-empty, and failed.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  // Load notifications from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    if (!token) {
      // Without a session we cannot know whether the student has notifications,
      // so say that rather than showing an empty list or invented content.
      if (!cancelled) {
        setNotifications([]);
        setLoading(false);
        setLoadError('You are not signed in, so notifications could not be loaded.');
      }
      return;
    }

    fetch('/api/student-portal/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok || !j?.success) {
          setNotifications([]);
          setLoadError(j?.error || `Could not load notifications (status ${r.status}).`);
          setLoading(false);
          return;
        }
        const rows = Array.isArray(j.data) ? j.data : [];
        const now = new Date();
        const mapped = rows.map((n: Record<string, unknown>) => {
          const created = new Date(n.createdAt as string);
          const diffDays = Number.isFinite(created.getTime())
            ? Math.floor((now.getTime() - created.getTime()) / 86400000)
            : 0;
          let group: NotificationGroup = 'earlier';
          if (diffDays === 0) group = 'today';
          else if (diffDays === 1) group = 'yesterday';
          else if (diffDays <= 7) group = 'this-week';
          return {
            id: n.id as string,
            type: (['application','document','visa','message','deadline','scholarship','payment','system'].includes(n.type as string) ? n.type : 'system') as NotificationType,
            title: (n.title as string) || 'Notification',
            description: (n.message as string) || '',
            timeAgo: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`,
            isRead: !!(n.isRead as boolean),
            group,
            navigateTo: 'student-dashboard',
          };
        });
        // An empty list is a truthful answer and is applied as-is.
        setNotifications(mapped);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setNotifications([]);
        setLoadError(error instanceof Error ? error.message : 'Could not reach the notification service.');
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token, reloadKey]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  /* ---- Filter ---- */
  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications;
    if (activeTab === 'unread') return notifications.filter((n) => !n.isRead);
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  /* ---- Grouped ---- */
  const grouped = useMemo(() => {
    const map: Partial<Record<NotificationGroup, Notification[]>> = {};
    for (const g of GROUP_ORDER) map[g] = [];
    for (const n of filtered) {
      map[n.group]?.push(n);
    }
    return map as Record<NotificationGroup, Notification[]>;
  }, [filtered]);

  /* ---- Actions ---- */
  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (token) {
      try { await fetch('/api/student-portal/notifications', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); } catch {}
    }
    toast.success('Notification marked as read');
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (token) { try { await fetch('/api/student-portal/notifications', { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }); } catch {} }
    toast.success('All notifications marked as read');
  };

  const handleNavigate = (view: string) => {
    setView(view as Parameters<typeof setView>[0]);
  };

  /* ---- Tab counts ---- */
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: notifications.length,
      unread: notifications.filter((n) => !n.isRead).length,
      application: notifications.filter((n) => n.type === 'application').length,
      document: notifications.filter((n) => n.type === 'document').length,
      visa: notifications.filter((n) => n.type === 'visa').length,
      message: notifications.filter((n) => n.type === 'message').length,
      deadline: notifications.filter((n) => n.type === 'deadline').length,
      scholarship: notifications.filter((n) => n.type === 'scholarship').length,
    };
    return counts;
  }, [notifications]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] px-2.5 py-0.5 text-xs font-semibold">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--alo-body)] hover:text-[var(--alo-brand)]"
            onClick={handleMarkAllRead}
          >
            <CheckCheck className="size-4 mr-1.5" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="w-full overflow-x-auto">
          <TabsList className="w-full sm:w-auto flex sm:inline-flex gap-0.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: 'Unread' },
              { key: 'application', label: 'Application' },
              { key: 'document', label: 'Document' },
              { key: 'visa', label: 'Visa' },
              { key: 'message', label: 'Message' },
              { key: 'deadline', label: 'Deadline' },
              { key: 'scholarship', label: 'Scholarship' },
            ].map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="text-xs px-2.5 py-1.5 data-[state=active]:bg-[var(--alo-brand)] data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span className="ml-1 text-[11px] opacity-70">({tabCounts[tab.key]})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Single content slot renders all groups */}
        <TabsContent value={activeTab} className="mt-4">
          {loadError ? (
            /* A failed load must not read as an empty inbox (s91). Claiming
               "You're all caught up" here would tell a student they have no
               offers, deadlines or document alerts when we simply could not
               check. */
            <Card className="border-2 border-crm-warning-border">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="size-12 text-crm-warning-text mb-3" />
                <p className="text-sm font-medium text-[var(--alo-text)]">
                  Notifications could not be loaded
                </p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1 max-w-sm">{loadError}</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-2 max-w-sm">
                  This does not mean you have no notifications. Retry, and contact
                  your counselor if it keeps failing.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setReloadKey((key) => key + 1)}
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCheck className="size-12 text-[var(--alo-placeholder)] mb-3" />
                <p className="text-sm font-medium text-[var(--alo-text-muted)]">No notifications</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1">
                  You&apos;re all caught up!
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-260px)]">
              <div className="space-y-6 pr-2">
                {GROUP_ORDER.map((group) => {
                  const items = grouped[group];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={group}>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--alo-text-muted)] mb-3 px-1">
                        {GROUP_LABELS[group]}
                      </h3>
                      <div className="space-y-2">
                        {items.map((n) => (
                          <NotificationCard
                            key={n.id}
                            notification={n}
                            onMarkRead={handleMarkRead}
                            onNavigate={handleNavigate}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}