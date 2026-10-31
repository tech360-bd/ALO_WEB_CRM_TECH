'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { FileUp, FileText, Download, Clock, Filter, Upload, Loader2, Search, CheckCircle2, XCircle, AlertCircle, RefreshCw, FileCheck } from 'lucide-react';

const PAGE_SIZE = 20;
const DOCUMENT_CATEGORIES = [
  ['passport', 'Passport'], ['transcript', 'Academic transcript'], ['english_test', 'English test'],
  ['sop', 'Statement of purpose'], ['cv', 'CV / Resume'], ['recommendation_letter', 'Recommendation letter'],
  ['financial', 'Financial document'], ['offer_letter', 'Offer letter'], ['visa_document', 'Visa document'], ['other', 'Other'],
] as const;
interface StudentOption { id: string; studentId: string; name: string }
interface DocumentRow {
  id: string;
  name: string;
  category: string;
  fileName: string;
  studentName: string;
  studentId: string;
  status: string;
  uploadedAt: string;
  fileSize: number;
  rejectionReason: string;
}

function statusInfo(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'verified' || normalized === 'accepted') return { label: 'Verified', variant: 'success' as const, icon: FileCheck };
  if (normalized === 'rejected') return { label: 'Rejected', variant: 'danger' as const, icon: XCircle };
  if (normalized === 'needs_info' || normalized === 'needs_update') return { label: 'Needs update', variant: 'warning' as const, icon: AlertCircle };
  if (normalized === 'uploaded' || normalized === 'pending_review' || normalized === 'under_review') return { label: 'Under review', variant: 'warning' as const, icon: Clock };
  return { label: normalized ? normalized.replace(/[_-]+/g, ' ') : 'Status not recorded', variant: 'outline' as const, icon: FileText };
}
function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatSize(bytes: number) { return bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : '—'; }
function formatLabel(value: string) { return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()); }

export default function PartnerDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [studentProfileId, setStudentProfileId] = useState('');
  const [category, setCategory] = useState('other');
  const [file, setFile] = useState<File | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const [documentsResponse, studentsResponse] = await Promise.all([
        fetch(`/api/partner/documents?${params}`, { credentials: 'include' }),
        fetch('/api/partner/students?page=1&limit=100', { credentials: 'include' }),
      ]);
      const [documentPayload, studentPayload] = await Promise.all([
        documentsResponse.json().catch(() => ({})),
        studentsResponse.json().catch(() => ({})),
      ]);
      if (!documentsResponse.ok || !documentPayload.success || !Array.isArray(documentPayload.data)) {
        throw new Error(documentPayload.error || `Could not load documents (HTTP ${documentsResponse.status})`);
      }
      setDocuments(documentPayload.data.map((document: any): DocumentRow => ({
        id: String(document.id || ''),
        name: String(document.name || document.fileName || 'Document'),
        category: String(document.category || 'other'),
        fileName: String(document.fileName || ''),
        studentName: String(document.studentProfile?.fullName || 'Student name unavailable'),
        studentId: String(document.studentProfile?.studentId || ''),
        status: String(document.status || ''),
        uploadedAt: String(document.uploadedAt || document.createdAt || ''),
        fileSize: Number(document.fileSize || 0),
        rejectionReason: String(document.rejectionReason || ''),
      })));
      setStats(documentPayload.stats || {});
      setTotal(Number(documentPayload.pagination?.total || 0));
      setTotalPages(Math.max(1, Number(documentPayload.pagination?.totalPages || 1)));
      if (studentsResponse.ok && studentPayload.success && Array.isArray(studentPayload.data)) {
        setStudents(studentPayload.data.map((student: any): StudentOption => ({
          id: String(student.id || ''), studentId: String(student.studentId || ''), name: String(student.fullName || 'Student name unavailable'),
        })));
        setStudentError(null);
      } else {
        setStudents([]);
        setStudentError(studentPayload.error || 'Could not load partner student profiles.');
      }
    } catch (caught) {
      setDocuments([]);
      setTotal(0);
      setTotalPages(1);
      setError(caught instanceof Error ? caught.message : 'Could not load partner documents.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => { void fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async () => {
    if (!studentProfileId) { toast.error('Select a linked student profile.'); return; }
    if (!file) { toast.error('Choose a document file to upload.'); return; }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('studentProfileId', studentProfileId);
      body.append('category', category);
      body.append('file', file);
      const response = await fetch('/api/partner/documents', { method: 'POST', credentials: 'include', body });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Upload failed (HTTP ${response.status})`);
      toast.success('File uploaded privately and queued for review.');
      setUploadDialog(false);
      setFile(null);
      setStudentProfileId('');
      setCategory('other');
      await fetchDocuments();
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Document upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: DocumentRow) => {
    setDownloadingId(document.id);
    try {
      const response = await fetch(`/api/partner/documents/${encodeURIComponent(document.id)}/download`, { credentials: 'include' });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Download failed (HTTP ${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.fileName || document.name || 'document';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Could not download this file.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-20 w-full rounded-xl" />)}</div><Skeleton className="h-[400px] w-full rounded-xl" /></div>;

  const pendingCount = (stats.pending || 0) + (stats.pending_review || 0) + (stats.under_review || 0) + (stats.uploaded || 0);

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Documents</h1><p className="text-sm text-alo-text-muted mt-0.5">Private student files linked to your partner account</p></div><Dialog open={uploadDialog} onOpenChange={setUploadDialog}><DialogTrigger asChild><Button variant="brand" disabled={students.length === 0}><FileUp className="w-4 h-4" />Upload Document</Button></DialogTrigger><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle className="text-alo-text">Upload Student Document</DialogTitle></DialogHeader><div className="space-y-4 pt-2"><div className="space-y-2"><Label htmlFor="docStudent">Student profile</Label><Select value={studentProfileId} onValueChange={setStudentProfileId}><SelectTrigger id="docStudent"><SelectValue placeholder="Select a linked student" /></SelectTrigger><SelectContent>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name}{student.studentId ? ` · ${student.studentId}` : ''}</SelectItem>)}</SelectContent></Select>{studentError && <p className="text-xs text-crm-warning-text">{studentError}</p>}</div><div className="space-y-2"><Label htmlFor="docCategory">Document category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger id="docCategory"><SelectValue /></SelectTrigger><SelectContent>{DOCUMENT_CATEGORIES.map(([value, title]) => <SelectItem key={value} value={value}>{title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="docFile">File (PDF or image, max 20 MB)</Label><Input id="docFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp" onChange={(event) => setFile(event.target.files?.[0] || null)} /><p className="text-xs text-alo-text-muted">File bytes are stored in private storage and the document is queued for review.</p></div><div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setUploadDialog(false)} disabled={uploading}>Cancel</Button><Button variant="brand" onClick={() => void handleUpload()} disabled={uploading || students.length === 0}>{uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Upload className="w-4 h-4" />Upload</>}</Button></div></div></DialogContent></Dialog></div>

      {error && <Card className="border-crm-warning-border bg-crm-warning-bg"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-crm-warning-text">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchDocuments()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><Metric title="Records matching filter" value={total} icon={FileText} /><Metric title="Verified" value={stats.verified || stats.accepted || 0} icon={CheckCircle2} /><Metric title="Pending review" value={pendingCount} icon={Clock} /><Metric title="Rejected" value={stats.rejected || 0} icon={XCircle} /></div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="flex flex-col sm:flex-row gap-3 p-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search document or student name/ID..." className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div><div className="flex items-center gap-2"><Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" /><Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="needs_info">Needs update</SelectItem></SelectContent></Select><Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setPage(1); }}><SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{DOCUMENT_CATEGORIES.map(([value, title]) => <SelectItem key={value} value={value}>{title}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader><CardTitle className="text-base font-semibold text-alo-text">Student Documents</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar"><Table><TableHeader className="sticky top-0 bg-white z-10"><TableRow><TableHead>Document</TableHead><TableHead className="hidden sm:table-cell">Category</TableHead><TableHead>Student</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Uploaded</TableHead><TableHead className="hidden lg:table-cell">Size</TableHead><TableHead>File</TableHead></TableRow></TableHeader><TableBody>
        {documents.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-alo-text-muted">{error ? 'Document records could not be loaded.' : 'No student documents match this page and filter.'}</TableCell></TableRow> : documents.map((document) => { const info = statusInfo(document.status); const Icon = info.icon; return <TableRow key={document.id} className="hover:bg-alo-brand-light/20"><TableCell><div className="flex items-center gap-2 min-w-0"><div className="w-8 h-8 rounded-lg bg-alo-brand-light/50 flex items-center justify-center shrink-0"><FileText className="w-4 h-4 text-alo-brand" /></div><div className="min-w-0"><p className="text-sm font-medium text-alo-text truncate max-w-[180px]">{document.name}</p><p className="text-[11px] text-alo-text-muted font-mono">{document.studentId || 'Student ID not recorded'}</p></div></div>{document.rejectionReason && <p className="mt-1 text-xs text-crm-danger-text">Review note: {document.rejectionReason}</p>}</TableCell><TableCell className="hidden sm:table-cell text-xs text-alo-text-secondary">{formatLabel(document.category)}</TableCell><TableCell className="text-sm text-alo-text-secondary">{document.studentName}</TableCell><TableCell><Badge variant={info.variant} className="text-[11px]"><Icon className="mr-1 h-3 w-3" />{info.label}</Badge></TableCell><TableCell className="hidden md:table-cell text-xs text-alo-text-muted">{formatDate(document.uploadedAt)}</TableCell><TableCell className="hidden lg:table-cell text-xs text-alo-text-muted">{formatSize(document.fileSize)}</TableCell><TableCell><Button variant="outline" size="sm" onClick={() => void handleDownload(document)} disabled={!document.fileName || downloadingId === document.id}>{downloadingId === document.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}<span className="sr-only">Download {document.fileName || document.name}</span></Button></TableCell></TableRow>; })}
        </TableBody></Table></div></CardContent></Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-text-muted"><p>Showing {documents.length} of {total} matching document records · file downloads are private and partner-scoped</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button><span>{page} / {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</Button></div></div>
    </div>
  );
}

function Metric({ title, value, icon: Icon }: { title: string; value: number; icon: typeof FileText }) {
  return <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Icon className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">{title}</span></div><p className="text-2xl font-bold text-alo-text">{value}</p></CardContent></Card>;
}
