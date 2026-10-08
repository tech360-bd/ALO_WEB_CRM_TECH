'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Users, Clock, AlertTriangle, CheckCircle2, MessageCircle, RefreshCw,
  UserPlus, Send, Shield, Inbox, Info,
} from 'lucide-react';

// ============================================================
// Types — mirror the real contracts
// ============================================================

// GET /api/crm/inbox returns CommunicationThread rows. A thread enters this
// queue only when the platform has flagged needsHumanTakeover.
interface HandoffThread {
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
  needsHumanTakeover?: boolean;
  slaStatus?: string;
  slaDueAt?: string | null;
  escalatedToName?: string;
  isAiHandled?: boolean;
}

// GET /api/communications/escalations returns EscalationEvent rows.
interface EscalationEvent {
  id: string;
  type: string;
  level: number;
  communicationId?: string | null;
  studentId?: string | null;
  counselorId?: string | null;
  supervisorId?: string | null;
  message: string;
  actionTaken?: string | null;
  status: string;
  createdAt: string;
  resolvedAt?: string | null;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const ALL = '__all__';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  messenger: 'Messenger',
  email: 'Email',
  sms: 'SMS',
  web_form: 'Web form',
};

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  normal: { label: 'Normal', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const ESCALATION_STATUS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Open', cls: 'bg-red-100 text-red-700 border-red-200' },
  ACKNOWLEDGED: { label: 'Acknowledged', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  RESOLVED: { label: 'Resolved', cls: 'bg-green-100 text-green-700 border-green-200' },
  CLOSED: { label: 'Closed', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const LEVEL_LABELS: Record<number, string> = {
  1: 'Level 1 — warning',
  2: 'Level 2 — supervisor',
  3: 'Level 3 — manager',
};

function priorityBadge(priority?: string) {
  const key = (priority || 'normal').toLowerCase();
  const meta = PRIORITY_CONFIG[key] || PRIORITY_CONFIG.normal;
  return (
    <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
      {meta.label}
    </Badge>
  );
}

function escalationStatusBadge(status: string) {
  const meta = ESCALATION_STATUS[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>
      {meta.label}
    </Badge>
  );
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

export default function HumanHandoffView() {
  const [activeTab, setActiveTab] = useState('handoff');

  const [threads, setThreads] = useState<HandoffThread[]>([]);
  const [threadState, setThreadState] = useState<LoadState>({ loading: true, error: null });
  const [channelFilter, setChannelFilter] = useState(ALL);

  const [escalations, setEscalations] = useState<EscalationEvent[]>([]);
  const [escalationState, setEscalationState] = useState<LoadState>({ loading: true, error: null });
  const [escalationStatusFilter, setEscalationStatusFilter] = useState(ALL);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [handlerName, setHandlerName] = useState('');
  const [replyText, setReplyText] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const loadThreads = useCallback(async () => {
    setThreadState({ loading: true, error: null });
    try {
      const response = await fetch('/api/crm/inbox?limit=100');
      if (!response.ok) throw new Error(`Could not load the handoff queue (HTTP ${response.status})`);
      const payload = await response.json();
      const rows: HandoffThread[] = Array.isArray(payload?.data) ? payload.data : [];
      setThreads(rows.filter((row) => row.needsHumanTakeover === true));
      setThreadState({ loading: false, error: null });
    } catch (error) {
      setThreads([]);
      setThreadState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load the handoff queue',
      });
    }
  }, []);

  const loadEscalations = useCallback(async () => {
    setEscalationState({ loading: true, error: null });
    try {
      const response = await fetch('/api/communications/escalations');
      if (!response.ok) throw new Error(`Could not load escalations (HTTP ${response.status})`);
      const payload = await response.json();
      setEscalations(Array.isArray(payload?.escalations) ? payload.escalations : []);
      setEscalationState({ loading: false, error: null });
    } catch (error) {
      setEscalations([]);
      setEscalationState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load escalations',
      });
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    void loadEscalations();
  }, [loadThreads, loadEscalations]);

  const channelOptions = useMemo(
    () => Array.from(new Set(threads.map((thread) => thread.channel).filter(Boolean))) as string[],
    [threads],
  );

  const filteredThreads = useMemo(
    () => threads.filter((thread) => channelFilter === ALL || thread.channel === channelFilter),
    [threads, channelFilter],
  );

  const filteredEscalations = useMemo(
    () => escalations.filter(
      (escalation) => escalationStatusFilter === ALL || escalation.status === escalationStatusFilter,
    ),
    [escalations, escalationStatusFilter],
  );

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || null,
    [threads, selectedId],
  );

  const openEscalations = useMemo(
    () => escalations.filter((escalation) => escalation.status === 'OPEN').length,
    [escalations],
  );

  const assignThread = async (thread: HandoffThread) => {
    const name = handlerName.trim();
    if (!name) {
      setActionError('Enter the name of the person taking over before assigning.');
      return;
    }
    setActingId(thread.id);
    setActionError(null);
    try {
      const response = await fetch('/api/crm/inbox', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: thread.id,
          action: 'assign',
          assignedToName: name,
          status: 'open',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload?.error || `Could not assign this conversation (HTTP ${response.status})`);
        return;
      }
      setHandlerName('');
      await loadThreads();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not assign this conversation');
    } finally {
      setActingId(null);
    }
  };

  const sendReply = async (thread: HandoffThread) => {
    const content = replyText.trim();
    if (!content) {
      setActionError('Write a reply before sending.');
      return;
    }
    setActingId(thread.id);
    setActionError(null);
    try {
      const response = await fetch('/api/crm/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.id, content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload?.error || `Could not send the reply (HTTP ${response.status})`);
        return;
      }
      setReplyText('');
      await loadThreads();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not send the reply');
    } finally {
      setActingId(null);
    }
  };

  const updateEscalation = async (
    escalation: EscalationEvent,
    status: 'ACKNOWLEDGED' | 'RESOLVED',
  ) => {
    setActingId(escalation.id);
    setActionError(null);
    try {
      const body: Record<string, unknown> = { status };
      if (status === 'RESOLVED') body.actionTaken = noteText.trim();
      const response = await fetch(`/api/communications/escalations/${escalation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload?.error || `Could not update this escalation (HTTP ${response.status})`);
        return;
      }
      setNoteFor(null);
      setNoteText('');
      await loadEscalations();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update this escalation');
    } finally {
      setActingId(null);
    }
  };

  const refreshAll = async () => {
    setSelectedId(null);
    await Promise.all([loadThreads(), loadEscalations()]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Shield className="h-6 w-6 text-primary" />
            Human Handoff &amp; Escalations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Conversations flagged for human takeover, and the SLA escalations raised against them.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw
            className={`mr-1 h-4 w-4 ${threadState.loading || escalationState.loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Awaiting takeover</p>
              <p className="text-2xl font-bold">{threads.length}</p>
            </div>
            <Users className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Open escalations</p>
              <p className="text-2xl font-bold">{openEscalations}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Unassigned</p>
              <p className="text-2xl font-bold">
                {threads.filter((thread) => !thread.assignedToName).length}
              </p>
            </div>
            <UserPlus className="text-muted-foreground h-5 w-5" />
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9">
          <TabsTrigger value="handoff" className="h-8 px-3 text-xs font-medium">
            Handoff queue ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="escalations" className="h-8 px-3 text-xs font-medium">
            SLA escalations ({escalations.length})
          </TabsTrigger>
        </TabsList>

        {/* ── HANDOFF QUEUE ── */}
        <TabsContent value="handoff" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={channelFilter === ALL ? '' : channelFilter}
              onChange={(event) => setChannelFilter(event.target.value || ALL)}
              placeholder="Filter by channel key"
              className="w-[200px]"
            />
            <Button variant="ghost" size="sm" onClick={() => setChannelFilter(ALL)}>
              Clear
            </Button>
            {channelOptions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {channelOptions.map((channel) => (
                  <Button
                    key={channel}
                    variant={channelFilter === channel ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChannelFilter(channel)}
                  >
                    {CHANNEL_LABELS[channel] || channel}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {threadState.error && (
            <Card>
              <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
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
              </CardContent>
            </Card>
          )}

          {threadState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading the handoff queue…
              </CardContent>
            </Card>
          ) : filteredThreads.length === 0 && !threadState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <Inbox className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {threads.length === 0
                    ? 'No conversation is currently flagged for human takeover.'
                    : 'No flagged conversation matches this channel filter.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredThreads.map((thread) => (
                <Card key={thread.id}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <MessageCircle className="text-muted-foreground h-4 w-4 shrink-0" />
                          <p className="truncate font-medium">
                            {thread.subject || thread.lastMessagePreview || thread.threadCode || 'Untitled conversation'}
                          </p>
                          {priorityBadge(thread.priority)}
                          {thread.unreadCount && thread.unreadCount > 0 ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 text-[10px]">
                              {thread.unreadCount} unread
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {CHANNEL_LABELS[thread.channel || ''] || thread.channel || 'Unknown channel'}
                          {thread.threadCode ? ` · ${thread.threadCode}` : ''}
                          {thread.studentId ? ` · Student ${thread.studentId}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(thread.lastMessageAt)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {thread.assignedToName ? `Assigned: ${thread.assignedToName}` : 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    {thread.lastMessagePreview && (
                      <p className="text-muted-foreground line-clamp-2 text-sm">
                        {thread.lastMessagePreview}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        Intent: {thread.intent || 'general'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        SLA: {thread.slaStatus || 'none'}
                      </Badge>
                      {thread.isAiHandled ? (
                        <Badge variant="outline" className="text-[10px]">AI was handling</Badge>
                      ) : null}
                      {thread.escalatedToName ? (
                        <Badge variant="outline" className="bg-red-100 text-red-700 text-[10px]">
                          Escalated to {thread.escalatedToName}
                        </Badge>
                      ) : null}
                    </div>

                    <Separator />

                    {selectedId === thread.id ? (
                      <div className="space-y-3">
                        <div>
                          <label htmlFor={`handler-${thread.id}`} className="text-muted-foreground text-xs">
                            Taking over as
                          </label>
                          <div className="mt-1 flex gap-2">
                            <Input
                              id={`handler-${thread.id}`}
                              value={handlerName}
                              onChange={(event) => setHandlerName(event.target.value)}
                              placeholder="Your name"
                              className="text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => void assignThread(thread)}
                              disabled={actingId === thread.id}
                            >
                              <UserPlus className="mr-1 h-4 w-4" />
                              {actingId === thread.id ? 'Assigning…' : 'Assign to me'}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label htmlFor={`reply-${thread.id}`} className="text-muted-foreground text-xs">
                            Reply to the student
                          </label>
                          <Textarea
                            id={`reply-${thread.id}`}
                            value={replyText}
                            onChange={(event) => setReplyText(event.target.value)}
                            placeholder="Write your reply"
                            className="mt-1 text-sm"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => void sendReply(thread)}
                            disabled={actingId === thread.id}
                          >
                            <Send className="mr-1 h-4 w-4" />
                            Send reply
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setSelectedId(thread.id)}>
                        Take over conversation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── ESCALATIONS ── */}
        <TabsContent value="escalations" className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'] as const).map((status) => (
              <Button
                key={status}
                variant={escalationStatusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEscalationStatusFilter(status)}
              >
                {ESCALATION_STATUS[status].label}
                <span className="ml-1">
                  ({escalations.filter((escalation) => escalation.status === status).length})
                </span>
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => setEscalationStatusFilter(ALL)}>
              Show all
            </Button>
          </div>

          {escalationState.error && (
            <Card>
              <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{escalationState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadEscalations()}
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {escalationState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading escalations…
              </CardContent>
            </Card>
          ) : filteredEscalations.length === 0 && !escalationState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <CheckCircle2 className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {escalations.length === 0
                    ? 'No SLA escalation has been raised.'
                    : `No escalation is ${ESCALATION_STATUS[escalationStatusFilter]?.label.toLowerCase() || 'in this state'}.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredEscalations.map((escalation) => (
                <Card key={escalation.id}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                          <p className="font-medium">
                            {escalation.type.replace(/_/g, ' ')}
                          </p>
                          {escalationStatusBadge(escalation.status)}
                          <Badge variant="outline" className="text-[10px]">
                            {LEVEL_LABELS[escalation.level] || `Level ${escalation.level}`}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Raised {formatTimestamp(escalation.createdAt)}
                          {escalation.resolvedAt ? ` · Resolved ${formatTimestamp(escalation.resolvedAt)}` : ''}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm whitespace-pre-wrap">{escalation.message}</p>

                    {escalation.actionTaken && (
                      <p className="text-muted-foreground text-xs">
                        Action taken: {escalation.actionTaken}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      {escalation.communicationId ? (
                        <Badge variant="outline" className="text-[10px]">
                          Conversation {escalation.communicationId}
                        </Badge>
                      ) : null}
                      {escalation.studentId ? (
                        <Badge variant="outline" className="text-[10px]">
                          Student {escalation.studentId}
                        </Badge>
                      ) : null}
                      {escalation.counselorId ? (
                        <Badge variant="outline" className="text-[10px]">
                          Counselor {escalation.counselorId}
                        </Badge>
                      ) : null}
                    </div>

                    {(escalation.status === 'OPEN' || escalation.status === 'ACKNOWLEDGED') && (
                      <>
                        <Separator />
                        {noteFor === escalation.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={noteText}
                              onChange={(event) => setNoteText(event.target.value)}
                              placeholder="Describe how this was resolved"
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => void updateEscalation(escalation, 'RESOLVED')}
                                disabled={actingId === escalation.id}
                              >
                                {actingId === escalation.id ? 'Resolving…' : 'Resolve'}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setNoteFor(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {escalation.status === 'OPEN' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void updateEscalation(escalation, 'ACKNOWLEDGED')}
                                disabled={actingId === escalation.id}
                              >
                                Acknowledge
                              </Button>
                            )}
                            <Button size="sm" onClick={() => setNoteFor(escalation.id)}>
                              Resolve
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            This queue lists conversations the platform has flagged with
            <code className="mx-1">needsHumanTakeover</code>; contact names and phone numbers are
            not shown because the communication thread does not store them. Follow-up message
            sequences are not configured anywhere in this platform yet, so none are listed here.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
