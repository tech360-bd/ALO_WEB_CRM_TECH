'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle, Send, RefreshCw, AlertTriangle, Inbox, Clock, Info,
  Search, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================
// Types — mirror GET /api/employee/messages
// ============================================================

// CommunicationThread rows assigned to the signed-in employee
interface Thread {
  id: string;
  threadCode?: string;
  studentId?: string | null;
  channel?: string;
  subject?: string;
  intent?: string;
  priority?: string;
  status?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  isAiHandled?: boolean;
  slaStatus?: string;
}

// CommunicationMessage rows for the selected thread
interface Message {
  id: string;
  threadId: string;
  senderType: string;
  senderName?: string;
  content: string;
  isInternal?: boolean;
  isAiGenerated?: boolean;
  isRead?: boolean;
  createdAt: string;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-red-100 text-red-700 border-red-200' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  normal: { label: 'Normal', cls: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]' },
};

function priorityBadge(priority?: string) {
  const key = (priority || 'normal').toLowerCase();
  const meta = PRIORITY_CONFIG[key] || PRIORITY_CONFIG.normal;
  return <Badge variant="outline" className={`text-[11px] ${meta.cls}`}>{meta.label}</Badge>;
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function EmployeeWhatsAppPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [threadState, setThreadState] = useState<LoadState>({ loading: true, error: null });

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageState, setMessageState] = useState<LoadState>({ loading: false, error: null });

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setThreadState({ loading: true, error: null });
    try {
      const response = await fetch('/api/employee/messages?limit=50');
      if (!response.ok) throw new Error(`Could not load WhatsApp conversations (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'Conversations are unavailable');
      const rows: Thread[] = Array.isArray(payload.data?.threads) ? payload.data.threads : [];
      setThreads(rows.filter((thread) => (thread.channel || '').toLowerCase() === 'whatsapp'));
      setTotalUnread(Number(payload.data?.totalUnread) || 0);
      setThreadState({ loading: false, error: null });
    } catch (error) {
      setThreads([]);
      setThreadState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load WhatsApp conversations',
      });
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    setMessageState({ loading: true, error: null });
    try {
      const response = await fetch(
        `/api/employee/messages?threadId=${encodeURIComponent(threadId)}&limit=50`,
      );
      if (!response.ok) throw new Error(`Could not load this conversation (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'This conversation is unavailable');
      setMessages(Array.isArray(payload.data?.messages) ? payload.data.messages : []);
      setMessageState({ loading: false, error: null });
    } catch (error) {
      setMessages([]);
      setMessageState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load this conversation',
      });
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || null,
    [threads, selectedId],
  );

  const filteredThreads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return threads;
    return threads.filter((thread) =>
      [thread.threadCode, thread.studentId, thread.subject, thread.lastMessagePreview]
        .some((value) => String(value || '').toLowerCase().includes(term)),
    );
  }, [threads, search]);

  // Mark incoming unread messages read once the conversation is open.
  useEffect(() => {
    if (!selectedId || messages.length === 0) return;
    const unreadIncoming = messages
      .filter((message) => message.senderType !== 'counselor' && message.isRead === false)
      .map((message) => message.id);
    if (unreadIncoming.length === 0) return;

    let cancelled = false;
    void (async () => {
      try {
        await fetch('/api/employee/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: selectedId, messageIds: unreadIncoming }),
        });
        if (!cancelled) await loadThreads();
      } catch {
        // Read receipts are best-effort.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedId, messages, loadThreads]);

  const sendMessage = async () => {
    if (!selectedId) return;
    const content = draft.trim();
    if (!content) {
      setActionError('Write a message before sending.');
      return;
    }
    setSending(true);
    setActionError(null);
    try {
      const response = await fetch('/api/employee/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selectedId, content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setActionError(payload?.error || `Could not send the message (HTTP ${response.status})`);
        return;
      }
      setDraft('');
      await loadMessages(selectedId);
      await loadThreads();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not send the message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen space-y-4 bg-alo-page p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-alo-text flex items-center gap-2 text-2xl font-bold">
            <Smartphone className="text-alo-brand h-6 w-6" />
            WhatsApp
          </h1>
          <p className="text-alo-text-muted mt-1 text-sm">
            WhatsApp conversations assigned to you
            {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadThreads()}>
          <RefreshCw className={`mr-1 h-4 w-4 ${threadState.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {actionError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">{actionError}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* ── Conversation list ── */}
        <Card className="lg:col-span-4">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Conversations ({threads.length})</CardTitle>
            <div className="relative">
              <Search className="text-alo-text-muted absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search thread, student or preview"
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {threadState.error && (
              <div className="bg-destructive/10 text-destructive mb-3 flex items-start gap-2 rounded-lg p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{threadState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadThreads()}
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {threadState.loading ? (
              <p className="text-alo-text-muted py-10 text-center text-sm">
                Loading conversations…
              </p>
            ) : filteredThreads.length === 0 && !threadState.error ? (
              <div className="text-alo-text-muted flex flex-col items-center gap-2 py-12 text-center">
                <Inbox className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {threads.length === 0
                    ? 'No WhatsApp conversation is assigned to you yet.'
                    : 'No conversation matches that search.'}
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px] pr-2">
                <div className="space-y-2">
                  {filteredThreads.map((thread) => (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => setSelectedId(thread.id)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
                        selectedId === thread.id ? 'border-alo-brand bg-muted/60' : 'hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-medium">
                          {thread.subject || thread.lastMessagePreview || thread.threadCode || 'Untitled conversation'}
                        </p>
                        {thread.unreadCount && thread.unreadCount > 0 ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 text-[11px]">
                            {thread.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-alo-text-muted mt-1 text-xs">
                        {thread.threadCode || 'No thread code'}
                        {thread.studentId ? ` · Student ${thread.studentId}` : ''}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {priorityBadge(thread.priority)}
                        <span className="text-alo-text-muted flex items-center gap-1 text-[11px]">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(thread.lastMessageAt)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* ── Selected conversation ── */}
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedThread
                ? selectedThread.subject || selectedThread.threadCode || 'Conversation'
                : 'No conversation selected'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedThread ? (
              <p className="text-alo-text-muted py-12 text-center text-sm">
                Select a conversation to read its messages and reply.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-alo-text-muted text-xs">Student</p>
                    <p className="text-sm">{selectedThread.studentId || 'Not linked'}</p>
                  </div>
                  <div>
                    <p className="text-alo-text-muted text-xs">Intent</p>
                    <p className="text-sm">{selectedThread.intent || 'general'}</p>
                  </div>
                  <div>
                    <p className="text-alo-text-muted text-xs">SLA</p>
                    <p className="text-sm">{selectedThread.slaStatus || 'none'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[11px]">
                    Status: {selectedThread.status || 'unknown'}
                  </Badge>
                  {selectedThread.isAiHandled ? (
                    <Badge variant="outline" className="bg-violet-100 text-violet-700 text-[11px]">
                      AI was handling
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px]">Human handling</Badge>
                  )}
                </div>

                {messageState.error && (
                  <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-medium">{messageState.error}</p>
                      <button
                        type="button"
                        className="mt-1 underline underline-offset-2"
                        onClick={() => void loadMessages(selectedThread.id)}
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-h-[400px] space-y-3 overflow-y-auto rounded-lg border p-3">
                  {messageState.loading ? (
                    <p className="text-alo-text-muted py-8 text-center text-sm">
                      Loading messages…
                    </p>
                  ) : messages.length === 0 && !messageState.error ? (
                    <p className="text-alo-text-muted py-8 text-center text-sm">
                      No message has been recorded in this conversation yet.
                    </p>
                  ) : (
                    messages.map((message) => {
                      const mine = message.senderType === 'counselor';
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            'max-w-[85%] rounded-lg border p-3 text-sm',
                            mine ? 'bg-primary/5 ml-auto' : 'bg-muted/40',
                          )}
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium">
                              {message.senderName || (mine ? 'You' : 'Student')}
                            </span>
                            {message.isInternal ? (
                              <Badge variant="outline" className="text-[11px]">Internal</Badge>
                            ) : null}
                            {message.isAiGenerated ? (
                              <Badge variant="outline" className="text-[11px]">AI drafted</Badge>
                            ) : null}
                            <span className="text-alo-text-muted text-[11px]">
                              {formatTimestamp(message.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div>
                  <label htmlFor="wa-draft" className="text-alo-text-muted text-xs">
                    Reply
                  </label>
                  <Textarea
                    id="wa-draft"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write your message"
                    className="mt-1 text-sm"
                    rows={4}
                  />
                </div>

                <Button size="sm" onClick={() => void sendMessage()} disabled={sending}>
                  <Send className="mr-1 h-4 w-4" />
                  {sending ? 'Sending…' : 'Send message'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="text-alo-text-muted flex items-start gap-2 p-4 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Contact names, phone numbers, email addresses, lead status, destination and online
            presence are not shown: the communication thread stores none of them. Eligibility and
            fee figures are never asserted here — check a course record and its verified source
            before quoting anything to a student.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
