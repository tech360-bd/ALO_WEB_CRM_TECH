'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  FileText, CheckCircle2, XCircle, RefreshCw, AlertTriangle,
  Inbox, Search, Info,
} from 'lucide-react';

// ============================================================
// Types — mirror GET /api/crm/documents
// ============================================================

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
    user?: { email: string | null; phone: string | null } | null;
  } | null;
}

interface LoadState {
  loading: boolean;
  error: string | null;
}

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending review', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  pending_review: { label: 'Pending review', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
  needs_update: { label: 'Needs update', cls: 'bg-sky-100 text-sky-700 border-sky-200' },
};

function statusBadge(status: string) {
  const meta = STATUS_META[status] || { label: status || 'Unknown', cls: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]' };
  return <Badge variant="outline" className={`text-[11px] ${meta.cls}`}>{meta.label}</Badge>;
}

function formatBytes(size?: number): string {
  if (!size || size <= 0) return 'Size not recorded';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString();
}

export default function EmployeeDocumentsPage() {
  const [pending, setPending] = useState<StudentDocument[]>([]);
  const [pendingState, setPendingState] = useState<LoadState>({ loading: true, error: null });
  const [pendingTotal, setPendingTotal] = useState(0);

  const [reviewed, setReviewed] = useState<StudentDocument[]>([]);
  const [reviewedState, setReviewedState] = useState<LoadState>({ loading: true, error: null });
  const [reviewedTotal, setReviewedTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    setPendingState({ loading: true, error: null });
    try {
      const params = new URLSearchParams({ status: 'pending,pending_review', limit: '100' });
      const term = searchQuery.trim();
      if (term) params.set('search', term);
      const response = await fetch(`/api/crm/documents?${params.toString()}`);
      if (!response.ok) throw new Error(`Could not load the review queue (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'The review queue returned no data');
      setPending(Array.isArray(payload.data) ? payload.data : []);
      setPendingTotal(Number(payload.total) || 0);
      setPendingState({ loading: false, error: null });
    } catch (error) {
      setPending([]);
      setPendingState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load the review queue',
      });
    }
  }, [searchQuery]);

  const loadReviewed = useCallback(async () => {
    setReviewedState({ loading: true, error: null });
    try {
      const params = new URLSearchParams({
        status: 'approved,rejected,needs_update',
        limit: '100',
        sortBy: 'updatedAt',
      });
      const term = searchQuery.trim();
      if (term) params.set('search', term);
      const response = await fetch(`/api/crm/documents?${params.toString()}`);
      if (!response.ok) throw new Error(`Could not load completed reviews (HTTP ${response.status})`);
      const payload = await response.json();
      if (!payload?.success) throw new Error(payload?.error || 'Completed reviews returned no data');
      setReviewed(Array.isArray(payload.data) ? payload.data : []);
      setReviewedTotal(Number(payload.total) || 0);
      setReviewedState({ loading: false, error: null });
    } catch (error) {
      setReviewed([]);
      setReviewedState({
        loading: false,
        error: error instanceof Error ? error.message : 'Could not load completed reviews',
      });
    }
  }, [searchQuery]);

  useEffect(() => {
    void loadPending();
    void loadReviewed();
  }, [loadPending, loadReviewed]);

  const refreshAll = async () => {
    setSelectedId(null);
    setActionError(null);
    await Promise.all([loadPending(), loadReviewed()]);
  };

  const selected = useMemo(
    () => pending.find((document) => document.id === selectedId) || null,
    [pending, selectedId],
  );

  const reviewDocument = async (document: StudentDocument, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !note.trim()) {
      setActionError('Add a reason before rejecting a document, so the student knows what to fix.');
      return;
    }
    setActingId(document.id);
    setActionError(null);
    try {
      const response = await fetch('/api/crm/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: document.id,
          status,
          rejectionReason: status === 'rejected' ? note.trim() : '',
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        setActionError(payload?.error || `Could not record the review (HTTP ${response.status})`);
        return;
      }
      setNote('');
      setSelectedId(null);
      await refreshAll();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not record the review');
    } finally {
      setActingId(null);
    }
  };

  const errorBlock = (state: LoadState, onRetry: () => void) => (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileText className="h-6 w-6 text-primary" />
            Document Review
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Student documents awaiting verification, and the reviews already recorded.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refreshAll()}>
          <RefreshCw
            className={`mr-1 h-4 w-4 ${pendingState.loading || reviewedState.loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search student, document name or category"
          className="pl-8"
        />
      </div>

      {actionError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-medium">{actionError}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="h-9">
          <TabsTrigger value="pending" className="h-8 px-3 text-xs font-medium">
            Awaiting review ({pendingTotal})
          </TabsTrigger>
          <TabsTrigger value="reviewed" className="h-8 px-3 text-xs font-medium">
            Completed ({reviewedTotal})
          </TabsTrigger>
        </TabsList>

        {/* ── PENDING ── */}
        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingState.error && errorBlock(pendingState, () => void loadPending())}

          {pendingState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading the review queue…
              </CardContent>
            </Card>
          ) : pending.length === 0 && !pendingState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <Inbox className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {searchQuery.trim()
                    ? 'No pending document matches that search.'
                    : 'No document is awaiting review.'}
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
                        <TableHead>Document</TableHead>
                        <TableHead className="w-[130px]">Category</TableHead>
                        <TableHead className="w-[180px]">Student</TableHead>
                        <TableHead className="w-[110px]">Size</TableHead>
                        <TableHead className="w-[140px]">Uploaded</TableHead>
                        <TableHead className="w-[110px] text-right">Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <p className="font-medium">{document.name || 'Untitled document'}</p>
                            {document.fileName ? (
                              <p className="text-muted-foreground text-xs">{document.fileName}</p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {document.category || 'uncategorised'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <p>{document.studentProfile?.fullName || 'Unknown student'}</p>
                            <p className="text-muted-foreground">
                              {document.studentProfile?.studentId || 'No student code'}
                            </p>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatBytes(document.fileSize)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {formatDate(document.uploadedAt || document.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedId(document.id)}
                            >
                              Open
                            </Button>
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

        {/* ── COMPLETED ── */}
        <TabsContent value="reviewed" className="mt-4 space-y-4">
          {reviewedState.error && errorBlock(reviewedState, () => void loadReviewed())}

          {reviewedState.loading ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                Loading completed reviews…
              </CardContent>
            </Card>
          ) : reviewed.length === 0 && !reviewedState.error ? (
            <Card>
              <CardContent className="text-muted-foreground flex flex-col items-center gap-2 py-14 text-center">
                <CheckCircle2 className="h-8 w-8 opacity-30" />
                <p className="text-sm">
                  {searchQuery.trim()
                    ? 'No reviewed document matches that search.'
                    : 'No review has been recorded yet.'}
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
                        <TableHead>Document</TableHead>
                        <TableHead className="w-[180px]">Student</TableHead>
                        <TableHead className="w-[140px]">Decision</TableHead>
                        <TableHead className="w-[160px]">Reviewed by</TableHead>
                        <TableHead>Note</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reviewed.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <p className="font-medium">{document.name || 'Untitled document'}</p>
                            <p className="text-muted-foreground text-xs">
                              {document.category || 'uncategorised'}
                            </p>
                          </TableCell>
                          <TableCell className="text-xs">
                            <p>{document.studentProfile?.fullName || 'Unknown student'}</p>
                            <p className="text-muted-foreground">
                              {document.studentProfile?.studentId || 'No student code'}
                            </p>
                          </TableCell>
                          <TableCell>{statusBadge(document.status)}</TableCell>
                          <TableCell className="text-xs">
                            {document.reviewedBy || <span className="text-muted-foreground">Not attributed</span>}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[260px] text-xs">
                            {document.rejectionReason || '—'}
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

      {/* ── REVIEW PANEL ── */}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{selected.name || 'Untitled document'}</CardTitle>
            <CardDescription className="text-xs">
              {selected.category || 'uncategorised'}
              {selected.fileName ? ` · ${selected.fileName}` : ''} · {formatBytes(selected.fileSize)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground text-xs">Student</p>
                <p className="text-sm">
                  {selected.studentProfile?.fullName || 'Unknown student'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {selected.studentProfile?.studentId || 'No student code'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Uploaded</p>
                <p className="text-sm">
                  {formatDate(selected.uploadedAt || selected.createdAt)}
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="review-note" className="text-muted-foreground text-xs">
                Note for the student (required when rejecting)
              </label>
              <Textarea
                id="review-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Explain what needs to change"
                className="mt-1 text-sm"
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void reviewDocument(selected, 'approved')}
                disabled={actingId === selected.id}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                {actingId === selected.id ? 'Recording…' : 'Approve document'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void reviewDocument(selected, 'rejected')}
                disabled={actingId === selected.id}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject document
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSelectedId(null); setNote(''); }}
                disabled={actingId === selected.id}
              >
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="text-muted-foreground flex items-start gap-2 pt-6 text-xs">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Reviews are recorded against the document with your name and written to the audit
            trail. File storage paths and hashes are deliberately not displayed, and documents are
            never served from a public URL.
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
