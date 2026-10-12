'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plane, GraduationCap, Clock, Filter, Users, ChevronDown, ChevronUp, Eye, RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;
interface Student {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  email: string;
  destination: string;
  level: string;
  subject: string;
  journeyStage: string;
  counselor: string;
  updatedAt: string;
  profileCompletion: number;
  applicationCount: number;
}
interface Application {
  id: string;
  university: string;
  course: string;
  country: string;
  intake: string;
  stage: string;
  updatedAt: string;
}

function label(value: string) {
  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ').trim();
  return normalized ? normalized.replace(/\b\w/g, (character) => character.toUpperCase()) : 'Not recorded';
}
function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartnerStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [studentApps, setStudentApps] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (countryFilter !== 'all') params.set('destinationCountry', countryFilter);
      const response = await fetch(`/api/partner/students?${params}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.error || `Could not load student records (HTTP ${response.status})`);
      }
      setStudents(payload.data.map((student: any): Student => ({
        id: String(student.id || ''),
        studentId: String(student.studentId || ''),
        name: String(student.fullName || 'Student name unavailable'),
        phone: String(student.user?.phone || ''),
        email: String(student.user?.email || ''),
        destination: String(student.preferredCountry || ''),
        level: String(student.preferredLevel || ''),
        subject: String(student.preferredSubject || ''),
        journeyStage: String(student.journeyStage || ''),
        counselor: String(student.counselorName || ''),
        updatedAt: String(student.updatedAt || ''),
        profileCompletion: Number(student.profileCompletion || 0),
        applicationCount: Number(student._count?.applications || 0),
      })));
      setTotal(Number(payload.pagination?.total || 0));
      setTotalPages(Math.max(1, Number(payload.pagination?.totalPages || 1)));
    } catch (caught) {
      setStudents([]);
      setTotal(0);
      setTotalPages(1);
      setError(caught instanceof Error ? caught.message : 'Could not load partner student records.');
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, countryFilter]);

  useEffect(() => { void fetchStudents(); }, [fetchStudents]);

  const handleExpandStudent = async (student: Student) => {
    if (expandedStudent === student.id) {
      setExpandedStudent(null);
      setStudentApps([]);
      setAppsError(null);
      return;
    }
    setExpandedStudent(student.id);
    setStudentApps([]);
    setAppsError(null);
    setAppsLoading(true);
    try {
      const params = new URLSearchParams({ studentProfileId: student.id, page: '1', limit: '20' });
      const response = await fetch(`/api/partner/applications?${params}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.error || 'Could not load this student’s applications.');
      }
      setStudentApps(payload.data.map((application: any): Application => ({
        id: String(application.id || ''),
        university: String(application.university || 'University not recorded'),
        course: String(application.course || 'Course not recorded'),
        country: String(application.country || ''),
        intake: String(application.intake || ''),
        stage: String(application.stage || ''),
        updatedAt: String(application.updatedAt || ''),
      })));
    } catch (caught) {
      setAppsError(caught instanceof Error ? caught.message : 'Could not load applications.');
    } finally {
      setAppsLoading(false);
    }
  };

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-20 w-full rounded-xl" /></div><Skeleton className="h-[400px] w-full rounded-xl" /></div>;

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">My Students</h1><p className="text-sm text-alo-text-muted mt-0.5">Student profiles linked to your partner account</p></div><Badge variant="muted" className="text-xs w-fit"><Users className="mr-1 h-3 w-3" />{total} students</Badge></div>

      {error && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-amber-900">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchStudents()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="flex flex-col lg:flex-row gap-3 p-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search this list by student name, ID, or email..." className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div><div className="flex flex-wrap items-center gap-2"><Filter className="w-4 h-4 text-alo-text-muted hidden sm:block" /><Select value={stageFilter} onValueChange={(value) => { setStageFilter(value); setPage(1); }}><SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All journey stages</SelectItem><SelectItem value="lead_created">Lead created</SelectItem><SelectItem value="profile_incomplete">Profile incomplete</SelectItem><SelectItem value="application_drafted">Application drafted</SelectItem><SelectItem value="application_submitted">Application submitted</SelectItem><SelectItem value="offer_received">Offer received</SelectItem><SelectItem value="visa_preparation">Visa preparation</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem></SelectContent></Select><Select value={countryFilter} onValueChange={(value) => { setCountryFilter(value); setPage(1); }}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All destinations</SelectItem><SelectItem value="United Kingdom">United Kingdom</SelectItem><SelectItem value="United States">United States</SelectItem><SelectItem value="Canada">Canada</SelectItem><SelectItem value="Australia">Australia</SelectItem><SelectItem value="New Zealand">New Zealand</SelectItem></SelectContent></Select></div></CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader><CardTitle className="text-base font-semibold text-alo-text">Student Records</CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-white z-10"><tr className="border-b text-left text-xs text-alo-text-muted"><th className="p-3">Student</th><th className="p-3">Destination</th><th className="hidden md:table-cell p-3">Study preference</th><th className="p-3">Journey stage</th><th className="hidden sm:table-cell p-3">Applications</th><th className="hidden lg:table-cell p-3">Updated</th><th className="p-3">Details</th></tr></thead><tbody>
        {students.length === 0 ? <tr><td colSpan={7} className="h-32 text-center text-alo-text-muted">{error ? 'Student records could not be loaded.' : 'No student profiles match this page and filter.'}</td></tr> : students.map((student) => <Fragment key={student.id}><tr className="border-b last:border-0 hover:bg-alo-brand-light/20"><td className="p-3"><p className="font-medium text-alo-text">{student.name}</p><p className="text-[11px] text-alo-text-muted">{student.studentId || 'Student ID not recorded'}</p><p className="text-[11px] text-alo-text-muted">{student.email || student.phone || 'Contact not recorded'}</p></td><td className="p-3"><span className="inline-flex items-center gap-1 text-xs text-alo-text-secondary"><Plane className="h-3 w-3" />{student.destination || 'Not recorded'}</span></td><td className="hidden md:table-cell p-3 text-xs text-alo-text-secondary"><span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" />{[student.level, student.subject].filter(Boolean).join(' · ') || 'Not recorded'}</span></td><td className="p-3"><Badge variant="outline" className="text-[11px]">{label(student.journeyStage)}</Badge><p className="mt-1 text-[11px] text-alo-text-muted">Profile {Math.max(0, Math.min(100, student.profileCompletion))}%</p></td><td className="hidden sm:table-cell p-3 text-sm text-alo-text-secondary">{student.applicationCount}</td><td className="hidden lg:table-cell p-3"><span className="inline-flex items-center gap-1 text-xs text-alo-text-muted"><Clock className="h-3 w-3" />{formatDate(student.updatedAt)}</span></td><td className="p-3"><Button variant="ghost" size="sm" aria-label={`${expandedStudent === student.id ? 'Hide' : 'Show'} applications for ${student.name}`} onClick={() => void handleExpandStudent(student)}>{expandedStudent === student.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}<Eye className="ml-1 h-3.5 w-3.5" /></Button></td></tr>{expandedStudent === student.id && <tr key={`${student.id}-applications`} className="bg-slate-50"><td colSpan={7} className="p-4"><div className="rounded-lg border border-alo-border bg-white p-4"><h3 className="mb-3 text-sm font-semibold text-alo-text">Applications for {student.name}</h3>{appsLoading ? <Skeleton className="h-16 w-full" /> : appsError ? <p className="text-sm text-amber-800">{appsError}</p> : studentApps.length === 0 ? <p className="text-sm text-alo-text-muted">No applications are recorded for this student.</p> : <div className="space-y-2">{studentApps.map((application) => <div key={application.id} className="flex flex-wrap items-center justify-between gap-2 border-b last:border-0 py-2"><div><p className="text-sm font-medium text-alo-text">{application.university} · {application.course}</p><p className="text-xs text-alo-text-muted">{[application.country, application.intake].filter(Boolean).join(' · ') || 'Destination and intake not recorded'}</p></div><div className="text-right"><Badge variant="outline" className="text-[11px]">{label(application.stage)}</Badge><p className="mt-1 text-[11px] text-alo-text-muted">{formatDate(application.updatedAt)}</p></div></div>)}</div>}</div></td></tr>}</Fragment>)}
        </tbody></table></div></CardContent></Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-alo-text-muted"><p>Showing {students.length} records on page {page} · {total} total student profiles</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>Previous</Button><span>{page} / {totalPages}</span><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</Button></div></div>
    </div>
  );
}
