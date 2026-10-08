'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle, FileText, Clock, Bot, RefreshCw, AlertTriangle,
  Send, UserPlus, Inbox, Info, Shield, Search,
} from 'lucide-react';

// ============================================================
// Types — mirror the real contracts. Nothing here is invented:
// every field below exists on the model the API actually returns.
// ============================================================

// GET /api/crm/inbox → CommunicationThread
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
  needsHumanTakeover?: boolean;
  isAiHandled?: boolean;
  slaStatus?: string;
  slaDueAt?: string | null;
  escalatedToName?: string;
}

// GET /api/crm/documents → PortalStudentDocument (+ studentProfile)
interface StudentDocument {
  id: string;
  name: string;
  category: string;
  fileName: string;
  mimeType?: string | null;
  fileSize: number;
  status: string;
  rejectionReason: string;
  uploadedAt: string;
  reviewedBy: string;
  createdAt: string;
  studentProfile?: {
    id: string;
    studentId: string;
    fullName: string | null;
    city: string | null;
    user?: { email: string | null; phone: string | null } | null;
  } | null;
}

// GET /api/marketing/whatsapp-sla
interface SlaConfig {
  targetResponseMins?: number;
  managerEscalationMins?: number;
  superAdminEscalationMins?: number;
}

interface OverdueConversation {
  id: string;
  channel?: string;
  status?: string;
  updatedAt?: string;
  externalId?: string | null;
  lastMessageAt?: string | null;
}

interface EscalatedLog {
  id: string;
  action: string;
  createdAt?: string;
  details?: unknown;
}

// GET /api/crm/settings → data.features
interface IntegrationStatus {
  whatsappIntegration?: string;
  emailIntegration?: string;
  smsIntegration?: string;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const ALL = '__all__';

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high: { label: 'High', cls: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  normal: { label: 'Normal', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const DOC_STATUS: Record<string, { label: string; cls: string }> = {
  verified: { label: 'Verified', cls: 'bg-green-100 text-green-700 border-green-200' },
  approved: { label: 'Approved', cls: 'bg-green-100 text-green-700 border-green-200' },
  pending: { label: 'Pending review', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
};

const INTEGRATION_LABELS: Record<string, string> = {
  configured: 'Configured',
  pending_smtp_setup: 'Awaiting SMTP setup',
  pending_gateway_setup: 'Awaiting gateway setup',
};

function priorityBadge(priority?: string) {
  const key = (priority || 'normal').toLowerCase();
  const meta = PRIORITY_CONFIG[key] || PRIORITY_CONFIG.normal;
  return <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>;
}

function docStatusBadge(status: string) {
  const key = (status || '').toLowerCase();
  const meta = DOC_STATUS[key] || { label: status || 'Unknown', cls: 'bg-gray-100 text-gray-600' };
  return <Badge variant="outline" className={`text-[10px] ${meta.cls}`}>{meta.label}</Badge>;
}

function formatTimestamp(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return 'Size not recorded';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// Minutes elapsed since `value`, or null when it cannot be computed.
function minutesSince(value?: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
}

function StateBlock({
  state, onRetry, emptyText, icon: Icon, children,
}: {
  state: LoadState;
  onRetry: () => void;
  emptyText: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  if (state.error) {
    return (
      <Card>
        <CardContent className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">{state.error}</p>
            <button type="button" className="mt-1 underline underline-offset-2" onClick={onRetry}>
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (state.loading) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-12 text-center text-sm">Loading…</CardContent>
      </Card>
    );
  }
  if (!children) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
          <Icon className="h-8 w-8 opacity-30" />
          <p className="text-sm">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }
  return <>{children}</>;
}

export default function WhatsAppAutomationView() {
  const [activeTab, setActiveTab] = useState('inbox');

  const [threads, setThreads] = useState<WaThread[]>([]);
  const [threadState, setThreadState] = useState<LoadState>({ loading: true, error: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(ALL);

  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [docState, setDocState] = useState<LoadState>({ loading: true, error: null });

  const [slaConfig, setSlaConfig] = useState<SlaConfig>({});
  const [overdue, setOverdue] = useState<OverdueConversation[]>([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [escalatedLogs, setEscalatedLogs] = useState<EscalatedLog[]>([]);
  const [slaState, setSlaState] = useState<LoadState>({ loading: true, error: null });

  const [integration, setIntegration] = useState<IntegrationStatus>({});
  const [settingsState, setSettingsState] = useState<LoadState>({ loading: true, error: null });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [handlerName, setHandlerName] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setThreadState({ loading: true, error: null });
    try {
      const response = await fetch('/api/crm/inbox?channel=whatsapp&limit=100');
      if (!response.ok) throw new Error(`Could not load WhatsApp conversations (HTTP ${response.status})`);
      const payload = await response.json();
      setThreads(Array.isArray(payload?.data) ? payload.data : []);
      setThreadState({ loading: false, error: null });
    } catch (error) {
      setThreads([]);
      setThreadState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load WhatsApp conversations',
      });
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setDocState({ loading: true, error: null });
    try {
      const response = await fetch('/api/crm/documents?limit=100');
      if (!response.ok) throw new Error(`Could not load documents (HTTP ${response.status})`);
      const payload = await response.json();
      setDocuments(Array.isArray(payload?.data) ? payload.data : []);
      setDocState({ loading: false, error: null });
    } catch (error) {
      setDocuments([]);
      setDocState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load documents',
      });
    }
  }, []);

  const loadSla = useCallback(async () => {
    setSlaState({ loading: true, error: null });
    try {
      const response = await fetch('/api/marketing/whatsapp-sla');
      if (!response.ok) throw new Error(`Could not load SLA status (HTTP ${response.status})`);
      const payload = await response.json();
      setSlaConfig(payload?.slaConfig || {});
      setOverdue(Array.isArray(payload?.overdueConversations) ? payload.overdueConversations : []);
      setOverdueCount(Number(payload?.overdueCount) || 0);
      setEscalatedLogs(Array.isArray(payload?.escalatedLogs) ? payload.escalatedLogs : []);
      setSlaState({ loading: false, error: null });
    } catch (error) {
      setSlaState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load SLA status',
      });
    }
  }, []);

  const loadSettings = useCallback(async () => {
    setSettingsState({ loading: true, error: null });
    try {
      const response = await fetch('/api/crm/settings');
      if (!response.ok) throw new Error(`Could not load integration status (HTTP ${response.status})`);
      const payload = await response.json();
      setIntegration(payload?.data?.features || {});
      setSettingsState({ loading: false, error: null });
    } catch (error) {
      setIntegration({});
      setSettingsState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load integration status',
      });
    }
  }, []);

  useEffect(() => {
    void loadThreads();
    void loadDocuments();
    void loadSla();
    void loadSettings();
  }, [loadThreads, loadDocuments, loadSla, loadSettings]);

  const refreshAll = async () => {
    setSelectedId(null);
    setActionError(null);
    await Promise.all([loadThreads(), loadDocuments(), loadSla(), loadSettings()]);
  };

  const statusOptions = useMemo(
    () => Array.from(new Set(threads.map((thread) => thread.status).filter(Boolean))) as string[],
    [threads],
  );

  const filteredThreads = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return threads.filter((thread) => {
      if (statusFilter !== ALL && thread.status !== statusFilter) return false;
      if (!term) return true;
      return [thread.threadCode, thread.studentId, thread.subject, thread.lastMessagePreview]
        .some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [threads, searchQuery, statusFilter]);

  const unreadTotal = useMemo(
    () => threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0),
    [threads],
  );

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || null,
    [threads, selectedId],
  );

  const sendReply = async (thread: WaThread) => {
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

  const assignThread = async (thread: WaThread) => {
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
        body: JSON.stringify({ id: thread.id, action: 'assign', assignedToName: name, status: 'open' }),
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Shield className="h-6 w-6 text-primary" />
            WhatsApp Automation
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            WhatsApp conversations, uploaded documents, SLA status and integration state.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw className={`mr-1 h-4 w-4 ${threadState.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Conversations</p>
              <p className="text-2xl font-bold">{threads.length}</p>
            </div>
            <MessageCircle className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Unread messages</p>
              <p className="text-2xl font-bold">{unreadTotal}</p>
            </div>
            <Inbox className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">Documents</p>
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
            <FileText className="text-muted-foreground h-5 w-5" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-muted-foreground text-xs">SLA overdue</p>
              <p className="text-2xl font-bold">{overdueCount}</p>
            </div>
            <Clock className={`h-5 w-5 ${overdueCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
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
          <TabsTrigger value="inbox" className="h-8 px-3 text-xs font-medium">
            Inbox ({threads.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="h-8 px-3 text-xs font-medium">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="sla" className="h-8 px-3 text-xs font-medium">
            SLA ({overdueCount} overdue)
          </TabsTrigger>
          <TabsTrigger value="ai-config" className="h-8 px-3 text-xs font-medium">
            AI &amp; integration
          </TabsTrigger>
        </TabsList>

        {/* ── INBOX ── */}
        <TabsContent value="inbox" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search thread, student or preview"
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={statusFilter === ALL ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(ALL)}
              >
                All
              </Button>
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

          <StateBlock
            state={threadState}
            onRetry={() => void loadThreads()}
            emptyText={
              threads.length === 0
                ? 'No WhatsApp conversation has been recorded yet.'
                : 'No conversation matches the current filters.'
            }
            icon={Inbox}
          >
            {filteredThreads.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conversation</TableHead>
                          <TableHead className="w-[100px]">Priority</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead className="w-[160px]">Assigned to</TableHead>
                          <TableHead className="w-[170px]">Last message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredThreads.map((thread) => (
                          <TableRow
                            key={thread.id}
                            className={`cursor-pointer ${selectedId === thread.id ? 'bg-muted/60' : ''}`}
                            onClick={() => setSelectedId(thread.id)}
                          >
                            <TableCell>
                              <p className="font-medium">
                                {thread.subject || thread.lastMessagePreview || thread.threadCode || 'Untitled conversation'}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {thread.threadCode || 'No thread code'}
                                {thread.studentId ? ` · Student ${thread.studentId}` : ''}
                                {thread.unreadCount ? ` · ${thread.unreadCount} unread` : ''}
                              </p>
                            </TableCell>
                            <TableCell>{priorityBadge(thread.priority)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {thread.status || 'unknown'}
                              </Badge>
                            </TableCell>
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
            ) : null}
          </StateBlock>

          {selectedThread && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedThread.subject || selectedThread.threadCode || 'Conversation'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground text-xs">Intent</p>
                    <p className="text-sm">{selectedThread.intent || 'general'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">SLA</p>
                    <p className="text-sm">
                      {selectedThread.slaStatus || 'none'}
                      {selectedThread.slaDueAt ? ` · due ${formatTimestamp(selectedThread.slaDueAt)}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Handling</p>
                    <p className="text-sm">
                      {selectedThread.isAiHandled ? 'AI was handling' : 'Human handling'}
                    </p>
                  </div>
                </div>

                {selectedThread.lastMessagePreview && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground text-xs">Latest message</p>
                      <p className="text-sm whitespace-pre-wrap">{selectedThread.lastMessagePreview}</p>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <label htmlFor={`handler-${selectedThread.id}`} className="text-muted-foreground text-xs">
                    Assign to
                  </label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id={`handler-${selectedThread.id}`}
                      value={handlerName}
                      onChange={(event) => setHandlerName(event.target.value)}
                      placeholder="Handler name"
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void assignThread(selectedThread)}
                      disabled={actingId === selectedThread.id}
                    >
                      <UserPlus className="mr-1 h-4 w-4" />
                      Assign
                    </Button>
                  </div>
                </div>

                <div>
                  <label htmlFor={`reply-${selectedThread.id}`} className="text-muted-foreground text-xs">
                    Reply
                  </label>
                  <Textarea
                    id={`reply-${selectedThread.id}`}
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
                    onClick={() => void sendReply(selectedThread)}
                    disabled={actingId === selectedThread.id}
                  >
                    <Send className="mr-1 h-4 w-4" />
                    {actingId === selectedThread.id ? 'Sending…' : 'Send reply'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setSelectedId(null)}>
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── DOCUMENTS ── */}
        <TabsContent value="documents" className="mt-4 space-y-4">
          <StateBlock
            state={docState}
            onRetry={() => void loadDocuments()}
            emptyText="No student document has been uploaded yet."
            icon={FileText}
          >
            {documents.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Document</TableHead>
                          <TableHead className="w-[130px]">Category</TableHead>
                          <TableHead className="w-[170px]">Student</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead className="w-[110px]">Size</TableHead>
                          <TableHead className="w-[170px]">Uploaded</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((document) => (
                          <TableRow key={document.id}>
                            <TableCell>
                              <p className="font-medium">{document.name || 'Untitled document'}</p>
                              {document.fileName ? (
                                <p className="text-muted-foreground text-xs">{document.fileName}</p>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {document.category || 'uncategorised'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              <p>{document.studentProfile?.fullName || 'Unknown student'}</p>
                              <p className="text-muted-foreground">
                                {document.studentProfile?.studentId || 'No student code'}
                              </p>
                            </TableCell>
                            <TableCell>
                              {docStatusBadge(document.status)}
                              {document.rejectionReason ? (
                                <p className="text-muted-foreground mt-1 text-[10px]">
                                  {document.rejectionReason}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatBytes(document.fileSize)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatTimestamp(document.uploadedAt || document.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </StateBlock>
        </TabsContent>

        {/* ── SLA ── */}
        <TabsContent value="sla" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response thresholds</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs">Target response</p>
                <p className="text-lg font-semibold">
                  {slaConfig.targetResponseMins != null ? `${slaConfig.targetResponseMins} min` : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Manager escalation</p>
                <p className="text-lg font-semibold">
                  {slaConfig.managerEscalationMins != null ? `${slaConfig.managerEscalationMins} min` : 'Not configured'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Super admin escalation</p>
                <p className="text-lg font-semibold">
                  {slaConfig.superAdminEscalationMins != null ? `${slaConfig.superAdminEscalationMins} min` : 'Not configured'}
                </p>
              </div>
            </CardContent>
          </Card>

          <StateBlock
            state={slaState}
            onRetry={() => void loadSla()}
            emptyText="No WhatsApp conversation is currently past the SLA window."
            icon={Clock}
          >
            {overdue.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Overdue conversations ({overdue.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Conversation</TableHead>
                          <TableHead className="w-[120px]">Status</TableHead>
                          <TableHead className="w-[170px]">Last updated</TableHead>
                          <TableHead className="w-[140px]">Waiting</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {overdue.map((conversation) => {
                          const waited = minutesSince(conversation.updatedAt);
                          return (
                            <TableRow key={conversation.id}>
                              <TableCell>
                                <p className="font-medium">{conversation.externalId || conversation.id}</p>
                                <p className="text-muted-foreground text-xs">
                                  {conversation.channel || 'unknown channel'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {conversation.status || 'unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-xs">
                                {formatTimestamp(conversation.updatedAt)}
                              </TableCell>
                              <TableCell className="text-xs">
                                {waited != null ? `${waited} min` : 'Unknown'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </StateBlock>

          {escalatedLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent escalations ({escalatedLogs.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead className="w-[200px]">Recorded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {escalatedLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {(log.action || '').replace(/_/g, ' ')}
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

        {/* ── AI & INTEGRATION ── */}
        <TabsContent value="ai-config" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StateBlock
                state={settingsState}
                onRetry={() => void loadSettings()}
                emptyText="Integration status is not available."
                icon={Bot}
              >
                <div className="space-y-3">
                  {(
                    [
                      ['whatsappIntegration', 'WhatsApp'],
                      ['emailIntegration', 'Email'],
                      ['smsIntegration', 'SMS'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {INTEGRATION_LABELS[integration[key] || ''] || integration[key] || 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </StateBlock>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                AI auto-reply behaviour is not configurable from this screen. The settings endpoint
                records an audit entry when a value is submitted but does not persist it, so no
                toggle is shown here — changing one would not take effect. Conversation-level
                handling state is visible in the inbox as &ldquo;AI was handling&rdquo; or
                &ldquo;Human handling&rdquo;, taken from the thread record.
              </span>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-muted-foreground text-xs">
        Conversation records do not store contact names or phone numbers, so threads are identified
        by thread code and student code. Document storage paths and file hashes are deliberately
        not displayed.
      </p>
    </div>
  );
}
