'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Search, Send, MailOpen, Clock, Reply, ArrowLeft, Inbox,
  RefreshCw, AlertTriangle, Flag, MessageCircle, Globe, Smartphone,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
// Mirrors /api/crm/inbox, which returns CommunicationThread rows.
// There is no sender email address or message body on that model, so the
// list shows the stored preview rather than a reconstructed email.
interface InboxThread {
  id: string;
  threadCode: string;
  studentId: string;
  channel: string;
  subject: string;
  intent: string;
  priority: string;
  assignedToName: string;
  status: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadCount: number;
  isAiHandled: boolean;
  needsHumanTakeover: boolean;
  slaStatus: string;
}

const CHANNEL_META: Record<string, { label: string; icon: React.ElementType }> = {
  email: { label: 'Email', icon: Inbox },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  sms: { label: 'SMS', icon: Smartphone },
  web: { label: 'Web chat', icon: Globe },
  chat: { label: 'Chat', icon: MessageCircle },
};

function channelMeta(value: string) {
  const key = (value || '').toLowerCase();
  return CHANNEL_META[key] ?? { label: value || 'Unknown channel', icon: Globe };
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]' },
  escalated: { label: 'Escalated', className: 'bg-red-100 text-red-700' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
  closed: { label: 'Closed', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]' },
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
};

function statusMeta(value: string) {
  const key = (value || '').toLowerCase();
  return STATUS_META[key] ?? { label: value || 'Unknown', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]' };
}

function formatTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

type FilterTab = 'all' | 'unread' | 'open' | 'escalated';

export default function CrmInboxPage() {
  const { toast } = useToast();
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<{ totalUnread: number; openCount: number; escalatedCount: number }>({
    totalUnread: 0, openCount: 0, escalatedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<InboxThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (activeTab === 'unread') params.set('unreadOnly', 'true');
      if (activeTab === 'open') params.set('status', 'open');
      if (activeTab === 'escalated') params.set('status', 'escalated');

      const response = await fetch(`/api/crm/inbox?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Inbox threads could not be loaded.');
      }
      const rows: InboxThread[] = Array.isArray(result.data) ? result.data : [];
      setThreads(rows);
      setTotal(result.total ?? rows.length);
      if (result.meta) {
        setMeta({
          totalUnread: result.meta.totalUnread ?? 0,
          openCount: result.meta.openCount ?? 0,
          escalatedCount: result.meta.escalatedCount ?? 0,
        });
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Inbox threads could not be loaded.');
      setThreads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    const handle = setTimeout(() => { void loadThreads(); }, searchQuery ? 350 : 0);
    return () => clearTimeout(handle);
  }, [loadThreads, searchQuery]);

  const handleSelect = (thread: InboxThread) => {
    setSelected(thread);
    setReplyText('');
    if (thread.unreadCount > 0) {
      // Optimistically reflect the read state, then persist it.
      setSelected({ ...thread, unreadCount: 0 });
      void persist({ id: thread.id, action: 'mark_read', markRead: true });
    }
  };

  const persist = async (body: Record<string, unknown>) => {
    setBusyId(String(body.id));
    try {
      const response = await fetch('/api/crm/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'The thread could not be updated.');
      }
      await loadThreads();
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReply = async () => {
    if (!selected) return;
    if (!replyText.trim()) {
      toast({ title: 'Reply is empty', description: 'Write a message before sending.', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const response = await fetch('/api/crm/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selected.id, content: replyText.trim() }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'The reply could not be sent.');
      }
      toast({ title: 'Reply sent', description: 'Your reply was recorded on the thread.' });
      setReplyText('');
      await loadThreads();
    } catch (error) {
      toast({
        title: 'Reply failed',
        description: error instanceof Error ? error.message : 'Please retry.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--alo-brand)] rounded-lg">
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--alo-text)]">Inbox</h1>
            <p className="text-sm text-[var(--alo-text-muted)]">
              {total} thread{total === 1 ? '' : 's'} · {meta.totalUnread} unread · {meta.escalatedCount} escalated
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => void loadThreads()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as FilterTab)}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <TabsList>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
            <TabsTrigger value="open" className="text-xs">Open</TabsTrigger>
            <TabsTrigger value="escalated" className="text-xs">Escalated</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--alo-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threads..."
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>
      </Tabs>

      {loadError && (
        <Card className="shadow-sm border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-[var(--alo-text)]">Inbox is unavailable</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{loadError}</p>
                <Button size="sm" variant="outline" className="mt-2 h-7 " onClick={() => void loadThreads()}>
                  Try again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Thread list */}
        <Card className="shadow-sm lg:col-span-2 flex flex-col min-h-0">
          <CardContent className="p-0 overflow-y-auto max-h-[32rem]">
            {loading && !loadError ? (
              <div className="p-3 space-y-2" aria-busy="true" aria-live="polite">
                {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-[var(--alo-surface-muted)]" />)}
              </div>
            ) : threads.length === 0 && !loadError ? (
              <div className="p-10 text-center">
                <MailOpen className="h-8 w-8 mx-auto text-[var(--alo-placeholder)]" />
                <p className="text-sm font-semibold text-[var(--alo-text)] mt-2">No threads</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1">
                  {total === 0
                    ? 'No conversations have been recorded yet. Threads appear once a channel is connected.'
                    : 'No threads match this filter.'}
                </p>
              </div>
            ) : (
              threads.map((thread) => {
                const cMeta = channelMeta(thread.channel);
                const sMeta = statusMeta(thread.status);
                const CIcon = cMeta.icon;
                const isSelected = selected?.id === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleSelect(thread)}
                    className={`w-full text-left p-3 border-b hover:bg-[var(--alo-page)] transition-colors ${isSelected ? 'bg-[var(--alo-brand-pale)]/70 border-l-2 border-l-blue-600' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {thread.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-[var(--alo-brand)] shrink-0" aria-label="unread" />}
                          <span className={`text-sm truncate ${thread.unreadCount > 0 ? 'font-semibold text-[var(--alo-text)]' : 'font-medium text-[var(--alo-body)]'}`}>
                            {thread.subject || thread.threadCode || 'Untitled thread'}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--alo-text-muted)] mt-0.5 line-clamp-2">
                          {thread.lastMessagePreview || 'No message preview stored.'}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <Badge variant="outline" className="text-[11px] font-normal">
                            <CIcon className="h-2.5 w-2.5 mr-0.5" />{cMeta.label}
                          </Badge>
                          <Badge className={`text-[11px] ${sMeta.className}`}>{sMeta.label}</Badge>
                          {thread.needsHumanTakeover && (
                            <Badge className="text-[11px] bg-amber-100 text-amber-700">
                              <Flag className="h-2.5 w-2.5 mr-0.5" />Needs human
                            </Badge>
                          )}
                          {thread.isAiHandled && (
                            <Badge variant="muted" className="text-[11px]">AI handled</Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-[var(--alo-text-muted)] shrink-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{formatTime(thread.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Detail */}
        <Card className="shadow-sm lg:col-span-3 flex flex-col min-h-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {selected ? (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6 lg:hidden" onClick={() => setSelected(null)}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="truncate">{selected.subject || selected.threadCode || 'Thread'}</span>
                </>
              ) : 'Conversation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <Inbox className="h-8 w-8 text-[var(--alo-placeholder)]" />
                <p className="text-sm text-[var(--alo-text-muted)] mt-2">Select a thread to read the conversation.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)]/60 p-3 text-xs text-[var(--alo-body)] space-y-1">
                  <p><span className="text-[var(--alo-text-muted)]">Thread:</span> {selected.threadCode || selected.id}</p>
                  <p><span className="text-[var(--alo-text-muted)]">Student ref:</span> {selected.studentId || '—'}</p>
                  <p><span className="text-[var(--alo-text-muted)]">Channel:</span> {channelMeta(selected.channel).label}</p>
                  <p><span className="text-[var(--alo-text-muted)]">Assigned to:</span> {selected.assignedToName || 'Unassigned'}</p>
                  <p><span className="text-[var(--alo-text-muted)]">Intent:</span> {selected.intent || '—'}</p>
                  <p><span className="text-[var(--alo-text-muted)]">SLA:</span> {selected.slaStatus || 'none'}</p>
                </div>

                <div className="rounded-lg border border-[var(--alo-border)] p-3">
                  <p className="text-[11px] text-[var(--alo-text-muted)] mb-1">Latest message preview</p>
                  <p className="text-sm text-[var(--alo-text)] whitespace-pre-wrap">
                    {selected.lastMessagePreview || 'No message content stored for this thread.'}
                  </p>
                </div>

                <div className="mt-auto space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply…"
                    rows={3}
                    className="text-sm resize-y"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[var(--alo-text-muted)]">
                      Replies are recorded against the thread. Delivery depends on the connected channel.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => void handleReply()}
                      disabled={sending || !replyText.trim()}
                      className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)]"
                    >
                      <Reply className="h-3.5 w-3.5 mr-1" />
                      {sending ? 'Sending…' : 'Send reply'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {busyId && <span className="sr-only" role="status">Updating thread…</span>}
      <p className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1.5">
        <Send className="h-3 w-3" />
        Thread data comes from stored communication records. Sender email addresses and full message bodies are not exposed here.
      </p>
    </div>
  );
}
