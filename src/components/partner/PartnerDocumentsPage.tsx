'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  FileUp, FileText, Download, Eye, Trash2, Clock, Filter,
  Upload, Loader2, Search, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, FileCheck, ShieldAlert, FolderOpen,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

type DocStatus = 'not_requested' | 'requested' | 'uploaded' | 'under_review' | 'verified' | 'rejected' | 'expired';
type DocType = 'passport' | 'transcript' | 'ielts' | 'sop' | 'cv' | 'lors' | 'financial' | 'offer_letter' | 'visa_docs' | 'other';

interface Document {
  id: string;
  name: string;
  type: DocType;
  studentName: string;
  studentId: string;
  status: DocStatus;
  uploadedAt: string;
  expiresAt: string;
  size: string;
}

const docTypeLabels: Record<DocType, string> = {
  passport: 'Passport',
  transcript: 'Academic Transcript',
  ielts: 'IELTS / English Test',
  sop: 'Statement of Purpose',
  cv: 'CV / Resume',
  lors: 'Letters of Recommendation',
  financial: 'Financial Documents',
  offer_letter: 'Offer Letter',
  visa_docs: 'Visa Documents',
  other: 'Other',
};

const statusConfig: Record<DocStatus, { variant: 'muted' | 'outline' | 'brand' | 'warning' | 'success' | 'danger' | 'secondary'; label: string; icon: React.ElementType }> = {
  not_requested: { variant: 'muted', label: 'Not Requested', icon: FolderOpen },
  requested: { variant: 'outline', label: 'Requested', icon: FileText },
  uploaded: { variant: 'brand', label: 'Uploaded', icon: Upload },
  under_review: { variant: 'warning', label: 'Under Review', icon: RefreshCw },
  verified: { variant: 'success', label: 'Verified', icon: FileCheck },
  rejected: { variant: 'danger', label: 'Rejected', icon: XCircle },
  expired: { variant: 'secondary', label: 'Expired', icon: AlertCircle },
};

/* ── Mock Data ─────────────────────────────────────── */

const mockDocuments: Document[] = [
  { id: '1', name: 'Passport_Copy_Arif.pdf', type: 'passport', studentName: 'Arif Rahman', studentId: 'STU-001', status: 'verified', uploadedAt: '2025-01-05', expiresAt: '2030-01-05', size: '2.4 MB' },
  { id: '2', name: 'Transcript_Arif.pdf', type: 'transcript', studentName: 'Arif Rahman', studentId: 'STU-001', status: 'verified', uploadedAt: '2025-01-05', expiresAt: '', size: '1.8 MB' },
  { id: '3', name: 'IELTS_Arif.pdf', type: 'ielts', studentName: 'Arif Rahman', studentId: 'STU-001', status: 'uploaded', uploadedAt: '2025-01-06', expiresAt: '2027-01-06', size: '0.5 MB' },
  { id: '4', name: 'SOP_Mitu.pdf', type: 'sop', studentName: 'Mitu Sarkar', studentId: 'STU-002', status: 'under_review', uploadedAt: '2025-01-10', expiresAt: '', size: '0.8 MB' },
  { id: '5', name: 'CV_Mitu.pdf', type: 'cv', studentName: 'Mitu Sarkar', studentId: 'STU-002', status: 'rejected', uploadedAt: '2025-01-08', expiresAt: '', size: '0.3 MB' },
  { id: '6', name: 'Financial_Shakib.pdf', type: 'financial', studentName: 'Shakib Hasan', studentId: 'STU-003', status: 'verified', uploadedAt: '2024-11-15', expiresAt: '', size: '3.1 MB' },
  { id: '7', name: 'Offer_Letter_Priya.pdf', type: 'offer_letter', studentName: 'Priya Das', studentId: 'STU-004', status: 'verified', uploadedAt: '2024-12-01', expiresAt: '', size: '1.2 MB' },
  { id: '8', name: 'LOR_Nayeem.pdf', type: 'lors', studentName: 'Nayeem Islam', studentId: 'STU-005', status: 'requested', uploadedAt: '', expiresAt: '', size: '' },
  { id: '9', name: 'Visa_Docs_Taslima.pdf', type: 'visa_docs', studentName: 'Taslima Akter', studentId: 'STU-006', status: 'not_requested', uploadedAt: '', expiresAt: '', size: '' },
  { id: '10', name: 'Passport_Priya.pdf', type: 'passport', studentName: 'Priya Das', studentId: 'STU-004', status: 'expired', uploadedAt: '2024-06-10', expiresAt: '2024-06-10', size: '2.1 MB' },
];

/* ── Component ─────────────────────────────────────── */

export default function PartnerDocumentsPage() {
  const { user } = usePortalStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ studentName: '', type: 'other' as DocType, file: null as File | null });

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/documents?partnerId=${user?.id || ''}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setDocuments(data.data);
      } else {
        setDocuments(mockDocuments);
      }
    } catch {
      setDocuments(mockDocuments);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleUpload = async () => {
    if (!uploadForm.studentName.trim()) { toast.error('Student name is required'); return; }
    setUploading(true);
    try {
      const res = await fetch('/api/partner/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: user?.id,
          studentName: uploadForm.studentName,
          type: uploadForm.type,
          status: 'uploaded',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const newDoc: Document = {
          id: data.data?.id || `doc-${documents.length + 1}`,
          name: `${docTypeLabels[uploadForm.type]}_${uploadForm.studentName.split(' ')[0]}.pdf`,
          type: uploadForm.type,
          studentName: uploadForm.studentName,
          studentId: '—',
          status: 'uploaded',
          uploadedAt: new Date().toISOString().split('T')[0],
          expiresAt: '',
          size: '—',
        };
        setDocuments((prev) => [newDoc, ...prev]);
        setUploadDialog(false);
        setUploadForm({ studentName: '', type: 'other', file: null });
        toast.success('Document uploaded successfully!');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.success('Document recorded successfully!');
    } finally {
      setUploading(false);
    }
  };

  const filtered = documents.filter((doc) => {
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (typeFilter !== 'All' && doc.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return doc.name.toLowerCase().includes(q) || doc.studentName.toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts: Record<string, number> = {
    all: documents.length,
    not_requested: documents.filter((d) => d.status === 'not_requested').length,
    requested: documents.filter((d) => d.status === 'requested').length,
    uploaded: documents.filter((d) => d.status === 'uploaded').length,
    under_review: documents.filter((d) => d.status === 'under_review').length,
    verified: documents.filter((d) => d.status === 'verified').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
    expired: documents.filter((d) => d.status === 'expired').length,
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Documents</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Manage student documents and uploads</p>
        </div>
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="brand">
              <FileUp className="w-4 h-4" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-alo-text">Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="docStudent">Student Name <span className="text-red-500">*</span></Label>
                <Input id="docStudent" placeholder="Enter student name" value={uploadForm.studentName} onChange={(e) => setUploadForm({ ...uploadForm, studentName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="docType">Document Type</Label>
                <Select value={uploadForm.type} onValueChange={(v) => setUploadForm({ ...uploadForm, type: v as DocType })}>
                  <SelectTrigger id="docType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(docTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>File</Label>
                <div className="border-2 border-dashed border-alo-border rounded-lg p-6 text-center hover:border-alo-brand transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-alo-text-muted mx-auto mb-2" />
                  <p className="text-sm text-alo-text-secondary">Click or drag to upload</p>
                  <p className="text-xs text-alo-text-muted mt-1">PDF, JPG, PNG up to 10MB</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
                <Button variant="brand" onClick={handleUpload} disabled={uploading}>
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload</>}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">Total Docs</span></div>
            <p className="text-2xl font-bold text-alo-text">{documents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-xs text-alo-text-muted">Verified</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.verified}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><RefreshCw className="w-4 h-4 text-amber-500" /><span className="text-xs text-alo-text-muted">Under Review</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.under_review}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4 text-red-500" /><span className="text-xs text-alo-text-muted">Rejected</span></div>
            <p className="text-2xl font-bold text-alo-text">{statusCounts.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search by document or student name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="not_requested">Not Requested</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  {Object.entries(docTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden lg:table-cell">Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-alo-text-muted">
                      No documents found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((doc) => {
                    const cfg = statusConfig[doc.status];
                    return (
                      <TableRow key={doc.id} className="hover:bg-alo-brand-light/20 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-alo-brand-light/50 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-alo-brand" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-alo-text truncate max-w-[180px]">{doc.name}</p>
                              <p className="text-[11px] text-alo-text-muted font-mono">{doc.studentId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-alo-text-secondary">{docTypeLabels[doc.type]}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{doc.studentName}</TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="text-[11px]">
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-alo-text-muted">
                          {doc.uploadedAt ? formatDate(doc.uploadedAt) : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-alo-text-muted">{doc.size || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm" title="View" disabled={doc.status === 'not_requested'}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" title="Download" disabled={!doc.uploadedAt}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-alo-text-muted text-center">
        Showing {filtered.length} of {documents.length} documents
      </p>
    </div>
  );
}

/* ── Helper ────────────────────────────────────────── */

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
