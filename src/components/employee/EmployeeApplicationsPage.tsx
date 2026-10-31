'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, GraduationCap, RefreshCw, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Application {
  id: string;
  studentProfileId: string;
  studentName: string;
  studentStudentId: string;
  university: string;
  course: string;
  stage: string;
  intake: string;
  country: string;
  deadline: string;
  updatedAt: string | null;
  allowedNextStages: string[];
}

const PAGE_SIZE = 20;

export default function EmployeeApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStages, setSelectedStages] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sortBy: 'updatedAt', sortOrder: 'desc' });
      if (search.trim()) params.set('search', search.trim());
      if (stageFilter) params.set('stage', stageFilter);
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`/api/employee/applications?${params.toString()}`, { headers, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Could not load assigned applications (HTTP ${response.status}).`);
      const rows = Array.isArray(payload.data) ? payload.data : [];
      setApplications(rows.map((row: any) => ({
        id: String(row.id || ''),
        studentProfileId: String(row.studentProfileId || ''),
        studentName: String(row.studentName || ''),
        studentStudentId: String(row.studentStudentId || ''),
        university: String(row.university || ''),
        course: String(row.course || ''),
        stage: String(row.stage || ''),
        intake: String(row.intake || ''),
        country: String(row.country || ''),
        deadline: String(row.deadline || ''),
        updatedAt: row.updatedAt || null,
        allowedNextStages: Array.isArray(row.allowedNextStages) ? row.allowedNextStages : [],
      })));
      setTotal(Number.isSafeInteger(payload.pagination?.total) ? payload.pagination.total : 0);
    } catch (cause) {
      setApplications([]);
      setTotal(0);
      setError(cause instanceof Error ? cause.message : 'Applications could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter]);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  const updateStage = async (application: Application) => {
    const nextStage = selectedStages[application.id];
    if (!nextStage || !application.allowedNextStages.includes(nextStage)) return;
    setUpdatingId(application.id);
    setActionMessage(null);
    try {
      const response = await fetch('/api/employee/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, stage: nextStage }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Stage update failed (HTTP ${response.status}).`);
      setActionMessage(`Application stage updated to ${nextStage}.`);
      setSelectedStages((current) => { const next = { ...current }; delete next[application.id]; return next; });
      await loadApplications();
    } catch (cause) {
      setActionMessage(cause instanceof Error ? cause.message : 'Application stage could not be updated.');
    } finally {
      setUpdatingId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-alo-text">Assigned Applications</h1><p className="text-sm text-alo-text-muted mt-1">Applications for student profiles assigned to your active employee account.</p></div>
        <Badge variant="outline">{loading ? 'Loading' : `${total} record${total === 1 ? '' : 's'}`}</Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-alo-border bg-white p-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input aria-label="Search assigned applications" className="pl-10" placeholder="Search university, course or intake" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} /></div>
        <Input aria-label="Filter application stage" className="md:w-56" placeholder="Stage (exact)" value={stageFilter} onChange={(event) => { setPage(1); setStageFilter(event.target.value); }} />
        <Button variant="outline" onClick={() => void loadApplications()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
      </div>

      {actionMessage && <div role="status" className="rounded-lg border border-alo-border bg-white px-4 py-3 text-sm">{actionMessage}</div>}
      {loading && <div className="space-y-3" aria-live="polite">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-xl" />)}</div>}
      {!loading && error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-crm-danger-border bg-crm-danger-bg p-4 text-sm text-crm-danger-text"><span>{error}</span><Button variant="outline" onClick={() => void loadApplications()}>Retry</Button></div>}
      {!loading && !error && applications.length === 0 && <div className="rounded-xl border border-alo-border bg-white p-10 text-center"><GraduationCap className="mx-auto mb-3 h-10 w-10 text-alo-text-muted/50" /><p className="font-semibold">No assigned applications</p><p className="mt-1 text-sm text-alo-text-muted">No records matched this employee’s assignment and filters.</p></div>}

      {!loading && !error && applications.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {applications.map((application) => {
          const selectedStage = selectedStages[application.id] || '';
          return <div key={application.id} className="rounded-xl border border-alo-border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-alo-text truncate">{application.studentName || 'Student name not recorded'}</p><p className="mt-1 text-xs font-mono text-alo-text-muted">{application.studentStudentId || application.id}</p></div><Badge variant="secondary">{application.stage || 'Stage not recorded'}</Badge></div>
            <div className="mt-4 space-y-2 text-sm"><p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-alo-text-muted" />{application.university || 'University not recorded'}</p><p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-alo-text-muted" />{application.course || 'Course not recorded'}</p><p className="text-xs text-alo-text-muted">{[application.country, application.intake].filter(Boolean).join(' · ') || 'Country/intake not recorded'}</p></div>
            {application.allowedNextStages.length > 0 && <div className="mt-4 flex flex-col sm:flex-row gap-2"><select aria-label={`Next stage for ${application.id}`} className="h-9 min-w-0 flex-1 rounded-lg border border-alo-border bg-white px-3 text-sm" value={selectedStage} onChange={(event) => setSelectedStages((current) => ({ ...current, [application.id]: event.target.value }))}><option value="">Choose permitted next stage</option>{application.allowedNextStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select><Button variant="brand" disabled={!selectedStage || updatingId === application.id} onClick={() => void updateStage(application)}>{updatingId === application.id ? 'Saving…' : <><CheckCircle2 className="mr-1 h-4 w-4" />Update stage</>}</Button></div>}
            {application.allowedNextStages.length === 0 && <p className="mt-4 flex items-center gap-2 text-xs text-alo-text-muted"><AlertTriangle className="h-4 w-4" />No stage transition is currently available or authorized.</p>}
            <p className="mt-3 text-[11px] text-alo-text-muted">Updated: {application.updatedAt ? new Date(application.updatedAt).toLocaleDateString() : 'Not recorded'}{application.deadline ? ` · Deadline: ${application.deadline}` : ''}</p>
          </div>;
        })}
      </div>}

      {!loading && !error && total > 0 && <div className="flex items-center justify-between text-sm"><span className="text-alo-text-muted">Page {page} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>}
    </div>
  );
}
