'use client';

/**
 * DEMO-ONLY COMPONENT (labelled 2026-10-12). Not used by any route.
 * The statistics and batches below are invented sample values, not live data.
 * Live import history is `ImportHistoryTable` in
 * src/components/admin/data-import/CatalogueImportViews.tsx (/admin/data-import/history).
 * This component no longer falls back to sample batches when the API fails.
 */
export const IMPORT_HISTORY_IS_DEMO = true;

import { useState, useEffect, useCallback } from 'react';
import {
  Building2, BookOpen, CheckCircle2, AlertCircle, FileQuestion,
  Eye, Search, RotateCcw, Download, Clock, Filter,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { ImportBatch } from './types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completed', color: 'bg-crm-success-bg text-crm-success-text' },
  failed: { label: 'Failed', color: 'bg-crm-danger-bg text-crm-danger-text' },
  in_progress: { label: 'In Progress', color: 'bg-crm-warning-bg text-crm-warning-text' },
  rolled_back: { label: 'Rolled Back', color: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]' },
};

/** DEMO SAMPLE VALUES — invented, never live counts. */
const DEMO_SAMPLE_STATS = {
  totalUniversities: 287,
  totalCourses: 4253,
  active: 3180,
  draft: 412,
  needsReview: 431,
  needsOfficialSource: 230,
};

/** DEMO SAMPLE BATCHES — invented; never shown as live history. */
export const DEMO_SAMPLE_BATCHES: ImportBatch[] = [
  {
    batchId: 'BATCH-A7F3K2',
    type: 'Course Finder Combined Upload',
    fileName: 'uk_courses_sep_2025.csv',
    date: '2025-06-28T14:30:00Z',
    rowsReceived: 450,
    rowsImported: 438,
    rowsFailed: 12,
    status: 'completed',
  },
  {
    batchId: 'BATCH-B9E4M1',
    type: 'University Master Upload',
    fileName: 'universities_master.csv',
    date: '2025-06-27T10:15:00Z',
    rowsReceived: 45,
    rowsImported: 42,
    rowsFailed: 3,
    status: 'completed',
  },
  {
    batchId: 'BATCH-C1D5N3',
    type: 'Scholarship Update',
    fileName: 'scholarships_q3.csv',
    date: '2025-06-26T09:00:00Z',
    rowsReceived: 120,
    rowsImported: 0,
    rowsFailed: 120,
    status: 'failed',
  },
  {
    batchId: 'BATCH-D2F6P4',
    type: 'Commission Update',
    fileName: 'commissions_july.csv',
    date: '2025-06-25T16:45:00Z',
    rowsReceived: 310,
    rowsImported: 310,
    rowsFailed: 0,
    status: 'rolled_back',
  },
  {
    batchId: 'BATCH-E3G7Q5',
    type: 'Requirements Update',
    fileName: 'requirements_update.csv',
    date: '2025-06-24T11:20:00Z',
    rowsReceived: 200,
    rowsImported: 195,
    rowsFailed: 5,
    status: 'completed',
  },
  {
    batchId: 'BATCH-F4H8R6',
    type: 'Course Finder Combined Upload',
    fileName: 'australia_courses.csv',
    date: '2025-06-23T08:30:00Z',
    rowsReceived: 580,
    rowsImported: 560,
    rowsFailed: 20,
    status: 'completed',
  },
  {
    batchId: 'BATCH-G5I9S7',
    type: 'University Master Upload',
    fileName: 'new_universities.csv',
    date: '2025-06-22T13:00:00Z',
    rowsReceived: 15,
    rowsImported: 0,
    rowsFailed: 15,
    status: 'in_progress',
  },
];

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="border-[var(--alo-border)]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--alo-text)] leading-none">{value.toLocaleString()}</p>
          <p className="text-xs text-[var(--alo-text-muted)] mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ErrorDialog({
  batch,
  open,
  onOpenChange,
}: {
  batch: ImportBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!batch) return null;

  // Mock errors for demo
  const mockErrors = [
    { row: 5, field: 'Tuition Fee', message: 'Non-numeric value' },
    { row: 12, field: 'Country', message: 'Country not in supported list' },
    { row: 23, field: 'IELTS Min', message: 'Score out of range' },
    { row: 45, field: 'University Name', message: 'Unknown university' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-crm-danger-text" />
            Errors — {batch.batchId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="flex gap-4 text-sm text-[var(--alo-text-muted)] mb-2">
            <span>File: <strong className="text-[var(--alo-body)]">{batch.fileName}</strong></span>
            <span>Failed: <strong className="text-crm-danger-text">{batch.rowsFailed}</strong> rows</span>
          </div>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {mockErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-crm-danger-border bg-crm-danger-bg"
                >
                  <div className="shrink-0 w-7 h-7 rounded-full bg-crm-danger-bg flex items-center justify-center text-xs font-medium text-crm-danger-text">
                    {err.row}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--alo-body)]">{err.field}</p>
                    <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImportHistory() {
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/course-import/history');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch {
      // No silent fallback to sample data: an API failure is shown as an empty, failed load.
      setBatches([]);
      toast.error('Import history could not be loaded. No sample data is shown.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const filteredBatches = batches.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.batchId.toLowerCase().includes(q) ||
        b.fileName.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleViewErrors = (batch: ImportBatch) => {
    setSelectedBatch(batch);
    setErrorDialogOpen(true);
  };

  const handleRollback = (batch: ImportBatch) => {
    toast.success(`Rolling back ${batch.batchId}...`);
  };

  const handleDownload = (batch: ImportBatch) => {
    toast.info(`Downloading results for ${batch.batchId}...`);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-[var(--alo-border)] bg-[var(--alo-blue-soft)] text-[var(--alo-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Import History (demo)</h1>
          <p className="text-[var(--alo-text-muted)] mt-1 text-sm">
            Track all CSV imports and manage your course data
          </p>
          <p role="note" className="mt-3 rounded-md bg-crm-warning-bg px-3 py-2 text-xs font-semibold text-crm-warning-text">
            Demo component: the statistics cards show invented sample figures, not live counts. Live import history is at /admin/data-import/history.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Building2} label="Universities" value={DEMO_SAMPLE_STATS.totalUniversities} color="bg-[var(--alo-success-dark)]" />
          <StatCard icon={BookOpen} label="Total Courses" value={DEMO_SAMPLE_STATS.totalCourses} color="bg-[var(--alo-success)]" />
          <StatCard icon={CheckCircle2} label="Active" value={DEMO_SAMPLE_STATS.active} color="bg-[var(--alo-success-dark)]" />
          <StatCard icon={FileQuestion} label="Draft" value={DEMO_SAMPLE_STATS.draft} color="bg-[var(--alo-page)]" />
          <StatCard icon={AlertCircle} label="Needs Review" value={DEMO_SAMPLE_STATS.needsReview} color="bg-[var(--alo-warning)]" />
          <StatCard icon={Eye} label="Needs Source" value={DEMO_SAMPLE_STATS.needsOfficialSource} color="bg-[var(--alo-cta)]" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--alo-text-muted)]" />
            <Input
              placeholder="Search by batch ID, file name, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="size-4 mr-1.5 text-[var(--alo-text-muted)]" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="rolled_back">Rolled Back</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batches Table */}
        <Card className="border-[var(--alo-border)] overflow-hidden">
          {loading ? (
            <CardContent className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-40 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          ) : filteredBatches.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="size-10 text-[var(--alo-placeholder)] mx-auto mb-3" />
              <p className="text-sm text-[var(--alo-text-muted)]">No import history found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--alo-page)] border-b border-[var(--alo-border)]">
                      <th className="text-left text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Batch ID
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Type
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        File
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Date
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Received
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Imported
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Failed
                      </th>
                      <th className="text-left text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-[var(--alo-text-muted)] uppercase tracking-wider p-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch) => {
                      const statusConfig = STATUS_CONFIG[batch.status] || STATUS_CONFIG.completed;
                      return (
                        <tr
                          key={batch.batchId}
                          className="border-b border-[var(--alo-border)] hover:bg-[var(--alo-page)] cursor-pointer"
                          onClick={() => handleViewErrors(batch)}
                        >
                          <td className="p-4">
                            <code className="text-xs font-mono font-medium text-[var(--alo-text)] bg-[var(--alo-surface-muted)] px-1.5 py-0.5 rounded">
                              {batch.batchId}
                            </code>
                          </td>
                          <td className="p-4 text-[var(--alo-body)] max-w-[180px] truncate">
                            {batch.type}
                          </td>
                          <td className="p-4 text-[var(--alo-body)] max-w-[160px] truncate">
                            {batch.fileName}
                          </td>
                          <td className="p-4 text-[var(--alo-text-muted)] whitespace-nowrap">
                            {new Date(batch.date).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-right text-[var(--alo-body)]">
                            {batch.rowsReceived}
                          </td>
                          <td className="p-4 text-right text-crm-success-text font-medium">
                            {batch.rowsImported}
                          </td>
                          <td className="p-4 text-right text-crm-danger-text font-medium">
                            {batch.rowsFailed}
                          </td>
                          <td className="p-4">
                            <Badge className={`text-[11px] ${statusConfig.color}`}>
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
                                onClick={() => handleViewErrors(batch)}
                                title="View Errors"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              {batch.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-crm-danger-text"
                                  onClick={() => handleRollback(batch)}
                                  title="Rollback"
                                >
                                  <RotateCcw className="size-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
                                onClick={() => handleDownload(batch)}
                                title="Download"
                              >
                                <Download className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[var(--alo-border)]">
                {filteredBatches.map((batch) => {
                  const statusConfig = STATUS_CONFIG[batch.status] || STATUS_CONFIG.completed;
                  return (
                    <div
                      key={batch.batchId}
                      className="p-4 space-y-3"
                      onClick={() => handleViewErrors(batch)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <code className="text-xs font-mono font-medium text-[var(--alo-text)]">
                            {batch.batchId}
                          </code>
                          <p className="text-xs text-[var(--alo-text-muted)] mt-0.5 truncate">{batch.type}</p>
                        </div>
                        <Badge className={`text-[11px] shrink-0 ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-[var(--alo-text-muted)]">
                        <span className="truncate">{batch.fileName}</span>
                        <span className="shrink-0">
                          {new Date(batch.date).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-[var(--alo-body)]">
                          <span className="text-[var(--alo-text-muted)]">Received:</span> {batch.rowsReceived}
                        </span>
                        <span className="text-crm-success-text font-medium">
                          <span className="text-[var(--alo-text-muted)]">Imported:</span> {batch.rowsImported}
                        </span>
                        {batch.rowsFailed > 0 && (
                          <span className="text-crm-danger-text font-medium">
                            <span className="text-[var(--alo-text-muted)]">Failed:</span> {batch.rowsFailed}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleViewErrors(batch)}>
                          <Eye className="size-3 mr-1" /> Errors
                        </Button>
                        {batch.status === 'completed' && (
                          <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleRollback(batch)}>
                            <RotateCcw className="size-3 mr-1" /> Rollback
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 flex-1" onClick={() => handleDownload(batch)}>
                          <Download className="size-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>

      <ErrorDialog
        batch={selectedBatch}
        open={errorDialogOpen}
        onOpenChange={setErrorDialogOpen}
      />
    </div>
  );
}