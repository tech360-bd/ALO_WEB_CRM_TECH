'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle, Search, Send, Clock, Users, AlertTriangle,
  RefreshCw, Inbox, FileText, Info,
} from 'lucide-react';

// ============================================================
// Types — mirror the real contracts
// ============================================================

// GET /api/crm/inbox?channel=whatsapp → CommunicationThread
interface WaThread {
  id: string;
  threadCode?: string;
  studentId?: string | null;
  channel?: string;
  subject?: string;
  intent?: string;
  priority?: string;
  assignedToId?: string;
  assignedToName?: string;
  status?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  isAiHandled?: boolean;
  needsHumanTakeover?: boolean;
  slaStatus?: string;
  slaDueAt?: string | null;
  escalatedToName?: string;
}

// GET /api/communications/templates → CommunicationTemplate
interface Template {
  id: string;
  templateCode?: string;
  templateName?: string;
  channel?: string;
  category?: string;
  language?: string;
  body?: string;
  variables?: unknown;
  status?: string;
}

interface InboxMeta {
  totalUnread?: number;
  openCount?: number;
  escalatedCount?: number;
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

export default function CrmWhatsAppPage() {
  const [threads, setThreads] = useState<WaThread[]>([]);
  const [meta, setMeta] = useState<InboxMeta>({});
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateState, setTemplateState] = useState<LoadState>({ loading: true, error: null });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ channel: 'whatsapp', limit: '100' });
      const term = searchQuery.trim();
      if (term) params.set('search', term);
      const response = await fetch(`/api/crm/inbox?${params.toString()}`);
      if (!response.ok) throw new Error(`Could not load WhatsApp conversations (HTTP ${response.status})`);
      const payload = await response.json();
      setThreads(Array.isArray(payload?.data) ? payload.data : []);
      setTotal(Number(payload?.total) || 0);
      setMeta(payload?.meta || {});
      setState({ loading: false, error: null });
    } catch (error) {
      setThreads([]);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load WhatsApp conversations',
      });
    }
  }, [searchQuery]);

  const loadTemplates = useCallback(async () => {
    setTemplateState({ loading: true, error: null });
    try {
      const response = await fetch('/api/communications/templates');
      if (!response.ok) throw new Error(`Could not load templates (HTTP ${response.status})`);
      const payload = await response.json();
      const rows: Template[] = Array.isArray(payload?.templates) ? payload.templates : [];
      setTemplates(rows.filter((row) => !row.channel || row.channel === 'whatsapp'));
      setTemplateState({ loading: false, error: null });
    } catch (error) {
      setTemplates([]);
      setTemplateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load templates',
      });
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const selected = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || null,
    [threads, selectedId],
  );

  const unreadTotal = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0),
    [threads],
  );

  const sendReply = async () => {
    if (!selected) return;
    const content = messageInput.trim();
    if (!content) {
      setActionError('Write a message before sending.');
      return;
    }
    setSending(true);
    setActionError(null);
    try {
      const response = await fetch('/api/crm/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: selected.id, content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload?.error || `Could not send the message (HTTP ${response.status})`);
        return;
      }
      setMessageInput('');
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
            WhatsApp Conversations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            WhatsApp threads recorded in the CRM, with replies and approved templates.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadThreads()}>
          <RefreshCw className={`mr-1 h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Conversations loaded</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <MessageCircle className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Unread</p>
              <p className="text-2xl font-bold">{meta.totalUnread ?? unreadTotal}</p>
            </div>
            <Inbox className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Open</p>
              <p className="text-2xl font-bold">{meta.openCount ?? 0}</p>
            </div>
            <Users className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Escalated</p>
              <p className="text-2xl font-bold">{meta.escalatedCount ?? 0}</p>
            </div>
            <AlertTriangle
              className={`h-5 w-5 ${(meta.escalatedCount ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground'}`}
            />
          </CardContent>
        </Card>
      </div>

      {actionError && (
        <Card>
          <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">{actionError}</p>
          </CardContent>
        </Card>
      )}

      {state.error && (
        <Card>
          <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">{state.error}</p>
              <button
                type="button"
                className="mt-1 underline underline-offset-2"
                onClick={() => void loadThreads()}
              >
                Try again
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── THREAD LIST ── */}
        <Card>
          <CardHeader className="space-y-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <div className="relative">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search student, assignee or preview"
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            {state.loading ? (
              <p className="text-muted-foreground py-10 text-center text-sm">Loading conversations…</p>
            ) : threads.length === 0 && !state.error ? (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center">
                <Inbox className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {searchQuery.trim()
                    ? 'No WhatsApp conversation matches that search.'
                    : 'No WhatsApp conversation has been recorded yet.'}
                </p>
              </div>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-y-auto">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedId(thread.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedId === thread.id ? 'border-primary bg-muted/60' : 'hover:bg-muted/40'
                    }`}
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
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {priorityBadge(thread.priority)}
                      <Badge variant="outline" className="text-[11px]">
                        {thread.status || 'unknown'}
                      </Badge>
                      <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(thread.lastMessageAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SELECTED THREAD ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selected ? selected.subject || selected.threadCode || 'Conversation' : 'No conversation selected'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selected ? (
              <p className="text-muted-foreground py-10 text-center text-sm">
                Select a conversation to read its latest message and reply.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground text-xs">Student</p>
                    <p className="text-sm">{selected.studentId || 'Not linked'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Assigned to</p>
                    <p className="text-sm">
                      {selected.assignedToName || <span className="text-muted-foreground">Unassigned</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Intent</p>
                    <p className="text-sm">{selected.intent || 'general'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Handling</p>
                    <p className="text-sm">
                      {selected.isAiHandled ? 'AI was handling' : 'Human handling'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">SLA</p>
                    <p className="text-sm">
                      {selected.slaStatus || 'none'}
                      {selected.slaDueAt ? ` · due ${formatTimestamp(selected.slaDueAt)}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Escalated to</p>
                    <p className="text-sm">
                      {selected.escalatedToName || <span className="text-muted-foreground">No escalation</span>}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-muted-foreground text-xs">Latest message</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {selected.lastMessagePreview
                      || 'No message preview is stored for this thread.'}
                  </p>
                </div>

                <Separator />

                <div>
                  <label htmlFor="wa-reply" className="text-muted-foreground text-xs">
                    Reply
                  </label>
                  <Textarea
                    id="wa-reply"
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder="Write your message"
                    className="mt-1 text-sm"
                    rows={4}
                  />
                </div>

                <Button size="sm" onClick={() => void sendReply()} disabled={sending}>
                  <Send className="mr-1 h-4 w-4" />
                  {sending ? 'Sending…' : 'Send message'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── TEMPLATES ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp templates</CardTitle>
        </CardHeader>
        <CardContent>
          {templateState.error && (
            <div className="bg-destructive/10 text-destructive mb-4 flex items-start gap-2 rounded-lg p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">{templateState.error}</p>
                <button
                  type="button"
                  className="mt-1 underline underline-offset-2"
                  onClick={() => void loadTemplates()}
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {templateState.loading ? (
            <p className="text-muted-foreground py-8 text-center text-sm">Loading templates…</p>
          ) : templates.length === 0 && !templateState.error ? (
            <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center">
              <FileText className="h-8 w-8 opacity-30" />
              <p className="text-sm">No WhatsApp template has been created yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <div key={template.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">
                      {template.templateName || template.templateCode || 'Untitled template'}
                    </p>
                    <Badge variant="outline" className="text-[11px]">
                      {template.status || 'draft'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {template.category || 'uncategorised'}
                    {template.language ? ` · ${template.language}` : ''}
                    {template.templateCode ? ` · ${template.templateCode}` : ''}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm whitespace-pre-wrap">
                    {template.body || 'No body recorded.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={!selected}
                    onClick={() => setMessageInput(template.body || '')}
                  >
                    {selected ? 'Load into reply' : 'Select a conversation first'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Contact names, phone numbers and full message histories are not shown: the
            communication thread stores only a latest-message preview. Response-rate and
            average-response-time figures are not displayed because nothing measures them.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
