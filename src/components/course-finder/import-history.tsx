'use client';

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
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  rolled_back: { label: 'Rolled Back', color: 'bg-slate-100 text-slate-600' },
};

const MOCK_STATS = {
  totalUniversities: 287,
  totalCourses: 4253,
  active: 3180,
  draft: 412,
  needsReview: 431,
  needsOfficialSource: 230,
};

const MOCK_BATCHES: ImportBatch[] = [
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
    <Card className="border-slate-200">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 leading-none">{value.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{label}</p>
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
            <AlertCircle className="size-5 text-red-500" />
            Errors — {batch.batchId}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="flex gap-4 text-sm text-slate-500 mb-2">
            <span>File: <strong className="text-slate-700">{batch.fileName}</strong></span>
            <span>Failed: <strong className="text-red-600">{batch.rowsFailed}</strong> rows</span>
          </div>
          <ScrollArea className="max-h-64">
            <div className="space-y-2">
              {mockErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border border-red-100 bg-red-50"
                >
                  <div className="shrink-0 w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-medium text-red-600">
                    {err.row}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">{err.field}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{err.message}</p>
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
      // Use mock data
      setBatches(MOCK_BATCHES);
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
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Import History</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Track all CSV imports and manage your course data
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Building2} label="Universities" value={MOCK_STATS.totalUniversities} color="bg-emerald-600" />
          <StatCard icon={BookOpen} label="Total Courses" value={MOCK_STATS.totalCourses} color="bg-emerald-500" />
          <StatCard icon={CheckCircle2} label="Active" value={MOCK_STATS.active} color="bg-emerald-600" />
          <StatCard icon={FileQuestion} label="Draft" value={MOCK_STATS.draft} color="bg-slate-400" />
          <StatCard icon={AlertCircle} label="Needs Review" value={MOCK_STATS.needsReview} color="bg-amber-500" />
          <StatCard icon={Eye} label="Needs Source" value={MOCK_STATS.needsOfficialSource} color="bg-orange-500" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Search by batch ID, file name, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="size-4 mr-1.5 text-slate-400" />
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
        <Card className="border-slate-200 overflow-hidden">
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
              <Clock className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No import history found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Batch ID
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Type
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        File
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Date
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Received
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Imported
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Failed
                      </th>
                      <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider p-4">
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
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                          onClick={() => handleViewErrors(batch)}
                        >
                          <td className="p-4">
                            <code className="text-xs font-mono font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                              {batch.batchId}
                            </code>
                          </td>
                          <td className="p-4 text-slate-700 max-w-[180px] truncate">
                            {batch.type}
                          </td>
                          <td className="p-4 text-slate-600 max-w-[160px] truncate">
                            {batch.fileName}
                          </td>
                          <td className="p-4 text-slate-500 whitespace-nowrap">
                            {new Date(batch.date).toLocaleDateString('en-GB', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </td>
                          <td className="p-4 text-right text-slate-700">
                            {batch.rowsReceived}
                          </td>
                          <td className="p-4 text-right text-emerald-600 font-medium">
                            {batch.rowsImported}
                          </td>
                          <td className="p-4 text-right text-red-600 font-medium">
                            {batch.rowsFailed}
                          </td>
                          <td className="p-4">
                            <Badge className={`text-[10px] ${statusConfig.color}`}>
                              {statusConfig.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                                onClick={() => handleViewErrors(batch)}
                                title="View Errors"
                              >
                                <Eye className="size-3.5" />
                              </Button>
                              {batch.status === 'completed' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-slate-500 hover:text-red-600"
                                  onClick={() => handleRollback(batch)}
                                  title="Rollback"
                                >
                                  <RotateCcw className="size-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
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
              <div className="md:hidden divide-y divide-slate-100">
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
                          <code className="text-xs font-mono font-medium text-slate-800">
                            {batch.batchId}
                          </code>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{batch.type}</p>
                        </div>
                        <Badge className={`text-[10px] shrink-0 ${statusConfig.color}`}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span className="truncate">{batch.fileName}</span>
                        <span className="shrink-0">
                          {new Date(batch.date).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short',
                          })}
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-slate-700">
                          <span className="text-slate-400">Received:</span> {batch.rowsReceived}
                        </span>
                        <span className="text-emerald-600 font-medium">
                          <span className="text-slate-400">Imported:</span> {batch.rowsImported}
                        </span>
                        {batch.rowsFailed > 0 && (
                          <span className="text-red-600 font-medium">
                            <span className="text-slate-400">Failed:</span> {batch.rowsFailed}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleViewErrors(batch)}>
                          <Eye className="size-3 mr-1" /> Errors
                        </Button>
                        {batch.status === 'completed' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleRollback(batch)}>
                            <RotateCcw className="size-3 mr-1" /> Rollback
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleDownload(batch)}>
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