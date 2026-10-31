'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Building2, Plane, Clock, Filter, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;
interface Application {
  id: string;
  studentName: string;
  studentId: string;
  university: string;
  course: string;
  country: string;
  intake: string;
  stage: string;
  updatedAt: string;
}

function stageLabel(stage: string) {
  const normalized = stage.toLowerCase().replace(/[_-]+/g, ' ').trim();
  return normalized ? normalized.replace(/\b\w/g, (character) => character.toUpperCase()) : 'Stage not recorded';
}

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartnerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      const response = await fetch(`/api/partner/applications?${params}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.error || `Could not load applications (HTTP ${response.status})`);
      }
      setApplications(payload.data.map((application: any): Application => ({
        id: String(application.id || ''),
        studentName: String(application.studentProfile?.fullName || 'Student name unavailable'),
        studentId: String(application.studentProfile?.studentId || ''),
        university: String(application.university || 'University not recorded'),
        course: String(application.course || 'Course not recorded'),
        country: String(application.country || application.studentProfile?.preferredCountry || 'Country not recorded'),
        intake: String(application.intake || application.studentProfile?.preferredIntake || ''),
        stage: String(application.stage || ''),
        updatedAt: String(application.updatedAt || ''),
      })));
      setTotal(Number(payload.pagination?.total || 0));
      setTotalPages(Math.max(1, Number(payload.pagination?.totalPages || 1)));
    } catch (caught) {
      setApplications([]);
      setTotal(0);
      setTotalPages(1);
      setError(caught instanceof Error ? caught.message : 'Could not load partner applications.');
    } finally {
      setLoading(false);
    }
  }, [page, stageFilter]);

  useEffect(() => { void fetchApplications(); }, [fetchApplications]);

  const filtered = applications.filter((application) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return application.studentName.toLowerCase().includes(query)
      || application.studentId.toLowerCase().includes(query)
      || application.id.toLowerCase().includes(query)
      || application.university.toLowerCase().includes(query)
      || application.course.toLowerCase().includes(query);
  });

  if (loading) {
    return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-[420px] w-full rounded-xl" /></div>;
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-alo-text">Application Tracker</h1><p className="text-sm text-alo-text-muted mt-0.5">Applications for student profiles linked to your partner account</p></div>
        <Badge variant="muted" className="text-xs w-fit">{total} applications</Badge>
      </div>

      {error && <Card className="border-crm-warning-border bg-crm-warning-bg"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-crm-warning-text">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchApplications()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="flex flex-col sm:flex-row gap-3 p-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search this page by student, application ID, university, or course..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="flex items-center gap-2"><Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" /><Select value={stageFilter} onValueChange={(value) => { setStageFilter(value); setPage(1); }}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All stages</SelectItem><SelectItem value="research">Research</SelectItem><SelectItem value="documents">Documents</SelectItem><SelectItem value="submitted">Submitted</SelectItem><SelectItem value="offer">Offer</SelectItem><SelectItem value="visa">Visa</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem></SelectContent></Select></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader><CardTitle className="text-base font-semibold text-alo-text">Partner Applications</CardTitle></CardHeader>
        <CardContent className="p-0"><div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar"><Table><TableHeader className="sticky top-0 bg-white z-10"><TableRow><TableHead>Application ID</TableHead><TableHead>Student</TableHead><TableHead className="hidden md:table-cell">University</TableHead><TableHead className="hidden lg:table-cell">Course</TableHead><TableHead className="hidden sm:table-cell">Destination</TableHead><TableHead>Stage</TableHead><TableHead className="hidden sm:table-cell">Last Update</TableHead></TableRow></TableHeader><TableBody>
          {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-alo-text-muted">{error ? 'Application records could not be loaded.' : 'No applications match this page and filter.'}</TableCell></TableRow> : filtered.map((application) => <TableRow key={application.id} className="hover:bg-alo-brand-light/20"><TableCell className="font-mono text-xs text-alo-text-muted" title={application.id}>{application.id ? application.id.slice(-10) : '—'}</TableCell><TableCell><p className="text-sm font-medium text-alo-text">{application.studentName}</p><p className="text-xs text-alo-text-muted">{application.studentId || 'Student ID not recorded'}</p></TableCell><TableCell className="hidden md:table-cell"><span className="inline-flex items-center gap-1.5 text-sm text-alo-text-secondary"><Building2 className="w-3.5 h-3.5 text-alo-text-muted" />{application.university}</span></TableCell><TableCell className="hidden lg:table-cell text-xs text-alo-text-secondary">{application.course}</TableCell><TableCell className="hidden sm:table-cell"><span className="inline-flex items-center gap-1 text-xs text-alo-text-secondary"><Plane className="w-3 h-3" />{application.country}</span></TableCell><TableCell><Badge variant="outline" className="text-[11px]">{stageLabel(application.stage)}</Badge>{application.intake && <p className="mt-1 text-[11px] text-alo-text-muted">{application.intake}</p>}</TableCell><TableCell className="hidden sm:table-cell"><span className="inline-flex items-center gap-1 text-xs text-alo-text-muted"><Clock className="w-3 h-3" />{formatDate(application.updatedAt)}</span></TableCell></TableRow>)}
          </TableBody></Table></div></CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-text-muted"><p>Showing {filtered.length} of {applications.length} records on page {page} · {total} total applications</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button><span>{page} / {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</Button></div></div>
    </div>
  );
}
