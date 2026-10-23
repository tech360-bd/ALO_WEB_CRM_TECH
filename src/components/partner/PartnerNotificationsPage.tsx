'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Bell, BellOff, Check, CheckCheck, Trash2, Search, Loader2, GraduationCap, DollarSign, Settings, UserPlus, RefreshCw } from 'lucide-react';

type NotificationType = 'lead' | 'application' | 'payment' | 'system';
type FilterTab = 'all' | 'unread' | 'leads' | 'applications' | 'payments' | 'system';
interface Notification { id: string; title: string; message: string; type: NotificationType; isRead: boolean; createdAt: string }

function normalizeType(value: string): NotificationType {
  const type = value.toLowerCase();
  if (type.includes('lead') || type.includes('referral')) return 'lead';
  if (type.includes('application') || type.includes('student')) return 'application';
  if (type.includes('payment') || type.includes('commission') || type.includes('finance')) return 'payment';
  return 'system';
}
function typeIcon(type: NotificationType) {
  const icons = { lead: UserPlus, application: GraduationCap, payment: DollarSign, system: Settings };
  const Icon = icons[type];
  return <Icon className="w-4 h-4" />;
}
function typeColor(type: NotificationType) {
  return { lead: 'bg-blue-50 text-blue-600', application: 'bg-purple-50 text-purple-600', payment: 'bg-emerald-50 text-emerald-600', system: 'bg-amber-50 text-amber-600' }[type];
}
function typeBadgeVariant(type: NotificationType) {
  return { lead: 'brand', application: 'secondary', payment: 'success', system: 'warning' }[type] as 'brand' | 'secondary' | 'success' | 'warning';
}
function timeAgo(dateString: string) {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return 'Date not recorded';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function PartnerNotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      const response = await fetch(`/api/partner/notifications?${params}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.error || `Could not load notifications (HTTP ${response.status})`);
      }
      setNotifications(payload.data.map((item: any): Notification => ({
        id: String(item.id || ''),
        title: String(item.title || 'Notification'),
        message: String(item.message || ''),
        type: normalizeType(String(item.type || 'system')),
        isRead: Boolean(item.isRead),
        createdAt: String(item.createdAt || ''),
      })));
      setTotal(Number(payload.pagination?.total || 0));
      setTotalPages(Math.max(1, Number(payload.pagination?.totalPages || 1)));
      setUnreadTotal(Number(payload.unreadCount || 0));
    } catch (caught) {
      setNotifications([]);
      setTotal(0);
      setUnreadTotal(0);
      setTotalPages(1);
      setError(caught instanceof Error ? caught.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const handleAction = async (id: string, action: 'markRead' | 'delete') => {
    setActionLoading(id);
    try {
      const response = await fetch('/api/partner/notifications', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Notification action failed.');
      setNotifications((current) => action === 'delete'
        ? current.filter((notification) => notification.id !== id)
        : current.map((notification) => notification.id === id ? { ...notification, isRead: true } : notification));
      if (action === 'delete') { setTotal((current) => Math.max(0, current - 1)); toast.success('Notification deleted.'); }
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Notification action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading('all');
    try {
      const response = await fetch('/api/partner/notifications?markAll=true', { method: 'PUT', credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Could not mark notifications as read.');
      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
      setUnreadTotal(0);
      toast.success(`${Number(payload.data?.markedCount || 0)} notifications marked as read.`);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not mark notifications as read.');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = notifications.filter((notification) => {
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'leads' && notification.type !== 'lead') return false;
    if (filter === 'applications' && notification.type !== 'application') return false;
    if (filter === 'payments' && notification.type !== 'payment') return false;
    if (filter === 'system' && notification.type !== 'system') return false;
    if (!search) return true;
    const query = search.toLowerCase();
    return notification.title.toLowerCase().includes(query) || notification.message.toLowerCase().includes(query);
  });

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: total }, { key: 'unread', label: 'Unread', count: unreadTotal },
    { key: 'leads', label: 'Leads' }, { key: 'applications', label: 'Applications' }, { key: 'payments', label: 'Payments' }, { key: 'system', label: 'System' },
  ];

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" />{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)}</div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Notifications</h1><p className="text-sm text-alo-text-muted mt-0.5">Account notifications stored for your signed-in partner user</p></div>{unreadTotal > 0 && <Button variant="outline" size="sm" onClick={() => void handleMarkAllRead()} disabled={actionLoading === 'all'}>{actionLoading === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCheck className="w-3.5 h-3.5" />Mark All Read</>}</Button>}</div>

      {error && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-amber-900">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchNotifications()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}
      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search loaded notifications..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div></CardContent></Card>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab.key} onClick={() => setFilter(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', filter === tab.key ? 'bg-alo-brand text-white shadow-sm' : 'text-alo-text-secondary hover:bg-secondary')}>{tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}</button>)}</div>

      {filtered.length === 0 ? <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-12 text-center"><BellOff className="w-12 h-12 text-alo-text-muted/30 mx-auto mb-3" /><p className="text-sm text-alo-text-muted">{error ? 'Notifications could not be loaded.' : 'No notifications match this page and filter.'}</p></CardContent></Card> : <div className="space-y-2">{filtered.map((notification) => <Card key={notification.id} className={cn('bg-white rounded-xl border transition-colors', notification.isRead ? 'border-alo-border' : 'border-alo-brand/30 bg-alo-brand-light/5')}><CardContent className="p-4"><div className="flex items-start gap-3"><div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', typeColor(notification.type))}>{typeIcon(notification.type)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5">{!notification.isRead && <div className="w-2 h-2 rounded-full bg-alo-brand flex-shrink-0" />}<p className="text-sm font-semibold text-alo-text">{notification.title}</p><Badge variant={typeBadgeVariant(notification.type)} className="text-[11px] flex-shrink-0">{notification.type}</Badge></div><p className="text-xs text-alo-text-secondary line-clamp-2">{notification.message}</p><p className="text-[11px] text-alo-text-muted mt-1.5">{timeAgo(notification.createdAt)}</p></div><div className="flex items-center gap-1 flex-shrink-0">{!notification.isRead && <Button variant="ghost" size="icon-sm" onClick={() => void handleAction(notification.id, 'markRead')} disabled={actionLoading === notification.id} title="Mark as read"><Check className="w-3.5 h-3.5" /></Button>}<Button variant="ghost" size="icon-sm" onClick={() => void handleAction(notification.id, 'delete')} disabled={actionLoading === notification.id} className="text-alo-text-muted hover:text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button></div></div></CardContent></Card>)}</div>}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-text-muted"><p>Showing {filtered.length} of {notifications.length} notifications on page {page} · {total} total</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button><span>{page} / {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</Button></div></div>
    </div>
  );
}
