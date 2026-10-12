'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  CheckSquare, XCircle, Clock, RefreshCw, AlertTriangle, Inbox, Shield,
} from 'lucide-react';

// ============================================================
// RBAC Notes
// ============================================================
// Approve / reject rights are enforced server-side: /api/marketing/approvals
// is guarded by withAuth({ requireUserTypes: MARKETING, MARKETING_MANAGER,
// SUPER_ADMIN, ADMIN }) and stamps the reviewer from the session, so the
// reviewing identity can never be supplied by this UI.
// ============================================================

// ============================================================
// Types — mirror GET /api/marketing/approvals
// ============================================================

interface ApprovalUser {
  id: string;
  name: string | null;
  email: string | null;
}

interface MarketingApproval {
  id: string;
  itemType: string;
  itemId: string;
  title: string;
  description: string;
  status: string;
  rejectionNote: string;
  requestedById: string;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requestedBy?: ApprovalUser | null;
  reviewedBy?: ApprovalUser | null;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Awaiting review', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
};

function statusBadge(status: string) {
  const meta = STATUS_META[status] || {
    label: status || 'Unknown',
    cls: 'bg-gray-50 text-gray-600 border-gray-200',
  };
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

function personName(person?: ApprovalUser | null, fallbackId?: string | null): string {
  if (person?.name) return person.name;
  if (person?.email) return person.email;
  if (fallbackId) return fallbackId;
  return 'Not attributed';
}

export default function ApprovalQueueView() {
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState<MarketingApproval[]>([]);
  const [state, setState] = useState<LoadState>({ loading: true, error: null });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkSummary, setBulkSummary] = useState<string | null>(null);

  // `all` requests no status filter; the other tabs map straight onto the
  // route's `status` query parameter.
  const statusParam = activeTab === 'all' ? '' : activeTab;

  const loadApprovals = useCallback(async () => {
    setState({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (statusParam) params.set('status', statusParam);
      const response = await fetch(`/api/marketing/approvals?${params.toString()}`);
      if (!response.ok) throw new Error(`Could not load approvals (HTTP ${response.status})`);
      const payload = await response.json();
      setApprovals(Array.isArray(payload?.approvals) ? payload.approvals : []);
      setState({ loading: false, error: null });
    } catch (error) {
      setApprovals([]);
      setState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load approvals',
      });
    }
  }, [statusParam]);

  const loadCounts = useCallback(async () => {
    const statuses = ['pending', 'approved', 'rejected'];
    const results = await Promise.all(
      statuses.map(async (status) => {
        try {
          const response = await fetch(`/api/marketing/approvals?status=${status}&limit=1`);
          if (!response.ok) return [status, 0] as const;
          const payload = await response.json();
          return [status, Number(payload?.pagination?.total) || 0] as const;
        } catch {
          return [status, 0] as const;
        }
      }),
    );
    setCounts(Object.fromEntries(results));
  }, []);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const refreshAll = useCallback(async () => {
    setSelectedId(null);
    setBulkSelected(new Set());
    setBulkSummary(null);
    await Promise.all([loadApprovals(), loadCounts()]);
  }, [loadApprovals, loadCounts]);

  const selected = useMemo(
    () => approvals.find((approval) => approval.id === selectedId) || null,
    [approvals, selectedId],
  );

  const runAction = useCallback(async (
    approvalId: string,
    action: 'approve' | 'reject',
    note?: string,
  ): Promise<boolean> => {
    setActingId(approvalId);
    setActionError(null);
    try {
      const response = await fetch(`/api/marketing/approvals?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'reject' ? { approvalId, rejectionNote: note || '' } : { approvalId },
        ),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionError(payload?.error || `Could not ${action} this item (HTTP ${response.status})`);
        return false;
      }
      return true;
    } catch (error) {
      setActionError(error instanceof Error ? error.message : `Could not ${action} this item`);
      return false;
    } finally {
      setActingId(null);
    }
  }, []);

  const handleDecide = async (approvalId: string, action: 'approve' | 'reject') => {
    const ok = await runAction(approvalId, action, rejectionNote);
    if (!ok) return;
    setRejectionNote('');
    setSelectedId(null);
    await refreshAll();
  };

  const handleBulkApprove = async () => {
    if (bulkSelected.size === 0) return;
    setBulkRunning(true);
    setBulkSummary(null);
    let succeeded = 0;
    let failed = 0;
    for (const approvalId of Array.from(bulkSelected)) {
      const ok = await runAction(approvalId, 'approve');
      if (ok) succeeded += 1;
      else failed += 1;
    }
    setBulkRunning(false);
    setBulkSummary(
      `${succeeded} item${succeeded === 1 ? '' : 's'} approved${failed > 0 ? `, ${failed} could not be approved` : ''}.`,
    );
    setBulkSelected(new Set());
    await refreshAll();
  };

  const toggleBulk = (approvalId: string) => {
    setBulkSelected((current) => {
      const next = new Set(current);
      if (next.has(approvalId)) next.delete(approvalId);
      else next.add(approvalId);
      return next;
    });
  };

  const isPending = activeTab === 'pending';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Shield className="h-6 w-6 text-primary" />
            Approval Queue
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Marketing content and campaigns awaiting review, and the decisions already taken.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw className={`mr-1 h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(['pending', 'approved', 'rejected'] as const).map((status) => (
          <Card key={status}>
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-muted-foreground text-xs">{STATUS_META[status].label}</p>
                <p className="text-2xl font-bold">{counts[status] ?? 0}</p>
              </div>
              {status === 'pending' && <Clock className="text-muted-foreground h-5 w-5" />}
              {status === 'approved' && <CheckSquare className="h-5 w-5 text-green-600" />}
              {status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setSelectedId(null); }}>
        <TabsList className="h-9">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="h-8 px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {tab === 'all' ? 'All' : STATUS_META[tab].label}
              {tab !== 'all' && counts[tab] !== undefined ? ` (${counts[tab]})` : ''}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {isPending && bulkSelected.size > 0 && (
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                  <p className="text-sm">
                    {bulkSelected.size} item{bulkSelected.size === 1 ? '' : 's'} selected
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkSelected(new Set())}
                      disabled={bulkRunning}
                    >
                      Clear
                    </Button>
                    <Button size="sm" onClick={() => void handleBulkApprove()} disabled={bulkRunning}>
                      {bulkRunning ? 'Approving…' : 'Approve selected'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {bulkSummary && (
              <p className="text-sm text-emerald-700">{bulkSummary}</p>
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
                      onClick={() => void refreshAll()}
                    >
                      Try again
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {state.loading ? (
              <Card>
                <CardContent className="text-muted-foreground py-12 text-center text-sm">
                  Loading approvals…
                </CardContent>
              </Card>
            ) : approvals.length === 0 && !state.error ? (
              <Card>
                <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                  <Inbox className="h-8 w-8 opacity-30" />
                  <p className="text-sm">
                    {tab === 'pending'
                      ? 'Nothing is awaiting review right now.'
                      : tab === 'all'
                        ? 'No approval requests have been raised yet.'
                        : `Nothing has been ${STATUS_META[tab].label.toLowerCase()} yet.`}
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
                          {isPending && <TableHead className="w-[40px]" />}
                          <TableHead>Item</TableHead>
                          <TableHead className="w-[110px]">Type</TableHead>
                          <TableHead className="w-[130px]">Status</TableHead>
                          <TableHead className="w-[170px]">Requested by</TableHead>
                          <TableHead className="w-[170px]">Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvals.map((approval) => (
                          <TableRow
                            key={approval.id}
                            className={`cursor-pointer ${selectedId === approval.id ? 'bg-muted/60' : ''}`}
                            onClick={() => setSelectedId(approval.id)}
                          >
                            {isPending && (
                              <TableCell onClick={(event) => event.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${approval.title || approval.itemId}`}
                                  checked={bulkSelected.has(approval.id)}
                                  onChange={() => toggleBulk(approval.id)}
                                />
                              </TableCell>
                            )}
                            <TableCell>
                              <p className="font-medium">{approval.title || 'Untitled item'}</p>
                              {approval.description ? (
                                <p className="text-muted-foreground line-clamp-1 text-xs">
                                  {approval.description}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {approval.itemType || 'Unspecified'}
                              </Badge>
                            </TableCell>
                            <TableCell>{statusBadge(approval.status)}</TableCell>
                            <TableCell className="text-xs">
                              {personName(approval.requestedBy, approval.requestedById)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {formatTimestamp(approval.createdAt)}
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
        ))}
      </Tabs>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {selected.title || 'Untitled item'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="mt-1">{statusBadge(selected.status)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Item type</p>
                <p className="text-sm">{selected.itemType || 'Unspecified'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Linked record</p>
                <p className="text-sm">{selected.itemId || 'Not linked'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Requested by</p>
                <p className="text-sm">
                  {personName(selected.requestedBy, selected.requestedById)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Submitted</p>
                <p className="text-sm">{formatTimestamp(selected.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Reviewed</p>
                <p className="text-sm">
                  {selected.reviewedAt
                    ? `${personName(selected.reviewedBy, selected.reviewedById)} — ${formatTimestamp(selected.reviewedAt)}`
                    : 'Not yet reviewed'}
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-muted-foreground text-xs">Description</p>
              <p className="text-sm whitespace-pre-wrap">
                {selected.description || 'No description was provided with this request.'}
              </p>
            </div>

            {selected.rejectionNote && (
              <div>
                <p className="text-muted-foreground text-xs">Reviewer note</p>
                <p className="text-sm whitespace-pre-wrap">{selected.rejectionNote}</p>
              </div>
            )}

            {actionError && (
              <p className="text-destructive text-sm">{actionError}</p>
            )}

            {selected.status === 'pending' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="rejection-note" className="text-muted-foreground text-xs">
                    Note for the requester (sent with a rejection)
                  </label>
                  <Textarea
                    id="rejection-note"
                    value={rejectionNote}
                    onChange={(event) => setRejectionNote(event.target.value)}
                    placeholder="Explain what needs to change"
                    className="mt-1 text-sm"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleDecide(selected.id, 'approve')}
                    disabled={actingId === selected.id}
                  >
                    <CheckSquare className="mr-1 h-4 w-4" />
                    {actingId === selected.id ? 'Working…' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDecide(selected.id, 'reject')}
                    disabled={actingId === selected.id}
                  >
                    <XCircle className="mr-1 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-xs">
        Reviewer identity is taken from the signed-in session on the server, and only marketing
        managers and administrators can record a decision.
      </p>
    </div>
  );
}
