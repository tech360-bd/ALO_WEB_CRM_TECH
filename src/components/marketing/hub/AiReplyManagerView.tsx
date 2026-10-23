'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Bot, MessageCircle, Zap, RefreshCw, AlertTriangle, Search,
  Inbox, Info, Shield, ArrowRight,
} from 'lucide-react';

// ============================================================
// Types — mirror the real contracts
// ============================================================

// GET /api/crm/inbox?channel=whatsapp → CommunicationThread
interface AiThread {
  id: string;
  threadCode?: string;
  studentId?: string | null;
  subject?: string;
  intent?: string;
  priority?: string;
  assignedToName?: string;
  status?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount?: number;
  isAiHandled?: boolean;
  needsHumanTakeover?: boolean;
  slaStatus?: string;
}

// GET /api/marketing/keyword-triggers → KeywordTrigger
interface KeywordTrigger {
  id: string;
  keyword: string;
  keywordType: string;
  platform: string;
  autoReplyText: string;
  autoDmText?: string | null;
  autoCreateLead: boolean;
  autoAssignCounselor: boolean;
  sendPortalLink: boolean;
  status: string;
  triggerCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// GET /api/whatsapp/routing → CommunicationRoutingLog
interface RoutingLog {
  id: string;
  threadId?: string;
  conversationId?: string;
  studentId?: string;
  fromNumber?: string;
  toNumber?: string;
  routingReason?: string;
  priority?: number;
  assignedToName?: string;
  branch?: string;
  department?: string;
  fallbackUsed?: boolean;
  createdAt?: string;
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

export default function AiReplyManagerView() {
  const [threads, setThreads] = useState<AiThread[]>([]);
  const [threadState, setThreadState] = useState<LoadState>({ loading: true, error: null });

  const [triggers, setTriggers] = useState<KeywordTrigger[]>([]);
  const [triggerState, setTriggerState] = useState<LoadState>({ loading: true, error: null });
  const [triggerSearch, setTriggerSearch] = useState('');

  const [routingLogs, setRoutingLogs] = useState<RoutingLog[]>([]);
  const [routingState, setRoutingState] = useState<LoadState>({ loading: true, error: null });

  const loadThreads = useCallback(async () => {
    setThreadState({ loading: true, error: null });
    try {
      const response = await fetch('/api/crm/inbox?channel=whatsapp&limit=100');
      if (!response.ok) throw new Error(`Could not load AI-handled conversations (HTTP ${response.status})`);
      const payload = await response.json();
      setThreads(Array.isArray(payload?.data) ? payload.data : []);
      setThreadState({ loading: false, error: null });
    } catch (error) {
      setThreads([]);
      setThreadState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load AI-handled conversations',
      });
    }
  }, []);

  const loadTriggers = useCallback(async () => {
    setTriggerState({ loading: true, error: null });
    try {
      const response = await fetch('/api/marketing/keyword-triggers');
      if (!response.ok) throw new Error(`Could not load reply rules (HTTP ${response.status})`);
      const payload = await response.json();
      setTriggers(Array.isArray(payload?.triggers) ? payload.triggers : []);
      setTriggerState({ loading: false, error: null });
    } catch (error) {
      setTriggers([]);
      setTriggerState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load reply rules',
      });
    }
  }, []);

  const loadRouting = useCallback(async () => {
    setRoutingState({ loading: true, error: null });
    try {
      const response = await fetch('/api/whatsapp/routing');
      if (!response.ok) throw new Error(`Could not load routing history (HTTP ${response.status})`);
      const payload = await response.json();
      setRoutingLogs(Array.isArray(payload?.logs) ? payload.logs : []);
      setRoutingState({ loading: false, error: null });
    } catch (error) {
      setRoutingLogs([]);
      setRoutingState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load routing history',
      });
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    void loadTriggers();
    void loadRouting();
  }, [loadThreads, loadTriggers, loadRouting]);

  const refreshAll = async () => {
    await Promise.all([loadThreads(), loadTriggers(), loadRouting()]);
  };

  const aiHandledCount = useMemo(
    () => threads.filter((thread) => thread.isAiHandled === true).length,
    [threads],
  );
  const takeoverCount = useMemo(
    () => threads.filter((thread) => thread.needsHumanTakeover === true).length,
    [threads],
  );
  const activeTriggerCount = useMemo(
    () => triggers.filter((trigger) => trigger.status === 'ACTIVE').length,
    [triggers],
  );
  const totalTriggers = useMemo(
    () => triggers.reduce((sum, trigger) => sum + (trigger.triggerCount || 0), 0),
    [triggers],
  );

  const filteredTriggers = useMemo(() => {
    const term = triggerSearch.trim().toLowerCase();
    if (!term) return triggers;
    return triggers.filter((trigger) =>
      [trigger.keyword, trigger.autoReplyText, trigger.platform, trigger.status]
        .some((value) => String(value || '').toLowerCase().includes(term)),
    );
  }, [triggers, triggerSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Bot className="h-6 w-6 text-primary" />
            AI Reply Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Keyword reply rules, the conversations AI is handling, and routing history.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw
            className={`mr-1 h-4 w-4 ${threadState.loading || triggerState.loading || routingState.loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">AI-handled</p>
              <p className="text-2xl font-bold">{aiHandledCount}</p>
            </div>
            <Bot className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Awaiting takeover</p>
              <p className="text-2xl font-bold">{takeoverCount}</p>
            </div>
            <MessageCircle className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Active rules</p>
              <p className="text-2xl font-bold">{activeTriggerCount}</p>
            </div>
            <Zap className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Rule matches</p>
              <p className="text-2xl font-bold">{totalTriggers}</p>
            </div>
            <Shield className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="h-9">
          <TabsTrigger value="rules" className="h-8 px-3 text-xs font-medium">
            Reply rules ({triggers.length})
          </TabsTrigger>
          <TabsTrigger value="conversations" className="h-8 px-3 text-xs font-medium">
            AI conversations ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="routing" className="h-8 px-3 text-xs font-medium">
            Routing history ({routingLogs.length})
          </TabsTrigger>
        </TabsList>

        {/* ── REPLY RULES ── */}
        <TabsContent value="rules" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
            <Input
              value={triggerSearch}
              onChange={(event) => setTriggerSearch(event.target.value)}
              placeholder="Search keyword or reply text"
              className="pl-8"
            />
          </div>

          {triggerState.error && (
            <Card>
              <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{triggerState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadTriggers()}
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {triggerState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading reply rules…
              </CardContent>
            </Card>
          ) : filteredTriggers.length === 0 && !triggerState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <Zap className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {triggers.length === 0
                    ? 'No keyword reply rule has been created yet.'
                    : 'No rule matches that search.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Keyword</TableHead>
                        <TableHead>Auto reply</TableHead>
                        <TableHead className="w-[110px]">Platform</TableHead>
                        <TableHead className="w-[130px]">Actions</TableHead>
                        <TableHead className="w-[100px]">Matches</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTriggers.map((trigger) => (
                        <TableRow key={trigger.id}>
                          <TableCell>
                            <p className="font-medium">{trigger.keyword}</p>
                            <p className="text-muted-foreground text-[11px]">
                              {trigger.keywordType || 'EXACT'}
                            </p>
                          </TableCell>
                          <TableCell className="max-w-[320px] text-xs">
                            {trigger.autoReplyText || 'No reply text recorded.'}
                          </TableCell>
                          <TableCell className="text-xs">{trigger.platform || 'ALL'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {trigger.autoCreateLead ? (
                                <Badge variant="outline" className="text-[11px]">Lead</Badge>
                              ) : null}
                              {trigger.autoAssignCounselor ? (
                                <Badge variant="outline" className="text-[11px]">Assign</Badge>
                              ) : null}
                              {trigger.sendPortalLink ? (
                                <Badge variant="outline" className="text-[11px]">Portal link</Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{trigger.triggerCount || 0}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                trigger.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]'
                              }`}
                            >
                              {trigger.status || 'UNKNOWN'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── AI CONVERSATIONS ── */}
        <TabsContent value="conversations" className="mt-4 space-y-4">
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
                Loading conversations…
              </CardContent>
            </Card>
          ) : threads.length === 0 && !threadState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <Inbox className="h-8 w-8 opacity-30" />
                <p className="text-sm">No WhatsApp conversation has been recorded yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conversation</TableHead>
                        <TableHead className="w-[120px]">Handling</TableHead>
                        <TableHead className="w-[100px]">Priority</TableHead>
                        <TableHead className="w-[150px]">Assigned to</TableHead>
                        <TableHead className="w-[170px]">Last message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {threads.map((thread) => (
                        <TableRow key={thread.id}>
                          <TableCell>
                            <p className="font-medium">
                              {thread.subject || thread.lastMessagePreview || thread.threadCode || 'Untitled conversation'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {thread.threadCode || 'No thread code'}
                              {thread.studentId ? ` · Student ${thread.studentId}` : ''}
                              {thread.intent ? ` · ${thread.intent}` : ''}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-[11px] ${
                                thread.isAiHandled
                                  ? 'bg-violet-100 text-violet-700 border-violet-200'
                                  : 'bg-sky-100 text-sky-700 border-sky-200'
                              }`}
                            >
                              {thread.isAiHandled ? 'AI' : 'Human'}
                            </Badge>
                            {thread.needsHumanTakeover ? (
                              <Badge variant="outline" className="mt-1 bg-red-100 text-red-700 text-[11px]">
                                Needs takeover
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>{priorityBadge(thread.priority)}</TableCell>
                          <TableCell className="text-xs">
                            {thread.assignedToName || <span className="text-muted-foreground">Unassigned</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatTimestamp(thread.lastMessageAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── ROUTING HISTORY ── */}
        <TabsContent value="routing" className="mt-4 space-y-4">
          {routingState.error && (
            <Card>
              <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{routingState.error}</p>
                  <button
                    type="button"
                    className="mt-1 underline underline-offset-2"
                    onClick={() => void loadRouting()}
                  >
                    Try again
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {routingState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading routing history…
              </CardContent>
            </Card>
          ) : routingLogs.length === 0 && !routingState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <ArrowRight className="h-8 w-8 opacity-30" />
                <p className="text-sm">No routing decision has been logged yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conversation</TableHead>
                        <TableHead className="w-[170px]">Reason</TableHead>
                        <TableHead className="w-[170px]">Assigned to</TableHead>
                        <TableHead className="w-[130px]">Department</TableHead>
                        <TableHead className="w-[170px]">Recorded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routingLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <p className="font-medium">
                              {log.conversationId || log.threadId || 'No reference'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {log.studentId ? `Student ${log.studentId}` : 'Not linked to a student'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {(log.routingReason || 'unspecified').replace(/_/g, ' ')}
                            </Badge>
                            {log.fallbackUsed ? (
                              <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-700 text-[11px]">
                                Fallback used
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.assignedToName || <span className="text-muted-foreground">Unassigned</span>}
                            {log.branch ? (
                              <span className="text-muted-foreground block">{log.branch}</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.department || <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatTimestamp(log.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Reply rules are edited on the Keyword Triggers screen, which writes to the same
            keyword-trigger store this list reads. There is no global AI on/off switch, no
            after-hours mode and no blocked-contact list in this platform, so no such controls are
            shown. Satisfaction ratings, language detection and per-contact message counts are not
            recorded on the conversation thread and are therefore not displayed.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
