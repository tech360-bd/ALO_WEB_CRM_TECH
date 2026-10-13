'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  MessageCircle,
  Bell,
  Filter,
  AlertTriangle,
  Inbox as InboxIcon,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePortalData } from '@/hooks/use-portal-data';
import { PageHeader } from '@/components/alo/portal/PortalPage';
import { StatCard } from '@/components/alo/portal/StatCard';
import { SlaCountdown } from '@/components/alo/crm/SlaCountdown';
import { getSession } from '@/lib/session';
import { cn } from '@/lib/utils';

interface CommunicationThread {
  id: string;
  threadCode: string;
  subject: string | null;
  channel: string;
  leadId: string | null;
  studentId: string | null;
  partnerId: string | null;
  applicationId: string | null;
  assignedTo: string | null;
  assignedCounselorId: string | null;
  status: string;
  lastMessageAt: string | null;
  slaDueAt: string | null;
  escalationLevel: number;
  isAiHandled: boolean;
  createdAt: string;
  updatedAt: string;
  escalation: {
    currentLevel: number;
    level1EscalatedAt: string | null;
    level2EscalatedAt: string | null;
    level3EscalatedAt: string | null;
  } | null;
}

interface ThreadsResponse {
  threads: CommunicationThread[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const channelMeta: Record<string, { Icon: typeof Mail; color: string }> = {
  whatsapp: {
    Icon: MessageSquare,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  email: { Icon: Mail, color: 'bg-blue-50 text-[#0057B8] border-blue-100' },
  sms: { Icon: Phone, color: 'bg-amber-50 text-amber-700 border-amber-100' },
  webchat: {
    Icon: MessageCircle,
    color: 'bg-purple-50 text-purple-700 border-purple-100',
  },
  facebook: {
    Icon: MessageSquare,
    color: 'bg-blue-50 text-[#0057B8] border-blue-100',
  },
  instagram: {
    Icon: MessageSquare,
    color: 'bg-pink-50 text-pink-700 border-pink-100',
  },
  messenger: {
    Icon: MessageSquare,
    color: 'bg-blue-50 text-[#0057B8] border-blue-100',
  },
  consultation: {
    Icon: MessageCircle,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

const statusMeta: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-blue-50 text-[#0057B8] border-blue-100' },
  waiting: {
    label: 'Waiting',
    color: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  resolved: {
    label: 'Resolved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  escalated: {
    label: 'Escalated',
    color: 'bg-red-50 text-red-700 border-red-100',
  },
};

export default function UnifiedInboxPage() {
  const session = getSession();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const params = useMemo(() => {
    const p: Record<string, string | number | boolean> = { limit: 100 };
    if (filterStatus !== 'all') p.status = filterStatus;
    if (filterChannel !== 'all') p.channel = filterChannel;
    if (overdueOnly) p.overdue = true;
    return p;
  }, [filterStatus, filterChannel, overdueOnly]);

  const { data, loading } = usePortalData<ThreadsResponse>({
    endpoint: '/api/communication-threads',
    params,
  });

  const threads = data?.threads ?? [];

  const filteredThreads = useMemo(() => {
    if (!debouncedSearch) return threads;
    const q = debouncedSearch.toLowerCase();
    return threads.filter(
      (t) =>
        (t.threadCode || '').toLowerCase().includes(q) ||
        (t.subject || '').toLowerCase().includes(q) ||
        (t.channel || '').toLowerCase().includes(q) ||
        (t.studentId || '').toLowerCase().includes(q) ||
        (t.leadId || '').toLowerCase().includes(q)
    );
  }, [threads, debouncedSearch]);

  const stats = useMemo(() => {
    const total = threads.length;
    const overdue = threads.filter(
      (t) =>
        t.slaDueAt &&
        new Date(t.slaDueAt) < new Date() &&
        ['open', 'waiting', 'escalated'].includes(t.status)
    ).length;
    const escalated = threads.filter((t) => t.status === 'escalated').length;
    const resolved = threads.filter((t) => t.status === 'resolved').length;
    return { total, overdue, escalated, resolved };
  }, [threads]);

  return (
    <div className="min-h-screen flex flex-col">
      <PageHeader
        title="Unified Inbox"
        description="Single command-center view across every channel — WhatsApp, Email, SMS, Webchat, Social. Each row shows live SLA countdown."
        action={
          <Button
            variant={overdueOnly ? 'default' : 'outline'}
            className={
              overdueOnly
                ? 'bg-[#E8501A] hover:bg-[#c44216] text-white'
                : 'border-slate-200'
            }
            onClick={() => setOverdueOnly((v) => !v)}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {overdueOnly ? 'Showing overdue' : 'Overdue only'}
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active threads" value={stats.total} icon={InboxIcon} accent="blue" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="orange" />
        <StatCard label="Escalated" value={stats.escalated} icon={Bell} accent="amber" />
        <StatCard label="Resolved (24h)" value={stats.resolved} icon={MessageCircle} accent="green" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by code, subject, channel, IDs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] h-10">
              <Filter className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="escalated">Escalated</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-[140px] h-10">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="webchat">Webchat</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="messenger">Messenger</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 rounded bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <InboxIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            No conversations found.
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y divide-slate-100">
              {filteredThreads.map((t) => {
                const channel = channelMeta[t.channel] || channelMeta.webchat;
                const ChannelIcon = channel.Icon;
                const status = statusMeta[t.status] || statusMeta.open;
                const initials = (t.threadCode || t.channel || '??')
                  .slice(-2)
                  .toUpperCase();
                const isOverdue =
                  t.slaDueAt &&
                  new Date(t.slaDueAt) < new Date() &&
                  ['open', 'waiting', 'escalated'].includes(t.status);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors',
                      isOverdue && 'bg-red-50/40'
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {t.subject || t.threadCode}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {t.lastMessageAt
                            ? new Date(t.lastMessageAt).toLocaleString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                day: '2-digit',
                                month: 'short',
                              })
                            : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <Badge
                          className={cn(
                            'border text-[10px] gap-1 px-1.5 py-0',
                            channel.color
                          )}
                        >
                          <ChannelIcon className="h-2.5 w-2.5" />
                          <span className="capitalize">{t.channel}</span>
                        </Badge>
                        <Badge
                          className={cn(
                            'border text-[10px] px-1.5 py-0',
                            status.color
                          )}
                        >
                          <span className="capitalize">{status.label}</span>
                        </Badge>
                        {t.escalation?.currentLevel &&
                          t.escalation.currentLevel > 0 && (
                            <Badge className="bg-red-500 text-white border-0 text-[10px] gap-0.5 px-1.5 py-0">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              SLA L{t.escalation.currentLevel}
                            </Badge>
                          )}
                        {t.isAiHandled && (
                          <Badge className="bg-purple-50 text-purple-700 border-purple-100 text-[10px] px-1.5 py-0">
                            AI-handled
                          </Badge>
                        )}
                        <span className="text-slate-400 truncate">
                          {t.threadCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* SLA countdown — visible per row */}
                        <SlaCountdown
                          dueAt={t.slaDueAt}
                          createdAt={t.createdAt}
                        />
                        {t.assignedTo && (
                          <Badge className="bg-blue-50 text-[#0057B8] border-0 text-[10px] px-1.5 py-0">
                            Assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {!session && (
        <p className="text-xs text-slate-400 text-center">
          Sign in to view your inbox.
        </p>
      )}

      <footer className="mt-auto py-4 text-center text-xs text-slate-400 border-t border-slate-100">
        ALO Education CRM · Unified Communication Inbox ·{' '}
        <span className="text-[#0057B8] font-semibold">Counselor Workspace</span>
      </footer>
    </div>
  );
}
