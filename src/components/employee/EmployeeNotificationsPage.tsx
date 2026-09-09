'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Bell, Mail, FileText, Clock, Shield, CheckCheck,
  Trash2, Search, Inbox, Filter,
  CheckCircle, MessageSquare, AlertTriangle, CalendarDays,
} from 'lucide-react';

type NotificationType = 'task' | 'message' | 'application' | 'deadline' | 'system';
type NotificationGroup = 'Today' | 'Yesterday' | 'This Week' | 'Earlier';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timeAgo: string;
  isRead: boolean;
  group: NotificationGroup;
  actionUrl?: string;
}

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  task: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  message: { icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  application: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  deadline: { icon: Clock, color: 'text-red-600', bg: 'bg-red-100' },
  system: { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-100' },
};

const initialNotifications: Notification[] = [
  // Today
  { id: 'n1', type: 'message', title: 'New message from Rahim Uddin', description: 'Sent via WhatsApp: "Thanks for the university list!"', timeAgo: '10 min ago', isRead: false, group: 'Today' },
  { id: 'n2', type: 'task', title: 'Follow-up task assigned', description: 'You have been assigned to follow up with Mim Akhter regarding Germany MS programs.', timeAgo: '32 min ago', isRead: false, group: 'Today' },
  { id: 'n3', type: 'application', title: 'Application submitted successfully', description: 'Fatima Akter\'s application to University of Melbourne has been submitted.', timeAgo: '1h ago', isRead: false, group: 'Today' },
  { id: 'n4', type: 'deadline', title: 'Deadline approaching: UK Jan Intake', description: 'January 2025 UK intake application deadline is in 3 days.', timeAgo: '2h ago', isRead: false, group: 'Today' },
  // Yesterday
  { id: 'n5', type: 'message', title: 'Reply from Fatima Akter', description: '"I will send the bank statement by tomorrow InshaAllah."', timeAgo: 'Yesterday', isRead: true, group: 'Yesterday' },
  { id: 'n6', type: 'system', title: 'System maintenance completed', description: 'The ALO Education platform was updated to version 2.4.1.', timeAgo: 'Yesterday', isRead: true, group: 'Yesterday' },
  { id: 'n7', type: 'task', title: 'Document verification pending', description: 'Lina Tabassum\'s passport copy needs verification before submission.', timeAgo: 'Yesterday', isRead: false, group: 'Yesterday' },
  { id: 'n8', type: 'application', title: 'CAS received for Tanvir Ahmed', description: 'University of Leeds has issued the CAS for Tanvir\'s MSc program.', timeAgo: 'Yesterday', isRead: true, group: 'Yesterday' },
  // This Week
  { id: 'n9', type: 'deadline', title: 'Scholarship deadline reminder', description: 'Australia Awards scholarship deadline is January 18th. 3 applications pending.', timeAgo: '2 days ago', isRead: true, group: 'This Week' },
  { id: 'n10', type: 'task', title: 'Weekly report due', description: 'Your weekly counseling report is due by Friday 5:00 PM.', timeAgo: '3 days ago', isRead: true, group: 'This Week' },
  { id: 'n11', type: 'message', title: 'New inquiry from Nusrat Jahan', description: 'Interested in studying Data Science in the USA. GRE score: 320.', timeAgo: '3 days ago', isRead: true, group: 'This Week' },
  { id: 'n12', type: 'application', title: 'Offer letter received', description: 'Imran Hossain received an offer from Seneca College for Diploma in Business Management.', timeAgo: '4 days ago', isRead: true, group: 'This Week' },
  // Earlier
  { id: 'n13', type: 'system', title: 'New policy update', description: 'Employee leave policy has been updated. Please review the changes in the HR portal.', timeAgo: '1 week ago', isRead: true, group: 'Earlier' },
  { id: 'n14', type: 'deadline', title: 'Monthly targets completed', description: 'Congratulations! You have met your monthly lead conversion target for December.', timeAgo: '2 weeks ago', isRead: true, group: 'Earlier' },
  { id: 'n15', type: 'task', title: 'Performance review scheduled', description: 'Your Q4 performance review is scheduled for January 30th at 2:00 PM.', timeAgo: '2 weeks ago', isRead: true, group: 'Earlier' },
];

const groups: NotificationGroup[] = ['Today', 'Yesterday', 'This Week', 'Earlier'];

export default function EmployeeNotificationsPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'tasks' | 'messages'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setNotifications(initialNotifications);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const filteredNotifications = useMemo(() => {
    let list = notifications;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) => n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
      );
    }
    if (filter === 'unread') list = list.filter((n) => !n.isRead);
    if (filter === 'tasks') list = list.filter((n) => n.type === 'task');
    if (filter === 'messages') list = list.filter((n) => n.type === 'message');
    return list;
  }, [notifications, filter, search]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const taskCount = notifications.filter((n) => n.type === 'task').length;
  const messageCount = notifications.filter((n) => n.type === 'message').length;

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification deleted');
  };

  const filterTabs: { key: 'all' | 'unread' | 'tasks' | 'messages'; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'tasks', label: 'Tasks', count: taskCount },
    { key: 'messages', label: 'Messages', count: messageCount },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  const groupedNotifications = groups.map((group) => ({
    group,
    items: filteredNotifications.filter((n) => n.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Notifications</h1>
          <p className="text-sm text-alo-text-muted mt-1">
            Stay updated on your tasks, messages, and alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
            <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {/* Search + Filters */}
      <Card className="rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-alo-page border-alo-border text-sm"
              />
            </div>
            <div className="flex items-center gap-1 bg-alo-page rounded-lg p-0.5">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    filter === tab.key
                      ? 'bg-white shadow-sm text-alo-brand'
                      : 'text-alo-text-muted hover:text-alo-text'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                      filter === tab.key ? 'bg-alo-brand-light text-alo-brand' : 'bg-white text-alo-text-muted'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification groups */}
      <div className="space-y-6">
        {groupedNotifications.map(({ group, items }) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold text-alo-text-muted uppercase tracking-wide">{group}</h2>
              <div className="flex-1 border-t border-alo-border" />
              <span className="text-[11px] text-alo-text-muted">{items.length} notification{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-2">
              {items.map((notif) => {
                const cfg = typeConfig[notif.type];
                const Icon = cfg.icon;
                return (
                  <Card
                    key={notif.id}
                    className={cn(
                      'rounded-xl border border-alo-border transition-all cursor-pointer hover:shadow-sm',
                      !notif.isRead && 'bg-alo-brand-light/30 border-alo-brand/20'
                    )}
                    onClick={() => handleMarkRead(notif.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-alo-brand shrink-0" />
                          )}
                          {notif.isRead && <span className="w-2 h-2 shrink-0" />}
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', cfg.bg)}>
                            <Icon className={cn('w-4 h-4', cfg.color)} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              'text-sm truncate',
                              !notif.isRead ? 'font-semibold text-alo-text' : 'font-medium text-alo-text-secondary'
                            )}>
                              {notif.title}
                            </p>
                            <span className="text-[11px] text-alo-text-muted shrink-0">{notif.timeAgo}</span>
                          </div>
                          <p className="text-xs text-alo-text-secondary mt-0.5 line-clamp-2">{notif.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!notif.isRead && (
                            <Button variant="ghost" size="icon-sm" onClick={() => handleMarkRead(notif.id)} className="text-alo-text-muted">
                              <CheckCheck className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(notif.id)} className="text-alo-text-muted hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}

        {groupedNotifications.length === 0 && (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 text-alo-text-muted/40 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-alo-text">No notifications</h3>
            <p className="text-xs text-alo-text-muted mt-1">
              {filter !== 'all' ? 'No notifications match your current filter' : 'You\'re all caught up!'}
            </p>
            {filter !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => setFilter('all')}
              >
                View all notifications
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
