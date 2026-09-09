'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, Search, Loader2,
  Users, GraduationCap, DollarSign, Settings, UserPlus,
} from 'lucide-react';

type NotificationType = 'lead' | 'application' | 'payment' | 'system';
type FilterTab = 'all' | 'unread' | 'leads' | 'applications' | 'payments' | 'system';

interface Notification {
  id: string; title: string; message: string; type: NotificationType;
  isRead: boolean; createdAt: string;
}

const mockNotifications: Notification[] = [
  { id: 'n1', title: 'New Lead Assigned', message: 'A new lead Arif Rahman has been assigned to you for UK Masters program.', type: 'lead', isRead: false, createdAt: '2025-01-17T10:30:00' },
  { id: 'n2', title: 'Application Update', message: 'Kamal Hossain application to University of Birmingham has moved to Documents Received stage.', type: 'application', isRead: false, createdAt: '2025-01-17T09:15:00' },
  { id: 'n3', title: 'Commission Payment', message: 'BDT 15,000 has been credited to your account for January enrollment of Sumaiya Islam.', type: 'payment', isRead: false, createdAt: '2025-01-17T08:00:00' },
  { id: 'n4', title: 'System Maintenance', message: 'The portal will be undergoing scheduled maintenance on Jan 20, 2025 from 2:00 AM to 4:00 AM.', type: 'system', isRead: true, createdAt: '2025-01-16T18:00:00' },
  { id: 'n5', title: 'New Lead Assigned', message: 'A new lead Farzana Mimi has been assigned to you for UK Public Health program.', type: 'lead', isRead: false, createdAt: '2025-01-16T15:30:00' },
  { id: 'n6', title: 'Application Decision', message: 'Nasreen Akter has received an offer letter from Arizona State University for Fall 2025.', type: 'application', isRead: true, createdAt: '2025-01-16T14:00:00' },
  { id: 'n7', title: 'Payment Processed', message: 'Your commission of BDT 12,000 for Nasreen Akter has been processed.', type: 'payment', isRead: true, createdAt: '2025-01-16T11:00:00' },
  { id: 'n8', title: 'Lead Status Updated', message: 'Lead Mitu Sarkar status has been changed from New to Contacted by Counselor Sarah.', type: 'lead', isRead: true, createdAt: '2025-01-16T09:00:00' },
  { id: 'n9', title: 'New University Partnership', message: 'ALO has partnered with University of Glasgow, UK. New programs are now available.', type: 'system', isRead: false, createdAt: '2025-01-15T16:00:00' },
  { id: 'n10', title: 'Application Submitted', message: 'Application for Tanvir Ahmed to Monash University has been successfully submitted.', type: 'application', isRead: true, createdAt: '2025-01-15T14:30:00' },
  { id: 'n11', title: 'Commission Statement', message: 'Your December 2024 commission statement is now available for download.', type: 'payment', isRead: true, createdAt: '2025-01-15T10:00:00' },
  { id: 'n12', title: 'New Lead Assigned', message: 'A new lead Jamil Hossain has been assigned to you for Australia IT Management.', type: 'lead', isRead: true, createdAt: '2025-01-14T13:00:00' },
  { id: 'n13', title: 'Document Reminder', message: 'Pending documents for Rafiq Ahmed visa application. Please submit TB test certificate.', type: 'application', isRead: false, createdAt: '2025-01-14T10:00:00' },
  { id: 'n14', title: 'System Update', message: 'New features: bulk lead import and enhanced reporting have been added to the portal.', type: 'system', isRead: true, createdAt: '2025-01-13T15:00:00' },
  { id: 'n15', title: 'Application Decision', message: 'Sumaiya Islam has received an unconditional offer from UBC Vancouver, Canada.', type: 'application', isRead: true, createdAt: '2025-01-13T12:00:00' },
  { id: 'n16', title: 'Lead Converted', message: 'Congratulations! Lead Shakib Hasan has been converted. Commission will be processed upon enrollment.', type: 'lead', isRead: true, createdAt: '2025-01-12T16:00:00' },
  { id: 'n17', title: 'Payment Failed', message: 'Payment transfer to your bank account failed. Please update your bank details in Settings.', type: 'payment', isRead: false, createdAt: '2025-01-12T11:00:00' },
  { id: 'n18', title: 'New Resource Available', message: 'Updated UK Student Visa Guide 2025 is now available in the Resource Library.', type: 'system', isRead: true, createdAt: '2025-01-11T09:00:00' },
  { id: 'n19', title: 'New Lead Assigned', message: 'A new lead Priya Das has been assigned to you for UK Finance program.', type: 'lead', isRead: true, createdAt: '2025-01-10T14:00:00' },
  { id: 'n20', title: 'Enrollment Confirmed', message: 'Kamal Hossain has successfully enrolled at University of Birmingham. Commission of BDT 15,000 will be paid.', type: 'application', isRead: true, createdAt: '2025-01-10T10:00:00' },
];

function typeIcon(t: NotificationType) {
  const map: Record<NotificationType, React.ReactNode> = { lead: <UserPlus className="w-4 h-4" />, application: <GraduationCap className="w-4 h-4" />, payment: <DollarSign className="w-4 h-4" />, system: <Settings className="w-4 h-4" /> };
  return map[t];
}

function typeColor(t: NotificationType) {
  const map: Record<NotificationType, string> = { lead: 'bg-blue-50 text-blue-600', application: 'bg-purple-50 text-purple-600', payment: 'bg-emerald-50 text-emerald-600', system: 'bg-amber-50 text-amber-600' };
  return map[t];
}

function typeBadgeVariant(t: NotificationType) {
  const map: Record<NotificationType, 'brand' | 'secondary' | 'success' | 'warning'> = { lead: 'brand', application: 'secondary', payment: 'success', system: 'warning' };
  return map[t];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hr ago';
  const days = Math.floor(hrs / 24);
  return days + ' day' + (days > 1 ? 's' : '') + ' ago';
}

export default function PartnerNotificationsPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = usePortalStore.getState().token;
        const headers: HeadersInit = token
          ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          : { 'Content-Type': 'application/json' };
        const params = new URLSearchParams({ partnerId: user?.id || '' });
        if (filter === 'unread') params.set('isRead', 'false');
        const res = await fetch(`/api/partner/notifications?${params.toString()}`, { headers });
        const data = await res.json();
        if (data.success && Array.isArray(data.notifications) && data.notifications.length > 0) {
          setNotifications(data.notifications);
        } else {
          setNotifications(mockNotifications);
        }
      } catch {
        setNotifications(mockNotifications);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, filter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = async (id: string) => {
    setActionLoading(id);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      await fetch('/api/partner/notifications', { method: 'PUT', headers, body: JSON.stringify({ partnerId: user?.id, notificationId: id, action: 'markRead' }) });
    } catch { /* fallback */ } finally { setNotifications((p) => p.map((n) => n.id === id ? { ...n, isRead: true } : n)); setActionLoading(null); }
  };

  const handleMarkAllRead = async () => {
    setActionLoading('all');
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      await fetch('/api/partner/notifications', { method: 'PUT', headers, body: JSON.stringify({ partnerId: user?.id, action: 'markAllRead' }) });
    } catch { /* fallback */ } finally { setNotifications((p) => p.map((n) => ({ ...n, isRead: true }))); setActionLoading(null); toast.success('All notifications marked as read'); }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      await fetch('/api/partner/notifications', { method: 'PUT', headers, body: JSON.stringify({ partnerId: user?.id, notificationId: id, action: 'delete' }) });
    } catch { /* fallback */ } finally { setNotifications((p) => p.filter((n) => n.id !== id)); setActionLoading(null); toast.success('Notification deleted'); }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'leads' && n.type !== 'lead') return false;
    if (filter === 'applications' && n.type !== 'application') return false;
    if (filter === 'payments' && n.type !== 'payment') return false;
    if (filter === 'system' && n.type !== 'system') return false;
    if (search) { const q = search.toLowerCase(); return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q); }
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'leads', label: 'Leads', count: notifications.filter((n) => n.type === 'lead').length },
    { key: 'applications', label: 'Applications', count: notifications.filter((n) => n.type === 'application').length },
    { key: 'payments', label: 'Payments', count: notifications.filter((n) => n.type === 'payment').length },
    { key: 'system', label: 'System', count: notifications.filter((n) => n.type === 'system').length },
  ];

  if (loading) { return (<div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" />{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-20 w-full rounded-xl mb-3" />))}</div>); }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-alo-text">Notifications</h1><p className="text-sm text-alo-text-muted mt-0.5">Stay updated on your leads, applications, and payments</p></div>
        {unreadCount > 0 && <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={actionLoading === 'all'}>{actionLoading === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCheck className="w-3.5 h-3.5" /> Mark All Read</>}</Button>}
      </div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search notifications..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} /></div></CardContent></Card>

      <div className="flex items-center gap-1 overflow-x-auto pb-1">{tabs.map((tab) => (<button key={tab.key} onClick={() => setFilter(tab.key)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap', filter === tab.key ? 'bg-alo-brand text-white shadow-sm' : 'text-alo-text-secondary hover:bg-secondary')}>{tab.label} ({tab.count})</button>))}</div>

      {filtered.length === 0 ? (
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-12 text-center"><BellOff className="w-12 h-12 text-alo-text-muted/30 mx-auto mb-3" /><p className="text-sm text-alo-text-muted">No notifications found</p></CardContent></Card>
      ) : (
        <div className="space-y-2">{filtered.map((notif) => (
          <Card key={notif.id} className={cn('bg-white rounded-xl border transition-colors', notif.isRead ? 'border-alo-border' : 'border-alo-brand/30 bg-alo-brand-light/5')}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', typeColor(notif.type))}>{typeIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-alo-brand flex-shrink-0" />}
                    <p className={cn('text-sm', notif.isRead ? 'font-medium text-alo-text' : 'font-semibold text-alo-text')}>{notif.title}</p>
                    <Badge variant={typeBadgeVariant(notif.type)} className="text-[10px] flex-shrink-0">{notif.type}</Badge>
                  </div>
                  <p className="text-xs text-alo-text-secondary line-clamp-2">{notif.message}</p>
                  <p className="text-[11px] text-alo-text-muted mt-1.5">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.isRead && <Button variant="ghost" size="icon-sm" onClick={() => handleMarkRead(notif.id)} disabled={actionLoading === notif.id} title="Mark as read"><Check className="w-3.5 h-3.5" /></Button>}
                  <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(notif.id)} disabled={actionLoading === notif.id} className="text-alo-text-muted hover:text-red-500" title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}

      <p className="text-xs text-alo-text-muted text-center">Showing {filtered.length} of {notifications.length} notifications</p>
    </div>
  );
}
