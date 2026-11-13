'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, GraduationCap, MapPin, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  studentId: string;
  destination: string;
  intake: string;
  subject: string;
  level: string;
  stage: string;
  updatedAt: string | null;
}

const PAGE_SIZE = 20;

export default function EmployeeStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), sortBy: 'updatedAt', sortOrder: 'desc' });
      if (search.trim()) params.set('search', search.trim());
      if (stageFilter) params.set('stage', stageFilter);
      if (countryFilter) params.set('country', countryFilter);
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`/api/employee/students?${params.toString()}`, { headers, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Could not load assigned students (HTTP ${response.status}).`);
      const rows = Array.isArray(payload.data) ? payload.data : [];
      setStudents(rows.map((row: any) => ({
        id: String(row.id || ''),
        name: String(row.fullName || ''),
        studentId: String(row.studentId || ''),
        destination: String(row.preferredCountry || ''),
        intake: String(row.preferredIntake || ''),
        subject: String(row.preferredSubject || ''),
        level: String(row.preferredLevel || ''),
        stage: String(row.journeyStage || ''),
        updatedAt: row.updatedAt || null,
      })));
      setTotal(Number.isSafeInteger(payload.pagination?.total) ? payload.pagination.total : 0);
    } catch (cause) {
      setStudents([]);
      setTotal(0);
      setError(cause instanceof Error ? cause.message : 'Assigned students could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, countryFilter]);

  useEffect(() => { void loadStudents(); }, [loadStudents]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Assigned Students</h1>
          <p className="text-sm text-alo-text-muted mt-1">Only student records assigned to your authenticated employee account are shown.</p>
        </div>
        <Badge variant="outline">{loading ? 'Loading' : `${total} assigned record${total === 1 ? '' : 's'}`}</Badge>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input aria-label="Search assigned students" placeholder="Search name, student ID, country or subject" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} className="pl-10 bg-alo-page border-alo-border" />
            </div>
            <Input aria-label="Filter by journey stage" className="md:w-44" placeholder="Exact journey stage" value={stageFilter} onChange={(event) => { setPage(1); setStageFilter(event.target.value); }} />
            <Input aria-label="Filter by destination country" className="md:w-44" placeholder="Country" value={countryFilter} onChange={(event) => { setPage(1); setCountryFilter(event.target.value); }} />
            <Button variant="outline" onClick={() => void loadStudents()} disabled={loading} aria-label="Refresh assigned students">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="space-y-3" aria-live="polite">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-xl" />)}</div>}

      {!loading && error && (
        <Card role="alert" className="border-crm-danger-border bg-crm-danger-bg"><CardContent className="p-5 flex items-center justify-between gap-3 text-sm text-crm-danger-text"><span>{error}</span><Button variant="outline" onClick={() => void loadStudents()}>Retry</Button></CardContent></Card>
      )}

      {!loading && !error && students.length === 0 && (
        <Card className="bg-white border-alo-border"><CardContent className="p-10 text-center"><GraduationCap className="w-10 h-10 text-alo-text-muted/50 mx-auto mb-3" /><p className="font-semibold text-alo-text">No assigned student records</p><p className="text-sm text-alo-text-muted mt-1">No records matched this employee’s current assignment and filters.</p></CardContent></Card>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="space-y-3">
          {students.map((student) => {
            const expanded = expandedId === student.id;
            return (
              <Card key={student.id} className="bg-white rounded-xl border border-alo-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-alo-text truncate">{student.name || 'Name not recorded'}</p>
                      <p className="text-xs font-mono text-alo-text-muted mt-1">{student.studentId || 'Student ID not recorded'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {student.destination && <Badge variant="outline" className="gap-1"><MapPin className="w-3 h-3" />{student.destination}</Badge>}
                      {student.stage && <Badge variant="secondary">{student.stage}</Badge>}
                      <Button variant="outline" size="sm" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : student.id)}>
                        {expanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                        {expanded ? 'Hide details' : 'Details'}
                      </Button>
                    </div>
                  </div>
                  {expanded && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 border-t border-alo-border pt-4 text-sm">
                      <div><p className="text-xs text-alo-text-muted">Destination</p><p>{student.destination || 'Not recorded'}</p></div>
                      <div><p className="text-xs text-alo-text-muted">Intake</p><p>{student.intake || 'Not recorded'}</p></div>
                      <div><p className="text-xs text-alo-text-muted">Study subject</p><p>{student.subject || 'Not recorded'}</p></div>
                      <div><p className="text-xs text-alo-text-muted">Study level</p><p>{student.level || 'Not recorded'}</p></div>
                      <div><p className="text-xs text-alo-text-muted">Last profile update</p><p>{student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : 'Not recorded'}</p></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-alo-text-muted">Page {page} of {pageCount}</p>
            <div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button variant="outline" disabled={page >= pageCount || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
