'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, X, Eye, ChevronRight, Plane, ShieldCheck, Clock,
  AlertTriangle, CheckCircle2, XCircle, RefreshCw, FileText,
  User, Building2, Globe2, GraduationCap, DollarSign, Star,
  MessageSquare, Lock, ChevronDown, Filter, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  StatCard, SectionCard, PageHeader, PipelineStage, StatusBadge,
  EmptyState, LoadingGrid, MiniBar, MetricRow, CompletionRing,
  TimelineStep, Icon,
} from '@/components/alo/shared';
import { fmtDate, timeAgo } from '@/lib/alo-types';
import { useToast } from '@/hooks/use-toast';

// ─── Types ─────────────────────────────────────────────────────────────

interface VisaRecord {
  id: string;
  applicationId: string;
  country: string | null;
  visaType: string | null;
  visaCategory: string | null;
  status: string;
  studentName: string | null;
  studentId: string | null;
  casNumber: string | null;
  casReceivedDate: string | null;
  interviewScore: number | null;
  interviewDate: string | null;
  interviewNotes: string | null;
  readinessScore: number | null;
  submissionDate: string | null;
  biometricsDate: string | null;
  processingDate: string | null;
  decision: string | null;
  decisionDate: string | null;
  refusedReason: string | null;
  reviewNotes: string | null;
  internalNotes: string | null;
  preparationNotes: string | null;
  documentChecklist: string | null;
  fundingInfo: string | null;
  sponsorInfo: string | null;
  refusalHistory: string | null;
  readinessFactors: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  application?: {
    id: string;
    applicationId: string;
    university: string;
    country: string;
    studentId: string;
    studentName: string | null;
    studyLevel: string | null;
  };
  reviewedBy?: {
    id: string;
    name: string;
    role: string;
  };
}

interface ReadinessFactor {
  name: string;
  score: number;
  weight: number;
  status: 'pass' | 'warning' | 'fail';
  detail: string;
}

interface VisaStats {
  total: number;
  byStatus: Record<string, number>;
  byCountry: { country: string | null; count: number }[];
  approvalRate: number;
  avgReadinessScore: number | null;
}

// ─── Constants ─────────────────────────────────────────────────────────

const VISA_STATUSES = [
  'PREPARATION', 'READY', 'SUBMITTED', 'BIOMETRICS',
  'UNDER_PROCESSING', 'APPROVED', 'REJECTED', 'WITHDRAWN',
];

const STATUS_LABELS: Record<string, string> = {
  PREPARATION: 'Preparation',
  READY: 'Ready to Submit',
  SUBMITTED: 'Submitted',
  BIOMETRICS: 'Biometrics',
  UNDER_PROCESSING: 'Under Processing',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_COLORS: Record<string, string> = {
  PREPARATION: 'bg-amber-100 text-amber-700 border border-amber-200',
  READY: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  SUBMITTED: 'bg-alo-blue-light text-alo-blue border border-alo-blue/20',
  BIOMETRICS: 'bg-violet-100 text-violet-700 border border-violet-200',
  UNDER_PROCESSING: 'bg-sky-100 text-sky-700 border border-sky-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-700 border border-rose-200',
  WITHDRAWN: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const PIPELINE_STAGES = [
  { key: 'PREPARATION', label: 'Preparation', color: 'amber' as const },
  { key: 'READY', label: 'Ready', color: 'emerald' as const },
  { key: 'SUBMITTED', label: 'Submitted', color: 'blue' as const },
  { key: 'BIOMETRICS', label: 'Biometrics', color: 'violet' as const },
  { key: 'UNDER_PROCESSING', label: 'Processing', color: 'orange' as const },
];

const PIPELINE_END_STAGES = [
  { key: 'APPROVED', label: 'Approved', color: 'emerald' as const },
  { key: 'REJECTED', label: 'Refused', color: 'rose' as const },
  { key: 'WITHDRAWN', label: 'Withdrawn', color: 'blue' as const },
];

// ─── Props ─────────────────────────────────────────────────────────────

interface Props {
  onNavigate?: (view: string, slug?: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────

export function VisaReviewCenter({ onNavigate }: Props) {
  const { toast } = useToast();

  // Data state
  const [visas, setVisas] = useState<VisaRecord[]>([]);
  const [stats, setStats] = useState<VisaStats | null>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [tab, setTab] = useState<'all' | 'queue'>('all');
  const [selectedVisa, setSelectedVisa] = useState<VisaRecord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve_review' | 'request_changes' | 'reject'>('approve_review');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewInternal, setReviewInternal] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [liveReadiness, setLiveReadiness] = useState<{ score: number; factors: ReadinessFactor[]; recommendations: string[] } | null>(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [visaRes, statsRes] = await Promise.all([
        fetch('/api/visa'),
        fetch('/api/visa/stats'),
      ]);
      if (visaRes.ok) {
        const visaData = await visaRes.json();
        setVisas(visaData.visaRecords || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Failed to fetch visa data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Computed values
  const countries = useMemo(() => {
    const set = new Set(visas.map((v) => v.country || v.application?.country).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [visas]);

  const filteredVisas = useMemo(() => {
    let list = visas;
    if (tab === 'queue') {
      list = list.filter((v) => v.status === 'PREPARATION');
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          (v.studentName || '').toLowerCase().includes(q) ||
          (v.application?.university || '').toLowerCase().includes(q) ||
          (v.casNumber || '').toLowerCase().includes(q) ||
          (v.id || '').toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((v) => v.status === statusFilter);
    }
    if (countryFilter !== 'all') {
      list = list.filter(
        (v) => (v.country || v.application?.country || '') === countryFilter,
      );
    }
    return list;
  }, [visas, tab, search, statusFilter, countryFilter]);

  const pipelineCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of VISA_STATUSES) map[s] = 0;
    for (const v of visas) {
      if (map[v.status] !== undefined) map[v.status]++;
    }
    return map;
  }, [visas]);

  // Handlers
  const openDetail = (visa: VisaRecord) => {
    setSelectedVisa(visa);
    setLiveReadiness(null);
    setSheetOpen(true);
  };

  const openReview = (action: 'approve_review' | 'request_changes' | 'reject') => {
    setReviewAction(action);
    setReviewNotes('');
    setReviewInternal('');
    setReviewDialog(true);
  };

  const submitReview = async () => {
    if (!selectedVisa) return;
    try {
      setReviewLoading(true);
      const res = await fetch('/api/visa/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visaId: selectedVisa.id,
          action: reviewAction,
          notes: reviewNotes,
          internalNotes: reviewInternal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Review failed', description: data.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Review submitted', description: `Visa ${reviewAction.replace('_', ' ')} successfully.` });
      setReviewDialog(false);
      setSheetOpen(false);
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'Failed to submit review.', variant: 'destructive' });
    } finally {
      setReviewLoading(false);
    }
  };

  const runReadiness = async () => {
    if (!selectedVisa) return;
    try {
      setReadinessLoading(true);
      const res = await fetch('/api/visa/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visaId: selectedVisa.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'Assessment failed', description: data.error, variant: 'destructive' });
        return;
      }
      setLiveReadiness({ score: data.score, factors: data.factors, recommendations: data.recommendations });
      // Update the selected visa in state with new score
      setSelectedVisa({ ...selectedVisa, readinessScore: data.score });
      toast({ title: 'Readiness assessed', description: `Score: ${data.score}%` });
    } catch {
      toast({ title: 'Error', description: 'Failed to run assessment.', variant: 'destructive' });
    } finally {
      setReadinessLoading(false);
    }
  };

  const scoreColor = (s: number | null) => {
    if (s === null) return 'text-alo-gray';
    if (s >= 80) return 'text-emerald-600';
    if (s >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const scoreBg = (s: number | null) => {
    if (s === null) return 'bg-alo-gray-light';
    if (s >= 80) return 'bg-emerald-100';
    if (s >= 50) return 'bg-amber-100';
    return 'bg-rose-100';
  };

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) return <LoadingGrid count={4} />;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Visa Review Center"
          subtitle="Review, assess readiness, and manage visa applications"
          icon="ShieldCheck"
          action={
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Visa Applications"
            value={stats?.total ?? 0}
            icon="Plane"
            accent="blue"
            hint={`${pipelineCounts['PREPARATION'] ?? 0} in preparation`}
          />
          <StatCard
            label="Pending Review"
            value={pipelineCounts['PREPARATION'] ?? 0}
            icon="Clock"
            accent="amber"
            hint="Awaiting human review"
          />
          <StatCard
            label="Approved"
            value={pipelineCounts['APPROVED'] ?? 0}
            icon="CheckCircle2"
            accent="emerald"
            hint={stats?.approvalRate ? `${stats.approvalRate}% approval rate` : undefined}
          />
          <StatCard
            label="Refused"
            value={pipelineCounts['REJECTED'] ?? 0}
            icon="XCircle"
            accent="rose"
            hint={stats?.avgReadinessScore ? `Avg readiness: ${stats.avgReadinessScore}%` : undefined}
          />
        </div>

        {/* Pipeline */}
        <SectionCard title="Visa Pipeline" icon="ArrowUpRight">
          <div className="overflow-x-auto pb-2">
            <div className="flex items-center gap-1.5 min-w-max">
              {PIPELINE_STAGES.map((stage, i) => (
                <div key={stage.key} className="flex items-center gap-1.5">
                  <PipelineStage
                    label={stage.label}
                    count={pipelineCounts[stage.key] ?? 0}
                    color={stage.color}
                    active={selectedVisa?.status === stage.key}
                  />
                  {i < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight className="size-4 text-alo-gray shrink-0" />
                  )}
                </div>
              ))}
              <ChevronRight className="size-4 text-alo-gray shrink-0" />
              <div className="flex items-center gap-1">
                {PIPELINE_END_STAGES.map((stage) => (
                  <PipelineStage
                    key={stage.key}
                    label={stage.label}
                    count={pipelineCounts[stage.key] ?? 0}
                    color={stage.color}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Table Section */}
        <SectionCard
          title={tab === 'queue' ? 'Review Queue' : 'All Visa Applications'}
          icon={tab === 'queue' ? 'Clock' : 'FileText'}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant={tab === 'queue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab(tab === 'queue' ? 'all' : 'queue')}
                className={cn('gap-1.5 text-xs', tab === 'all' && 'text-alo-gray')}
              >
                <Clock className="size-3" />
                Review Queue
                {(pipelineCounts['PREPARATION'] ?? 0) > 0 && (
                  <span className="ml-1 flex size-5 items-center justify-center rounded-full bg-alo-orange text-[10px] font-bold text-white">
                    {pipelineCounts['PREPARATION']}
                  </span>
                )}
              </Button>
            </div>
          }
        >
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-alo-gray" />
              <Input
                placeholder="Search student, university, CAS..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-alo-gray hover:text-alo-black">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="mr-2 size-3.5 text-alo-gray" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {VISA_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s] || s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Globe2 className="mr-2 size-3.5 text-alo-gray" />
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          {filteredVisas.length === 0 ? (
            <EmptyState
              icon="Plane"
              title="No visa applications found"
              description={search || statusFilter !== 'all' || countryFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Visa applications will appear here once created'}
            />
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase">Student</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase">University</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase hidden md:table-cell">Country</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase hidden lg:table-cell">Visa Type</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase">Stage</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase">Readiness</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase hidden lg:table-cell">Interview</TableHead>
                    <TableHead className="text-xs font-semibold text-alo-gray uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisas.map((visa) => (
                    <TableRow
                      key={visa.id}
                      className="cursor-pointer hover:bg-alo-gray-light/50 transition-colors"
                      onClick={() => openDetail(visa)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-full bg-alo-blue-light text-alo-blue">
                            <User className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-alo-black truncate max-w-[140px]">
                              {visa.studentName || visa.application?.studentName || '—'}
                            </p>
                            <p className="text-[11px] text-alo-gray">{timeAgo(visa.createdAt)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-alo-black truncate max-w-[140px]">
                          {visa.application?.university || '—'}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="text-sm text-alo-gray">{visa.country || visa.application?.country || '—'}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="text-sm text-alo-gray">{visa.visaType || visa.visaCategory || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={visa.status}
                          colorMap={STATUS_COLORS}
                          labels={STATUS_LABELS}
                        />
                      </TableCell>
                      <TableCell>
                        <div className={cn('flex items-center gap-1.5 rounded-full px-2 py-0.5 w-fit', scoreBg(visa.readinessScore))}>
                          <span className={cn('text-xs font-bold', scoreColor(visa.readinessScore))}>
                            {visa.readinessScore !== null ? `${visa.readinessScore}%` : '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {visa.interviewScore !== null ? (
                          <div className="flex items-center gap-1">
                            <Star className="size-3 text-amber-500" />
                            <span className="text-sm font-medium text-alo-black">{visa.interviewScore}/10</span>
                          </div>
                        ) : (
                          <span className="text-sm text-alo-gray">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0"
                              onClick={(e) => { e.stopPropagation(); openDetail(visa); }}
                            >
                              <Eye className="size-4 text-alo-blue" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-3 text-xs text-alo-gray">
            Showing {filteredVisas.length} of {visas.length} applications
          </div>
        </SectionCard>

        {/* Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedVisa && (
              <VisaDetailSheet
                visa={selectedVisa}
                liveReadiness={liveReadiness}
                readinessLoading={readinessLoading}
                onRunReadiness={runReadiness}
                onReview={openReview}
                canReview={selectedVisa.status === 'PREPARATION' || selectedVisa.status === 'READY'}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Review Dialog */}
        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve_review' && 'Approve Review'}
                {reviewAction === 'request_changes' && 'Request Changes'}
                {reviewAction === 'reject' && 'Reject Application'}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === 'approve_review' && 'This will mark the visa as ready for submission. Human review is mandatory.'}
                {reviewAction === 'request_changes' && 'This will send the visa back to preparation with your notes.'}
                {reviewAction === 'reject' && 'This will withdraw the visa application.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-alo-black">Review Notes (visible to student)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewAction === 'approve_review' ? 'Approved. Ready for visa submission.'
                    : reviewAction === 'request_changes' ? 'Please address the following before resubmission...'
                    : 'Reason for rejection...'
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-alo-black flex items-center gap-1.5">
                  <Lock className="size-3.5 text-alo-gray" />
                  Internal Notes (admin only)
                </label>
                <Textarea
                  value={reviewInternal}
                  onChange={(e) => setReviewInternal(e.target.value)}
                  placeholder="Internal notes — not visible to student..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReviewDialog(false)}>Cancel</Button>
              <Button
                onClick={submitReview}
                disabled={reviewLoading}
                className={cn(
                  reviewAction === 'approve_review' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                  reviewAction === 'request_changes' && 'bg-amber-500 hover:bg-amber-600 text-white',
                  reviewAction === 'reject' && 'bg-rose-600 hover:bg-rose-700 text-white',
                )}
              >
                {reviewLoading && <RefreshCw className="mr-2 size-4 animate-spin" />}
                {reviewAction === 'approve_review' && 'Approve Review'}
                {reviewAction === 'request_changes' && 'Request Changes'}
                {reviewAction === 'reject' && 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ─── Visa Detail Sheet (Inner Component) ──────────────────────────────

function VisaDetailSheet({
  visa,
  liveReadiness,
  readinessLoading,
  onRunReadiness,
  onReview,
  canReview,
}: {
  visa: VisaRecord;
  liveReadiness: { score: number; factors: ReadinessFactor[]; recommendations: string[] } | null;
  readinessLoading: boolean;
  onRunReadiness: () => void;
  onReview: (action: 'approve_review' | 'request_changes' | 'reject') => void;
  canReview: boolean;
}) {
  const displayScore = liveReadiness?.score ?? visa.readinessScore ?? null;
  const factors = liveReadiness?.factors ?? (visa.readinessFactors ? JSON.parse(visa.readinessFactors) : null);
  const recommendations = liveReadiness?.recommendations ?? [];

  const studentName = visa.studentName || visa.application?.studentName || '—';
  const university = visa.application?.university || '—';
  const country = visa.country || visa.application?.country || '—';

  // Document checklist parsed
  let checklist: Record<string, boolean> = {};
  try { if (visa.documentChecklist) checklist = JSON.parse(visa.documentChecklist); } catch { /* ignore */ }

  // Funding info parsed
  let fundingLabel = '—';
  try { if (visa.fundingInfo) { const f = JSON.parse(visa.fundingInfo); fundingLabel = f?.bankStatements ? 'Bank statements on file' : f?.tuitionPaid ? 'Tuition paid' : f?.scholarship ? 'Scholarship confirmed' : JSON.stringify(f); } } catch { /* ignore */ }

  // Sponsor info parsed
  let sponsorLabel = '—';
  try { if (visa.sponsorInfo) { const s = JSON.parse(visa.sponsorInfo); sponsorLabel = `${s?.name || 'N/A'} (${s?.relationship || 'N/A'})`; } } catch { /* ignore */ }

  // Status timeline stages
  const timelineSteps = [
    { label: 'Preparation', status: visa.status === 'PREPARATION' ? 'current' : ['READY', 'SUBMITTED', 'BIOMETRICS', 'UNDER_PROCESSING', 'APPROVED', 'REJECTED', 'WITHDRAWN'].includes(visa.status) ? 'completed' : 'upcoming' },
    { label: 'Ready', status: visa.status === 'READY' ? 'current' : ['SUBMITTED', 'BIOMETRICS', 'UNDER_PROCESSING', 'APPROVED', 'REJECTED', 'WITHDRAWN'].includes(visa.status) ? 'completed' : 'upcoming' },
    { label: 'Submitted', status: visa.status === 'SUBMITTED' ? 'current' : ['BIOMETRICS', 'UNDER_PROCESSING', 'APPROVED', 'REJECTED', 'WITHDRAWN'].includes(visa.status) ? 'completed' : 'upcoming' },
    { label: 'Biometrics', status: visa.status === 'BIOMETRICS' ? 'current' : ['UNDER_PROCESSING', 'APPROVED', 'REJECTED', 'WITHDRAWN'].includes(visa.status) ? 'completed' : 'upcoming' },
    { label: 'Processing', status: visa.status === 'UNDER_PROCESSING' ? 'current' : ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(visa.status) ? 'completed' : 'upcoming' },
    { label: 'Decision', status: ['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(visa.status) ? 'completed' : 'upcoming' },
  ];

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Plane className="size-5 text-alo-blue" />
          Visa Application
        </SheetTitle>
        <SheetDescription>{studentName} — {university}</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-5">
        {/* Status badge */}
        <div className="flex items-center justify-between">
          <StatusBadge status={visa.status} colorMap={STATUS_COLORS} labels={STATUS_LABELS} />
          <span className="text-xs text-alo-gray">{timeAgo(visa.updatedAt)}</span>
        </div>

        {/* Student Info */}
        <SectionCard title="Student Information" icon="User">
          <div className="space-y-0">
            <MetricRow label="Name" value={studentName} />
            <MetricRow label="Student ID" value={visa.studentId || visa.application?.studentId || '—'} />
            <MetricRow label="Country" value={country} />
            <MetricRow label="University" value={university} />
            <MetricRow label="Study Level" value={visa.application?.studyLevel || '—'} />
          </div>
        </SectionCard>

        {/* Application Info */}
        <SectionCard title="Application Details" icon="FileText">
          <div className="space-y-0">
            <MetricRow label="Visa Type" value={visa.visaType || visa.visaCategory || '—'} />
            <MetricRow label="Application ID" value={visa.application?.applicationId || '—'} />
            <MetricRow label="Created" value={fmtDate(visa.createdAt)} />
            <MetricRow label="Last Updated" value={timeAgo(visa.updatedAt)} />
          </div>
        </SectionCard>

        {/* CAS Status */}
        <SectionCard title="CAS Status" icon="GraduationCap">
          <div className="space-y-0">
            <MetricRow
              label="CAS Number"
              value={
                visa.casNumber ? (
                  <span className="font-mono text-sm">{visa.casNumber}</span>
                ) : (
                  <span className="text-alo-gray">Not received</span>
                )
              }
            />
            <MetricRow label="CAS Received" value={fmtDate(visa.casReceivedDate)} />
          </div>
        </SectionCard>

        {/* Document Checklist */}
        <SectionCard title="Document Checklist" icon="FileText">
          {Object.keys(checklist).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(checklist).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between py-1">
                  <span className="text-sm text-alo-black capitalize">{key.replace(/_/g, ' ')}</span>
                  {val ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <XCircle className="size-4 text-rose-500" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-alo-gray">No checklist data available</p>
          )}
        </SectionCard>

        {/* Funding & Sponsor */}
        <SectionCard title="Funding & Sponsor" icon="DollarSign">
          <div className="space-y-0">
            <MetricRow label="Funding" value={fundingLabel} />
            <MetricRow label="Sponsor" value={sponsorLabel} />
          </div>
        </SectionCard>

        {/* Interview */}
        <SectionCard title="Interview" icon="MessageSquare">
          <div className="space-y-0">
            <MetricRow
              label="Score"
              value={
                visa.interviewScore !== null ? (
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-amber-500" />
                    <span className="font-bold">{visa.interviewScore}/10</span>
                  </div>
                ) : 'Not completed'
              }
            />
            <MetricRow label="Date" value={fmtDate(visa.interviewDate)} />
          </div>
          {visa.interviewNotes && (
            <div className="mt-3 rounded-lg bg-alo-gray-light p-3">
              <p className="text-xs font-medium text-alo-gray mb-1">Interview Notes</p>
              <p className="text-sm text-alo-black whitespace-pre-wrap">{visa.interviewNotes}</p>
            </div>
          )}
        </SectionCard>

        {/* AI Readiness Assessment */}
        <SectionCard
          title="AI Readiness Assessment"
          icon="Star"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={onRunReadiness}
              disabled={readinessLoading}
              className="gap-1.5 text-xs"
            >
              {readinessLoading ? <RefreshCw className="size-3 animate-spin" /> : <Star className="size-3" />}
              {displayScore !== null ? 'Re-assess' : 'Run Assessment'}
            </Button>
          }
        >
          <div className="flex flex-col items-center py-4">
            <CompletionRing value={displayScore ?? 0} size={96} label="Readiness" />
            {displayScore === null && (
              <p className="mt-3 text-sm text-alo-gray">Run AI assessment to generate readiness score</p>
            )}
          </div>
          {factors && Array.isArray(factors) && factors.length > 0 && (
            <div className="space-y-2.5 mt-2">
              {factors.map((f: ReadinessFactor, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-alo-black">{f.name}</span>
                    <span className={cn(
                      'text-xs font-bold',
                      f.status === 'pass' ? 'text-emerald-600' : f.status === 'warning' ? 'text-amber-600' : 'text-rose-600',
                    )}>
                      {f.score}%
                    </span>
                  </div>
                  <MiniBar value={f.score} max={100} color={f.status === 'pass' ? '#10b981' : f.status === 'warning' ? '#f59e0b' : '#f43f5e'} />
                  <p className="text-[11px] text-alo-gray">{f.detail}</p>
                </div>
              ))}
            </div>
          )}
          {recommendations.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-alo-gray">Recommendations</p>
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5">
                  <AlertTriangle className="size-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800">{r}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Internal Notes (admin only) */}
        <SectionCard title="Internal Notes" icon="Lock">
          {visa.internalNotes ? (
            <div className="rounded-lg bg-alo-gray-light p-3">
              <p className="text-sm text-alo-black whitespace-pre-wrap">{visa.internalNotes}</p>
              {visa.reviewedBy && (
                <p className="mt-2 text-[11px] text-alo-gray">
                  by {visa.reviewedBy.name} · {fmtDate(visa.reviewedAt)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-alo-gray">No internal notes</p>
          )}
        </SectionCard>

        {/* Review Notes (student visible) */}
        {visa.reviewNotes && (
          <SectionCard title="Review Feedback" icon="MessageSquare">
            <div className="rounded-lg bg-alo-blue-light p-3">
              <p className="text-sm text-alo-black whitespace-pre-wrap">{visa.reviewNotes}</p>
            </div>
          </SectionCard>
        )}

        {/* Status Timeline */}
        <SectionCard title="Status Timeline" icon="Clock">
          <div className="py-2">
            {timelineSteps.map((step, i) => (
              <TimelineStep
                key={step.label}
                step={i + 1}
                label={step.label}
                status={step.status as 'completed' | 'current' | 'upcoming'}
                isLast={i === timelineSteps.length - 1}
              />
            ))}
          </div>
        </SectionCard>

        {/* Refusal Reason */}
        {visa.refusedReason && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-700">Refusal Reason</p>
            <p className="mt-1 text-sm text-rose-800">{visa.refusedReason}</p>
          </div>
        )}

        {/* Review Actions */}
        {canReview && (
          <div className="rounded-2xl border border-border bg-white p-4 space-y-3">
            <p className="text-sm font-semibold text-alo-black">Review Actions</p>
            <p className="text-xs text-alo-gray">Human review is mandatory before submission. Select an action below.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onReview('approve_review')}
              >
                <CheckCircle2 className="size-4" /> Approve Review
              </Button>
              <Button
                className="flex-1 gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => onReview('request_changes')}
              >
                <AlertTriangle className="size-4" /> Request Changes
              </Button>
              <Button
                className="flex-1 gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                onClick={() => onReview('reject')}
              >
                <XCircle className="size-4" /> Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
