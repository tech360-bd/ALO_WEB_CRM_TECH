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
  application: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  document: { icon: FileUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  visa: { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  message: { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50' },
  deadline: { icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
  scholarship: { icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  payment: { icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
  system: { icon: Settings, color: 'text-slate-500', bg: 'bg-slate-50' },
};

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */
const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'application',
    title: 'Conditional offer received from University of Aberdeen',
    description:
      'Review your offer conditions and respond before the deadline.',
    timeAgo: '2 hours ago',
    isRead: false,
    group: 'today',
    navigateTo: 'student-applications',
  },
  {
    id: 'n2',
    type: 'document',
    title: 'IELTS certificate expiring soon',
    description:
      'Your IELTS certificate expires in 30 days. Plan a retake.',
    timeAgo: '5 hours ago',
    isRead: false,
    group: 'today',
    navigateTo: 'student-documents',
  },
  {
    id: 'n3',
    type: 'document',
    title: 'Document rejected: HSC Transcript',
    description:
      'Please upload a clear scan. Current image is blurry.',
    timeAgo: '1 day ago',
    isRead: false,
    group: 'yesterday',
    navigateTo: 'student-documents',
  },
  {
    id: 'n4',
    type: 'visa',
    title: 'Visa checklist updated',
    description:
      'TB test certificate added to your checklist.',
    timeAgo: '1 day ago',
    isRead: true,
    group: 'yesterday',
    navigateTo: 'student-visa',
  },
  {
    id: 'n5',
    type: 'message',
    title: 'New message from Sarah Khan',
    description:
      '"Hi Rahim, I\'ve reviewed your SOP draft..."',
    timeAgo: '2 days ago',
    isRead: true,
    group: 'this-week',
    navigateTo: 'student-messages',
  },
  {
    id: 'n6',
    type: 'scholarship',
    title: 'Scholarship deadline approaching',
    description:
      'Chevening Scholarship deadline is Nov 5.',
    timeAgo: '3 days ago',
    isRead: true,
    group: 'this-week',
    navigateTo: 'student-scholarships',
  },
  {
    id: 'n7',
    type: 'visa',
    title: 'Interview practice available',
    description:
      'Book your visa mock interview practice session.',
    timeAgo: '3 days ago',
    isRead: false,
    group: 'this-week',
    navigateTo: 'student-appointments',
  },
  {
    id: 'n8',
    type: 'application',
    title: 'Application submitted to University of Leeds',
    description:
      'Your application has been submitted successfully.',
    timeAgo: '5 days ago',
    isRead: true,
    group: 'this-week',
    navigateTo: 'student-applications',
  },
  {
    id: 'n9',
    type: 'payment',
    title: 'Payment receipt uploaded',
    description:
      'Your deposit payment receipt has been received.',
    timeAgo: '1 week ago',
    isRead: true,
    group: 'earlier',
    navigateTo: 'student-payments',
  },
  {
    id: 'n10',
    type: 'system',
    title: 'Welcome to ALO Education',
    description:
      'Complete your profile to get personalized course recommendations.',
    timeAgo: '2 weeks ago',
    isRead: true,
    group: 'earlier',
    navigateTo: 'student-profile',
  },
];

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
        'relative border transition-colors hover:border-blue-200 hover:shadow-sm cursor-pointer',
        !notification.isRead && 'border-l-4 border-l-blue-500 bg-blue-50/30'
      )}
      onClick={() => onNavigate(notification.navigateTo)}
    >
      <CardContent className="flex items-start gap-3 p-4">
        {/* Unread dot */}
        {!notification.isRead && (
          <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
            <span className="block size-2.5 rounded-full bg-blue-500" />
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
                'text-sm font-medium leading-snug text-slate-900',
                !notification.isRead && 'font-semibold'
              )}
            >
              {notification.title}
            </h4>
            {!notification.isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-7 px-2 text-xs text-slate-500 hover:text-blue-600"
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
          <p className="mt-1 text-sm text-slate-600 line-clamp-2">
            {notification.description}
          </p>
          <p className="mt-1.5 text-xs text-slate-400">{notification.timeAgo}</p>
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
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Load notifications from API
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/student-portal/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data && j.data.length > 0) {
          const now = new Date();
          const mapped = j.data.map((n: Record<string, unknown>) => {
            const created = new Date(n.createdAt as string);
            const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
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
          setNotifications(mapped);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

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
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-blue-600 text-white hover:bg-blue-700 px-2.5 py-0.5 text-xs font-semibold">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-blue-600"
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
                className="text-xs px-2.5 py-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span className="ml-1 text-[10px] opacity-70">({tabCounts[tab.key]})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Single content slot renders all groups */}
        <TabsContent value={activeTab} className="mt-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCheck className="size-12 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No notifications</p>
                <p className="text-xs text-slate-400 mt-1">
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
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
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