'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ExternalLink,
  Search,
  Filter,
  Clock,
  Globe,
  Zap,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatusData {
  lastRun: {
    id: string;
    runId: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    sourcesChecked: number;
    changesDetected: number;
    errors: number;
    createdAt: string;
  } | null;
  sourcesByStatus: { ACTIVE: number; BROKEN: number; DISABLED: number };
  changesByStatus: {
    PENDING: number;
    APPROVED: number;
    REJECTED: number;
    HIGH_CONFIDENCE: number;
    NEEDS_REVIEW: number;
  };
  changesByImpact: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
  sourcesByCountry: { country: string; count: number }[];
  staleRecords: number;
}

interface DataChange {
  id: string;
  entityType: string;
  universitySlug: string | null;
  courseSlug: string | null;
  countrySlug: string | null;
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  sourceUrl: string | null;
  detectedAt: string;
  aiExplanation: string | null;
  confidence: number | null;
  impactLevel: string;
  status: string;
  source?: { id: string; sourceName: string; sourceUrl: string; sourceType: string; status: string };
}

interface OfficialSource {
  id: string;
  sourceUrl: string;
  sourceName: string;
  sourceType: string;
  entityType: string;
  universitySlug: string | null;
  courseSlug: string | null;
  countrySlug: string | null;
  priority: number;
  monitoringEnabled: boolean;
  trustLevel: string;
  status: string;
  lastCheckedAt: string | null;
  lastVerifiedAt: string | null;
  consecutiveFailures: number;
  failureCount: number;
  lastError: string | null;
}

interface VerificationRun {
  id: string;
  runId: string;
  status: string;
  scope: string | null;
  startedAt: string | null;
  completedAt: string | null;
  universitiesScanned: number | null;
  coursesScanned: number | null;
  sourcesChecked: number | null;
  changesDetected: number | null;
  recordsVerified: number | null;
  recordsUpdated: number | null;
  recordsRejected: number | null;
  recordsNeedingReview: number | null;
  errors: number | null;
  createdAt: string;
  _count: { logs: number };
}

type FilterStatus = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CRITICAL';

interface VerificationCenterProps {
  onBack: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return '—';
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

function truncate(str: string | null, max: number): string {
  if (!str) return '—';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function slugToLabel(slug: string | null): string {
  if (!slug) return '—';
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getChangeTypeColor(type: string): string {
  switch (type) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getImpactColor(impact: string): string {
  switch (impact) {
    case 'CRITICAL':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'LOW':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getSourceStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'BROKEN':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'DISABLED':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getRunStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'RUNNING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'PENDING':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getTrustColor(level: string): string {
  switch (level) {
    case 'PRIMARY':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SECONDARY':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'TERTIARY':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getConfidenceColor(confidence: number | null): string {
  if (confidence === null) return 'bg-gray-300';
  if (confidence >= 0.9) return 'bg-green-500';
  if (confidence >= 0.7) return 'bg-amber-500';
  return 'bg-red-500';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VerificationCenter({ onBack }: VerificationCenterProps) {
  // Data state
  const [statusData, setStatusData] = useState<StatusData | null>(null);
  const [changes, setChanges] = useState<DataChange[]>([]);
  const [changesTotal, setChangesTotal] = useState(0);
  const [sources, setSources] = useState<OfficialSource[]>([]);
  const [runs, setRuns] = useState<VerificationRun[]>([]);

  // Loading state
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingChanges, setLoadingChanges] = useState(true);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingRuns, setLoadingRuns] = useState(true);

  // Error state
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [errorChanges, setErrorChanges] = useState<string | null>(null);
  const [errorSources, setErrorSources] = useState<string | null>(null);
  const [errorRuns, setErrorRuns] = useState<string | null>(null);

  // UI state
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [runningVerification, setRunningVerification] = useState(false);
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setErrorStatus(null);
    try {
      const res = await fetch('/api/admin/monitoring/status');
      if (!res.ok) throw new Error('Failed to load status');
      const data = await res.json();
      setStatusData(data);
    } catch (err) {
      setErrorStatus(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const fetchChanges = useCallback(async () => {
    setLoadingChanges(true);
    setErrorChanges(null);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (filter === 'CRITICAL') {
        params.set('impactLevel', 'CRITICAL');
      } else if (filter !== 'ALL') {
        params.set('status', filter);
      }
      if (searchQuery) {
        params.set('universitySlug', searchQuery.toLowerCase().replace(/\s+/g, '-'));
      }
      const res = await fetch(`/api/admin/monitoring/changes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load changes');
      const data = await res.json();
      setChanges(data.changes || []);
      setChangesTotal(data.total || 0);
    } catch (err) {
      setErrorChanges(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingChanges(false);
    }
  }, [filter, searchQuery]);

  const fetchSources = useCallback(async () => {
    setLoadingSources(true);
    setErrorSources(null);
    try {
      const res = await fetch('/api/admin/monitoring/sources?limit=12');
      if (!res.ok) throw new Error('Failed to load sources');
      const data = await res.json();
      setSources(data.sources || []);
    } catch (err) {
      setErrorSources(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingSources(false);
    }
  }, []);

  const fetchRuns = useCallback(async () => {
    setLoadingRuns(true);
    setErrorRuns(null);
    try {
      const res = await fetch('/api/admin/monitoring/runs?limit=5');
      if (!res.ok) throw new Error('Failed to load runs');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (err) {
      setErrorRuns(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleRunVerification = async () => {
    setRunningVerification(true);
    try {
      const res = await fetch('/api/admin/monitoring/run', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to start verification');
      // Refresh all data after a short delay
      setTimeout(() => {
        fetchStatus();
        fetchChanges();
        fetchRuns();
      }, 2000);
    } catch {
      // Silently handle - user can see the status
    } finally {
      setRunningVerification(false);
    }
  };

  const handleChangeAction = async (changeId: string, action: 'approve' | 'reject' | 'recheck') => {
    setActionLoading(changeId);
    try {
      const res = await fetch(`/api/admin/monitoring/changes/${changeId}/${action}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Failed to ${action} change`);
      await fetchChanges();
      await fetchStatus();
    } catch {
      // Silently handle
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Computed Values ─────────────────────────────────────────────────────

  const lastRunDate = statusData?.lastRun?.completedAt || statusData?.lastRun?.startedAt;
  const nextRunDate = lastRunDate
    ? new Date(new Date(lastRunDate).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const totalSources =
    (statusData?.sourcesByStatus.ACTIVE || 0) +
    (statusData?.sourcesByStatus.BROKEN || 0) +
    (statusData?.sourcesByStatus.DISABLED || 0);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 text-gray-600 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <Shield className="h-5 w-5 text-[#0066CC]" />
                <span className="font-semibold text-gray-900">Admin Panel</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#0066CC] text-[#0066CC] bg-blue-50">
                  <Activity className="h-3 w-3 mr-1" />
                  Monitoring
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          {/* ═══ Section 1: Header + Status Overview ═══ */}
          <section>
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                University Data Intelligence Center
              </h1>
              <p className="mt-1 text-gray-500 text-sm sm:text-base">AI-Powered Monitoring & Verification</p>
            </div>

            {loadingStatus ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border-gray-200">
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : errorStatus ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>Failed to load status: {errorStatus}</span>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Monitored Sources */}
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-[#0066CC]" />
                      <span className="text-sm text-gray-500">Monitored Sources</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{totalSources}</span>
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        {statusData?.sourcesByStatus.ACTIVE || 0} ACTIVE
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Changes */}
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-gray-500">Pending Changes</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {statusData?.changesByStatus.PENDING || 0}
                      </span>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">PENDING</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Changes */}
                <Card className="border-red-200 bg-red-50/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Critical Changes</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-700">
                        {statusData?.changesByImpact.CRITICAL || 0}
                      </span>
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">CRITICAL</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Failed Sources */}
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-500">Failed Sources</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">
                        {statusData?.sourcesByStatus.BROKEN || 0}
                      </span>
                      <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">BROKEN</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Last Run */}
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="h-4 w-4 text-[#0066CC]" />
                      <span className="text-sm text-gray-500">Last Run</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatDate(lastRunDate || null)}
                    </span>
                  </CardContent>
                </Card>

                {/* Next Run */}
                <Card className="border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-gray-500">Next Run</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-900">{nextRunDate}</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>

          {/* ═══ Section 2: Action Bar ═══ */}
          <section>
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <Button
                    onClick={handleRunVerification}
                    disabled={runningVerification}
                    className="bg-[#0066CC] hover:bg-[#0052A3] text-white gap-2 shrink-0"
                  >
                    {runningVerification ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    {runningVerification ? 'Running...' : 'Run Verification Now'}
                  </Button>

                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-1">
                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                      {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CRITICAL'] as FilterStatus[]).map((f) => (
                        <Button
                          key={f}
                          variant={filter === f ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilter(f)}
                          className={cn(
                            'text-xs h-8 px-3',
                            filter === f
                              ? 'bg-[#0066CC] hover:bg-[#0052A3] text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          )}
                        >
                          {f === 'CRITICAL' ? '⚠ Critical' : f.charAt(0) + f.slice(1).toLowerCase()}
                        </Button>
                      ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by university slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 w-full sm:w-56 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ═══ Section 3: Changes Queue ═══ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-[#0066CC]" />
              <h2 className="text-lg font-semibold text-gray-900">Changes Queue</h2>
              <Badge variant="secondary" className="text-xs">
                {changesTotal} total
              </Badge>
            </div>

            {loadingChanges ? (
              <Card className="border-gray-200">
                <CardContent className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : errorChanges ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>Failed to load changes: {errorChanges}</span>
                </CardContent>
              </Card>
            ) : changes.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                  <p className="text-gray-500">No changes pending</p>
                  <p className="text-gray-400 text-sm mt-1">All caught up! Run a verification to detect new changes.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[100px]">Change Type</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[140px]">Entity</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[120px]">Field</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[120px]">Old Value</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[120px]">New Value</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[90px]">Impact</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[100px]">Confidence</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">AI Explanation</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600 w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changes.map((change) => {
                        const isActioning = actionLoading === change.id;
                        const isExpanded = expandedExplanation === change.id;
                        return (
                          <TableRow key={change.id} className="hover:bg-gray-50/50">
                            {/* Change Type */}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] px-1.5 py-0', getChangeTypeColor(change.changeType))}
                              >
                                {change.changeType}
                              </Badge>
                            </TableCell>

                            {/* Entity */}
                            <TableCell>
                              <div className="text-xs">
                                <div className="font-medium text-gray-900">
                                  {change.universitySlug
                                    ? slugToLabel(change.universitySlug)
                                    : slugToLabel(change.courseSlug)}
                                </div>
                                <div className="text-gray-400 text-[10px] uppercase">{change.entityType}</div>
                              </div>
                            </TableCell>

                            {/* Field Name */}
                            <TableCell>
                              <span className="text-xs text-gray-700 font-mono">
                                {change.fieldName.replace(/_/g, ' ')}
                              </span>
                            </TableCell>

                            {/* Old Value */}
                            <TableCell>
                              <span className="text-xs text-gray-500 line-through">
                                {truncate(change.oldValue, 20)}
                              </span>
                            </TableCell>

                            {/* New Value */}
                            <TableCell>
                              <span className="text-xs text-gray-900 font-medium">
                                {truncate(change.newValue, 20)}
                              </span>
                            </TableCell>

                            {/* Impact */}
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] px-1.5 py-0', getImpactColor(change.impactLevel))}
                              >
                                {change.impactLevel}
                              </Badge>
                            </TableCell>

                            {/* Confidence */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Progress
                                  value={(change.confidence ?? 0) * 100}
                                  className={cn('h-2 w-14', getConfidenceColor(change.confidence))}
                                />
                                <span className="text-[10px] text-gray-500">
                                  {change.confidence !== null ? `${Math.round(change.confidence * 100)}%` : '—'}
                                </span>
                              </div>
                            </TableCell>

                            {/* AI Explanation */}
                            <TableCell>
                              {change.aiExplanation ? (
                                <div className="max-w-[200px]">
                                  <button
                                    onClick={() =>
                                      setExpandedExplanation(isExpanded ? null : change.id)
                                    }
                                    className="text-xs text-[#0066CC] hover:underline flex items-center gap-1"
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    {isExpanded ? 'Hide' : 'Show'}
                                  </button>
                                  {isExpanded && (
                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-gray-50 p-2 rounded">
                                      {change.aiExplanation}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </TableCell>

                            {/* Actions */}
                            <TableCell>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[10px] px-2 text-green-700 border-green-300 hover:bg-green-50"
                                      disabled={isActioning}
                                      onClick={() => handleChangeAction(change.id, 'approve')}
                                    >
                                      {isActioning ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-3 w-3" />
                                      )}
                                      <span className="ml-1">Approve</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Apply this change to the database</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[10px] px-2 text-red-700 border-red-300 hover:bg-red-50"
                                      disabled={isActioning}
                                      onClick={() => handleChangeAction(change.id, 'reject')}
                                    >
                                      {isActioning ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <XCircle className="h-3 w-3" />
                                      )}
                                      <span className="ml-1">Reject</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Discard this change</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-[10px] px-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                                      disabled={isActioning}
                                      onClick={() => handleChangeAction(change.id, 'recheck')}
                                    >
                                      {isActioning ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <RefreshCw className="h-3 w-3" />
                                      )}
                                      <span className="ml-1">Recheck</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Re-verify this change against the source</TooltipContent>
                                </Tooltip>

                                {change.sourceUrl && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <a
                                        href={change.sourceUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </TooltipTrigger>
                                    <TooltipContent>View source page</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </section>

          {/* ═══ Section 4: Sources Overview ═══ */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-[#0066CC]" />
              <h2 className="text-lg font-semibold text-gray-900">Sources Overview</h2>
              <Badge variant="secondary" className="text-xs">
                {sources.length} shown
              </Badge>
            </div>

            {loadingSources ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="border-gray-200">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : errorSources ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>Failed to load sources: {errorSources}</span>
                </CardContent>
              </Card>
            ) : sources.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="p-8 text-center">
                  <Globe className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No sources found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sources.map((source) => (
                  <Card
                    key={source.id}
                    className={cn(
                      'border hover:shadow-md transition-shadow',
                      source.status === 'BROKEN' ? 'border-red-200 bg-red-50/30' : 'border-gray-200'
                    )}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                          {source.sourceName || slugToLabel(source.universitySlug || source.courseSlug)}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0 shrink-0', getSourceStatusColor(source.status))}
                        >
                          {source.status}
                        </Badge>
                      </div>

                      {source.sourceUrl && (
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#0066CC] hover:underline flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {truncate(source.sourceUrl, 40)}
                        </a>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        {source.countrySlug && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 text-gray-600">
                            {slugToLabel(source.countrySlug)}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] px-1.5 py-0', getTrustColor(source.trustLevel))}
                        >
                          {source.trustLevel}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gray-300 text-gray-600">
                          {source.sourceType}
                        </Badge>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last checked: {formatDateShort(source.lastCheckedAt)}
                      </div>

                      {source.consecutiveFailures > 0 && (
                        <div className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {source.consecutiveFailures} consecutive failure{source.consecutiveFailures > 1 ? 's' : ''}
                          {source.lastError && `: ${truncate(source.lastError, 30)}`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* ═══ Section 5: Recent Runs History ═══ */}
          <section className="pb-12">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="h-5 w-5 text-[#0066CC]" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Runs</h2>
            </div>

            {loadingRuns ? (
              <Card className="border-gray-200">
                <CardContent className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : errorRuns ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <span>Failed to load runs: {errorRuns}</span>
                </CardContent>
              </Card>
            ) : runs.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No verification runs yet</p>
                  <p className="text-gray-400 text-sm mt-1">Click &quot;Run Verification Now&quot; to start the first scan.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-gray-600">Run ID</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Sources</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Changes</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Critical</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Failed</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Duration</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {runs.map((run) => (
                        <TableRow key={run.id} className="hover:bg-gray-50/50">
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-3 w-3 text-gray-400" />
                              <span className="text-xs font-mono text-gray-700">
                                {truncate(run.runId, 12)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] px-1.5 py-0', getRunStatusColor(run.status))}
                            >
                              {run.status === 'RUNNING' && (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              {run.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-700">
                              {run.sourcesChecked ?? '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-700">
                              {run.changesDetected ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-xs font-medium', (run.recordsNeedingReview ?? 0) > 0 ? 'text-red-600' : 'text-gray-500')}>
                              {run.recordsNeedingReview ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-xs font-medium', (run.errors ?? 0) > 0 ? 'text-red-600' : 'text-gray-500')}>
                              {run.errors ?? 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-600">
                              {formatDuration(run.startedAt, run.completedAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-500">
                              {formatDateShort(run.createdAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
