'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  XCircle,
  ArrowRight,
  AlertCircle,
  FileCheck,
  GraduationCap,
  Award,
  CreditCard,
  BookOpen,
  File,
  Languages,
  Building2,
  Zap,
  Users,
  IdCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StatCard,
  SectionCard,
  PageHeader,
  QuickAction,
  EmptyState,
  LoadingGrid,
  PipelineStage,
  StatusBadge,
  Icon,
  CompletionRing,
} from '@/components/alo/shared';
import { DOC_STATUS_COLORS, fmtDate, timeAgo } from '@/lib/alo-types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentHubProps {
  onNavigate?: (view: string, slug?: string) => void;
}

interface DocRow {
  id: string;
  studentId: string;
  studentName: string;
  category: string;
  name: string;
  required: boolean;
  status: string;
  fileName: string | null;
  uploadedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  rejectionReason: string | null;
  [key: string]: unknown;
}

interface MissingDocAlert {
  studentId: string;
  studentName: string;
  missingDocs: string[];
  deadline: string;
  urgency: 'critical' | 'high' | 'medium';
}

interface VerificationItem {
  id: string;
  studentName: string;
  docType: string;
  uploadedAt: string;
  fileName: string;
}

interface DocTypeLegendItem {
  type: string;
  icon: string;
  total: number;
  uploaded: number;
  verified: number;
  pending: number;
}

interface DashboardStats {
  counts?: Record<string, number>;
 docsByStatus?: Record<string, number>;
 [key: string]: unknown;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DOC_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  UPLOADED: 'Uploaded',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Verified',
  REJECTED: 'Rejected',
  REQUIRED: 'Required',
};

const URGENCY_COLORS: Record<string, string> = {
  critical: 'bg-rose-100 text-rose-700',
  high: 'bg-amber-100 text-amber-700',
  medium: 'bg-alo-blue-light text-alo-blue',
};

const URGENCY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
};

// ─── Demo Fallback Data ──────────────────────────────────────────────────────

const DEMO_STATS: DashboardStats = {
  counts: { documents: 347, uploaded: 218, verified: 156, pendingReview: 62 },
  docsByStatus: { PENDING: 34, UPLOADED: 67, UNDER_REVIEW: 23, APPROVED: 89, REJECTED: 5 },
};

const DEMO_DOCS: DocRow[] = [
  { id: 'doc1', studentId: 's1', studentName: 'Ahmed Al-Rashid', category: 'Passport', name: 'Passport Copy', required: true, status: 'APPROVED', fileName: 'passport_ahmed.pdf', uploadedAt: '2025-01-10T10:00:00Z', reviewedAt: '2025-01-11T09:00:00Z', reviewedById: 'u1', reviewedByName: 'Sarah Johnson', rejectionReason: null },
  { id: 'doc2', studentId: 's1', studentName: 'Ahmed Al-Rashid', category: 'Transcript', name: 'Academic Transcripts', required: true, status: 'APPROVED', fileName: 'transcript_ahmed.pdf', uploadedAt: '2025-01-10T10:30:00Z', reviewedAt: '2025-01-11T09:30:00Z', reviewedById: 'u1', reviewedByName: 'Sarah Johnson', rejectionReason: null },
  { id: 'doc3', studentId: 's1', studentName: 'Ahmed Al-Rashid', category: 'IELTS', name: 'IELTS Certificate', required: true, status: 'UNDER_REVIEW', fileName: 'ielts_ahmed.pdf', uploadedAt: '2025-01-14T14:00:00Z', reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc4', studentId: 's2', studentName: 'Priya Sharma', category: 'Passport', name: 'Passport Copy', required: true, status: 'APPROVED', fileName: 'passport_priya.pdf', uploadedAt: '2025-01-08T12:00:00Z', reviewedAt: '2025-01-09T10:00:00Z', reviewedById: 'u2', reviewedByName: 'Mike Chen', rejectionReason: null },
  { id: 'doc5', studentId: 's2', studentName: 'Priya Sharma', category: 'SOP', name: 'Statement of Purpose', required: true, status: 'UPLOADED', fileName: 'sop_priya.pdf', uploadedAt: '2025-01-15T09:00:00Z', reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc6', studentId: 's2', studentName: 'Priya Sharma', category: 'LOR', name: 'Letter of Recommendation', required: true, status: 'PENDING', fileName: null, uploadedAt: null, reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc7', studentId: 's3', studentName: 'James Okonkwo', category: 'Bank Statement', name: 'Bank Statement', required: true, status: 'REJECTED', fileName: 'bank_james.pdf', uploadedAt: '2025-01-12T11:00:00Z', reviewedAt: '2025-01-13T10:00:00Z', reviewedById: 'u1', reviewedByName: 'Sarah Johnson', rejectionReason: 'Insufficient funds shown — minimum 6 months required' },
  { id: 'doc8', studentId: 's3', studentName: 'James Okonkwo', category: 'CV', name: 'Curriculum Vitae', required: true, status: 'APPROVED', fileName: 'cv_james.pdf', uploadedAt: '2025-01-11T15:00:00Z', reviewedAt: '2025-01-12T09:00:00Z', reviewedById: 'u2', reviewedByName: 'Mike Chen', rejectionReason: null },
  { id: 'doc9', studentId: 's4', studentName: 'Fatima Hassan', category: 'Passport', name: 'Passport Copy', required: true, status: 'UPLOADED', fileName: 'passport_fatima.pdf', uploadedAt: '2025-01-16T08:00:00Z', reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc10', studentId: 's4', studentName: 'Fatima Hassan', category: 'Transcript', name: 'Academic Transcripts', required: true, status: 'UNDER_REVIEW', fileName: 'transcript_fatima.pdf', uploadedAt: '2025-01-16T08:30:00Z', reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc11', studentId: 's4', studentName: 'Fatima Hassan', category: 'SOP', name: 'Statement of Purpose', required: true, status: 'PENDING', fileName: null, uploadedAt: null, reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc12', studentId: 's5', studentName: 'Nguyen Thi Lan', category: 'IELTS', name: 'IELTS Certificate', required: true, status: 'APPROVED', fileName: 'ielts_lan.pdf', uploadedAt: '2025-01-09T10:00:00Z', reviewedAt: '2025-01-10T09:00:00Z', reviewedById: 'u1', reviewedByName: 'Sarah Johnson', rejectionReason: null },
  { id: 'doc13', studentId: 's5', studentName: 'Nguyen Thi Lan', category: 'Passport', name: 'Passport Copy', required: true, status: 'APPROVED', fileName: 'passport_lan.pdf', uploadedAt: '2025-01-09T10:15:00Z', reviewedAt: '2025-01-10T09:15:00Z', reviewedById: 'u1', reviewedByName: 'Sarah Johnson', rejectionReason: null },
  { id: 'doc14', studentId: 's6', studentName: 'Maria Santos', category: 'Transcript', name: 'Academic Transcripts', required: true, status: 'UPLOADED', fileName: 'transcript_maria.pdf', uploadedAt: '2025-01-15T16:00:00Z', reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
  { id: 'doc15', studentId: 's6', studentName: 'Maria Santos', category: 'CV', name: 'Curriculum Vitae', required: true, status: 'UPLOADED', fileName: 'cv_maria.pdf', uploadedAt: '2025-01-15T16:15:00Z', reviewedAt: null, reviewedById: null, reviewedByName: null, rejectionReason: null },
];

const DEMO_MISSING_DOCS: MissingDocAlert[] = [
  { studentId: 's3', studentName: 'James Okonkwo', missingDocs: ['Bank Statement (re-upload)', 'SOP'], deadline: '2025-01-18T23:59:59Z', urgency: 'critical' },
  { studentId: 's2', studentName: 'Priya Sharma', missingDocs: ['LOR', 'IELTS Certificate'], deadline: '2025-01-22T23:59:59Z', urgency: 'high' },
  { studentId: 's4', studentName: 'Fatima Hassan', missingDocs: ['SOP', 'IELTS Certificate', 'Bank Statement'], deadline: '2025-01-28T23:59:59Z', urgency: 'medium' },
  { studentId: 's7', studentName: 'Chen Wei', missingDocs: ['Transcript'], deadline: '2025-01-30T23:59:59Z', urgency: 'medium' },
  { studentId: 's8', studentName: 'Olga Petrov', missingDocs: ['Passport', 'SOP', 'LOR', 'CV'], deadline: '2025-02-05T23:59:59Z', urgency: 'high' },
];

const DEMO_VERIFICATION_QUEUE: VerificationItem[] = [
  { id: 'vq1', studentName: 'Ahmed Al-Rashid', docType: 'IELTS', uploadedAt: '2025-01-14T14:00:00Z', fileName: 'ielts_ahmed.pdf' },
  { id: 'vq2', studentName: 'Fatima Hassan', docType: 'Transcript', uploadedAt: '2025-01-16T08:30:00Z', fileName: 'transcript_fatima.pdf' },
  { id: 'vq3', studentName: 'Maria Santos', docType: 'Transcript', uploadedAt: '2025-01-15T16:00:00Z', fileName: 'transcript_maria.pdf' },
  { id: 'vq4', studentName: 'Maria Santos', docType: 'CV', uploadedAt: '2025-01-15T16:15:00Z', fileName: 'cv_maria.pdf' },
  { id: 'vq5', studentName: 'Fatima Hassan', docType: 'Passport', uploadedAt: '2025-01-16T08:00:00Z', fileName: 'passport_fatima.pdf' },
];

const DEMO_DOC_TYPE_LEGEND: DocTypeLegendItem[] = [
  { type: 'Passport', icon: 'IdCard', total: 45, uploaded: 42, verified: 38, pending: 4 },
  { type: 'Transcript', icon: 'BookOpen', total: 45, uploaded: 38, verified: 30, pending: 8 },
  { type: 'SOP', icon: 'FileText', total: 42, uploaded: 28, verified: 20, pending: 8 },
  { type: 'LOR', icon: 'Award', total: 38, uploaded: 22, verified: 18, pending: 4 },
  { type: 'CV', icon: 'File', total: 44, uploaded: 36, verified: 28, pending: 8 },
  { type: 'IELTS', icon: 'Languages', total: 40, uploaded: 32, verified: 30, pending: 2 },
  { type: 'Bank Statement', icon: 'CreditCard', total: 35, uploaded: 20, verified: 15, pending: 5 },
  { type: 'Degree Certificate', icon: 'GraduationCap', total: 25, uploaded: 18, verified: 14, pending: 4 },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentHub({ onNavigate }: DocumentHubProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [missingDocs, setMissingDocs] = useState<MissingDocAlert[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationItem[]>([]);
  const [docLegend, setDocLegend] = useState<DocTypeLegendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, docsRes, appsRes] = await Promise.all([
        fetch('/api/dashboard/stats').then((r) => r.json()).catch(() => null),
        fetch('/api/documents/list').then((r) => r.json()).catch(() => null),
        fetch('/api/applications').then((r) => r.json()).catch(() => null),
      ]);
      setStats(statsRes?.data ?? statsRes ?? DEMO_STATS);
      setDocs(docsRes?.documents ?? docsRes?.data ?? DEMO_DOCS);
      setMissingDocs(docsRes?.missingDocs ?? DEMO_MISSING_DOCS);
      setVerificationQueue(docsRes?.verificationQueue ?? DEMO_VERIFICATION_QUEUE);
      setDocLegend(docsRes?.docTypeLegend ?? DEMO_DOC_TYPE_LEGEND);
    } catch {
      setError('Failed to load document hub data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch =
      !search ||
      doc.studentName.toLowerCase().includes(search.toLowerCase()) ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pipelineCounts = {
    required: stats?.docsByStatus?.PENDING ?? DEMO_STATS.docsByStatus?.PENDING ?? 34,
    uploaded: stats?.docsByStatus?.UPLOADED ?? DEMO_STATS.docsByStatus?.UPLOADED ?? 67,
    review: stats?.docsByStatus?.UNDER_REVIEW ?? DEMO_STATS.docsByStatus?.UNDER_REVIEW ?? 23,
    verified: stats?.docsByStatus?.APPROVED ?? DEMO_STATS.docsByStatus?.APPROVED ?? 89,
    rejected: stats?.docsByStatus?.REJECTED ?? DEMO_STATS.docsByStatus?.REJECTED ?? 5,
  };

  const totalDocuments = stats?.counts?.documents ?? DEMO_STATS.counts?.documents ?? 347;
  const uploaded = stats?.counts?.uploaded ?? DEMO_STATS.counts?.uploaded ?? 218;
  const verified = stats?.counts?.verified ?? DEMO_STATS.counts?.verified ?? 156;
  const pendingReview = stats?.counts?.pendingReview ?? DEMO_STATS.counts?.pendingReview ?? 62;

  // ── Loading ──
  if (loading) return <LoadingGrid count={4} />;

  // ── Error ──
  if (error) {
    return (
      <EmptyState
        icon="AlertCircle"
        title="Something went wrong"
        description={error}
        action={
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="mr-2 size-4" /> Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title="Document Hub"
        subtitle="Track, verify, and manage student documents"
        icon="FileText"
        action={
          <Button className="gap-2 bg-alo-blue hover:bg-alo-blue/90" onClick={() => {}}>
            <Upload className="size-4" /> Upload Document
          </Button>
        }
      />

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Documents" value={totalDocuments} icon="FileText" accent="blue" hint="across all students" />
        <StatCard label="Uploaded" value={uploaded} icon="Upload" accent="emerald" hint={`${Math.round((uploaded / totalDocuments) * 100)}% upload rate`} trend="+14 this week" />
        <StatCard label="Verified" value={verified} icon="ShieldCheck" accent="sunshine" hint={`${Math.round((verified / totalDocuments) * 100)}% verification rate`} trend="+9 this week" />
        <StatCard label="Pending Review" value={pendingReview} icon="Clock" accent="amber" hint="needs attention" />
      </div>

      {/* ── Document Status Pipeline ── */}
      <SectionCard title="Document Pipeline" description="Current status distribution" icon="GitBranch">
        <div className="flex flex-wrap items-center gap-3">
          <PipelineStage label="Required" count={pipelineCounts.required} color="amber" active={pipelineCounts.required > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Uploaded" count={pipelineCounts.uploaded} color="blue" active={pipelineCounts.uploaded > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Under Review" count={pipelineCounts.review} color="violet" active={pipelineCounts.review > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Verified" count={pipelineCounts.verified} color="emerald" active={pipelineCounts.verified > 0} />
          <div className="hidden sm:block text-slate-300"><ArrowRight className="size-4" /></div>
          <PipelineStage label="Rejected" count={pipelineCounts.rejected} color="orange" active={pipelineCounts.rejected > 0} />
        </div>
      </SectionCard>

      {/* ── Student Documents Table ── */}
      <SectionCard
        title="Student Documents"
        description={`${filteredDocs.length} document${filteredDocs.length !== 1 ? 's' : ''} shown`}
        icon="FolderOpen"
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-alo-gray" />
              <Input
                placeholder="Search student or doc..."
                className="h-8 pl-8 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="UPLOADED">Uploaded</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Verified</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        <ScrollArea className="max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Document Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Uploaded</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Verified By</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <EmptyState icon="FileText" title="No documents found" description="Try adjusting your search or filter" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-slate-50">
                    <TableCell className="text-sm font-medium text-alo-black">{doc.studentName}</TableCell>
                    <TableCell className="text-sm text-alo-gray">{doc.category}</TableCell>
                    <TableCell>
                      <StatusBadge status={doc.status} colorMap={DOC_STATUS_COLORS} labels={DOC_STATUS_LABELS} />
                    </TableCell>
                    <TableCell className="text-sm text-alo-gray hidden sm:table-cell whitespace-nowrap">{doc.uploadedAt ? fmtDate(doc.uploadedAt) : '—'}</TableCell>
                    <TableCell className="text-sm text-alo-gray hidden md:table-cell">{doc.reviewedByName ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.fileName && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-alo-blue hover:bg-alo-blue-light" title="View">
                            <Eye className="size-3.5" />
                          </Button>
                        )}
                        {doc.status === 'UPLOADED' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50" title="Verify">
                            <CheckCircle2 className="size-3.5" />
                          </Button>
                        )}
                        {doc.status === 'UPLOADED' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" title="Reject">
                            <XCircle className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </SectionCard>

      {/* ── Missing Documents + Verification Queue ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Missing Documents Alert */}
        <SectionCard
          title="Missing Documents"
          description={`${missingDocs.length} students with incomplete documents`}
          icon="AlertTriangle"
          action={
            <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
              {missingDocs.filter((m) => m.urgency === 'critical').length} critical
            </Badge>
          }
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {missingDocs.length === 0 ? (
              <EmptyState icon="CheckCircle2" title="All documents complete!" description="No missing documents found" />
            ) : (
              missingDocs.map((alert) => (
                <div key={alert.studentId} className="rounded-xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-alo-black truncate">{alert.studentName}</p>
                        <StatusBadge status={alert.urgency} colorMap={URGENCY_COLORS} labels={URGENCY_LABELS} />
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {alert.missingDocs.map((doc) => (
                          <span key={doc} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 border border-amber-200">
                            <AlertCircle className="size-3" /> {doc}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-alo-gray">
                        <Clock className="mr-1 inline size-3" /> Deadline: {fmtDate(alert.deadline)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Verification Queue */}
        <SectionCard
          title="Verification Queue"
          description={`${verificationQueue.length} documents to verify`}
          icon="ShieldCheck"
          action={
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
              <CheckCircle2 className="size-3" /> Verify All
            </Button>
          }
        >
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {verificationQueue.length === 0 ? (
              <EmptyState icon="ShieldCheck" title="Queue empty" description="No documents awaiting verification" />
            ) : (
              verificationQueue.map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-alo-black">{item.studentName}</p>
                        <Badge variant="secondary" className="text-xs bg-alo-blue-light text-alo-blue border-0">{item.docType}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-alo-gray truncate">{item.fileName}</p>
                      <p className="mt-1 text-xs text-alo-gray">
                        <Clock className="mr-1 inline size-3" /> Uploaded {timeAgo(item.uploadedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                        <CheckCircle2 className="size-3" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-rose-300 text-rose-700 hover:bg-rose-50">
                        <XCircle className="size-3" /> Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Document Type Legend ── */}
      <SectionCard title="Document Type Guide" description="Status overview by document type" icon="BookOpen">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {docLegend.map((item) => (
            <div key={item.type} className="rounded-xl border border-border bg-white p-4 transition-colors hover:bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-alo-blue-light text-alo-blue">
                  <Icon name={item.icon} className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-alo-black truncate">{item.type}</p>
                  <p className="text-xs text-alo-gray">{item.total} required</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-alo-blue-light/50 px-1 py-1.5">
                  <p className="text-sm font-bold text-alo-blue tabular-nums">{item.uploaded}</p>
                  <p className="text-[10px] text-alo-gray">Uploaded</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-1 py-1.5">
                  <p className="text-sm font-bold text-emerald-600 tabular-nums">{item.verified}</p>
                  <p className="text-[10px] text-alo-gray">Verified</p>
                </div>
                <div className="rounded-lg bg-amber-50 px-1 py-1.5">
                  <p className="text-sm font-bold text-amber-600 tabular-nums">{item.pending}</p>
                  <p className="text-[10px] text-alo-gray">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Quick Actions ── */}
      <SectionCard title="Quick Actions" icon="Zap">
        <div className="flex flex-wrap gap-2">
          <QuickAction icon="Upload" label="Upload Document" variant="blue" onClick={() => {}} />
          <QuickAction icon="ShieldCheck" label="Verify Queue" variant="emerald" onClick={() => {}} badge={verificationQueue.length} />
          <QuickAction icon="AlertTriangle" label="Missing Docs" variant="orange" onClick={() => {}} badge={missingDocs.length} />
          <QuickAction icon="BarChart3" label="Doc Analytics" variant="blue" onClick={() => {}} />
        </div>
      </SectionCard>
    </div>
  );
}
