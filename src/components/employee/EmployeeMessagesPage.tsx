'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageCircle, Send, RefreshCw, AlertTriangle, Inbox, Clock, Info, Search,
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
}

// CommunicationMessage rows for the selected thread
interface Message {
  id: string;
  threadId: string;
  senderType: string;
  senderName?: string;
  content: string;
  messageType?: string;
  isInternal?: boolean;
  isAiGenerated?: boolean;
  isRead?: boolean;
  createdAt: string;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

// Starting text the employee edits before sending. These are drafting
// prompts, not claims about the world, so they carry no facts.
const DRAFT_SNIPPETS = [
  { label: 'Follow-up', text: 'I wanted to follow up on your application. Could you share the latest status?' },
  { label: 'Document reminder', text: 'This is a reminder to submit your pending documents before the deadline.' },
  { label: 'Session request', text: 'I would like to schedule a counselling session. Which times suit you this week?' },
  { label: 'Stage update', text: 'Your application has moved to the next stage. Let us discuss the next steps.' },
];

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function EmployeeMessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [threadState, setThreadState] = useState<LoadState>({ loading: true, error: null });

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageState, setMessageState] = useState<LoadState>({ loading: false, error: null });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setThreadState({ loading: true, error: null });
    try {
      const response = await fetch('/api/employee/messages?limit=50');
      if (!response.ok) throw new Error(`Could not load your conversations (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'Conversations are unavailable');
      setThreads(Array.isArray(payload.data?.threads) ? payload.data.threads : []);
      setTotalUnread(Number(payload.data?.totalUnread) || 0);
      setThreadState({ loading: false, error: null });
    } catch (error) {
      setThreads([]);
      setThreadState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load your conversations',
      });
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    setMessageState({ loading: true, error: null });
    try {
      const response = await fetch(`/api/employee/messages?threadId=${encodeURIComponent(threadId)}&limit=50`);
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
    const term = searchQuery.trim().toLowerCase();
    if (!term) return threads;
    return threads.filter((thread) =>
      [thread.threadCode, thread.studentId, thread.subject, thread.lastMessagePreview]
        .some((value) => String(value || '').toLowerCase().includes(term)),
    );
  }, [threads, searchQuery]);

  // Mark the incoming unread messages read once the conversation is open.
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
        // Read receipts are best-effort; failing to record one must not
        // block reading or replying.
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MessageCircle className="h-6 w-6 text-primary" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Conversations assigned to you, and the messages in each.
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
        {/* ── Thread list ── */}
        <Card className="lg:col-span-4">
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">
              Your conversations ({threads.length})
              {totalUnread > 0 ? ` · ${totalUnread} unread` : ''}
            </CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
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
              <p className="text-muted-foreground py-10 text-center text-sm">
                Loading conversations…
              </p>
            ) : filteredThreads.length === 0 && !threadState.error ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
                <Inbox className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {threads.length === 0
                    ? 'No conversation is assigned to you yet.'
                    : 'No conversation matches that search.'}
                </p>
              </div>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-y-auto">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedId(thread.id)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      selectedId === thread.id ? 'border-primary bg-muted/60' : 'hover:bg-muted/40',
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
                    <p className="text-muted-foreground mt-1 text-xs">
                      {thread.threadCode || 'No thread code'}
                      {thread.studentId ? ` · Student ${thread.studentId}` : ''}
                    </p>
                    <p className="text-muted-foreground mt-1 flex items-center gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(thread.lastMessageAt)}
                    </p>
                  </button>
                ))}
              </div>
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
              <p className="text-muted-foreground py-12 text-center text-sm">
                Select a conversation to read its messages and reply.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Student</p>
                    <p className="text-sm">{selectedThread.studentId || 'Not linked'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Channel</p>
                    <p className="text-sm">{selectedThread.channel || 'unknown'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Intent</p>
                    <p className="text-sm">{selectedThread.intent || 'general'}</p>
                  </div>
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

                <div className="max-h-[380px] space-y-3 overflow-y-auto rounded-lg border p-3">
                  {messageState.loading ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      Loading messages…
                    </p>
                  ) : messages.length === 0 && !messageState.error ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
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
                            <span className="text-muted-foreground text-[11px]">
                              {formatTimestamp(message.createdAt)}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {DRAFT_SNIPPETS.map((snippet) => (
                    <Button
                      key={snippet.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setDraft(snippet.text)}
                    >
                      {snippet.label}
                    </Button>
                  ))}
                </div>

                <div>
                  <label htmlFor="message-draft" className="text-muted-foreground text-xs">
                    Reply
                  </label>
                  <Textarea
                    id="message-draft"
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
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Only conversations assigned to you are listed, and the sender name on each message is
            taken from the message record. Contact names and online presence are not shown because
            the thread does not store them.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
