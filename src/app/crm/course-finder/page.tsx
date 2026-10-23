'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
export default function CrmCourseFinderPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch(`/api/courses/search?search=${encodeURIComponent(submittedSearch)}&limit=50`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Search is unavailable. Please check your access and try again.');
        return response.json();
      })
      .then(d => setCourses(d.data||[]))
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setCourses([]);
        setError(failure.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [submittedSearch, refresh]);
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">CRM Course Finder — Staff Internal Columns + Warnings</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">CRM — Course Finder</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Staff can search all courses — shows internal columns based on permissions: Source, Last verified, Data quality, Internal deadline, Risk status, Application note, University agreement, Commission where authorized. Add duplicate warning, verification warning, missing source warning, expired data warning. Same DB as public finder.</p>
        </div>
        <Card className="p-4 bg-white border-[var(--alo-border)] rounded-2xl"><form className="flex gap-3" onSubmit={event => { event.preventDefault(); setSubmittedSearch(search.trim()); setRefresh(value => value + 1); }}><Input placeholder="Search courses — same DB..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white border-[var(--alo-border)] h-11 flex-1" /><Button type="submit" disabled={loading} className="bg-[var(--alo-brand)] text-white ">Search — Staff</Button></form></Card>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {loading ? <div className="h-32 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" /> : (
          <Card className="p-0 bg-white border-[var(--alo-border)] rounded-2xl overflow-x-auto"><div className="min-w-[1400px]"><div className="grid grid-cols-10 gap-0 bg-[var(--alo-page)] p-3 text-xs font-semibold border-b border-[var(--alo-border)]"><div>Course</div><div>University</div><div>Country</div><div>Source</div><div>Last Verified</div><div>Data Quality</div><div>Int Deadline</div><div>Risk</div><div>Commission</div><div>Actions</div></div>{courses.map((c:any)=><div key={c.courseId} className="grid grid-cols-10 gap-0 p-3 text-xs border-b border-[var(--alo-border)]/60"><div className="font-medium truncate">{c.courseTitle}</div><div className="truncate">{c.university?.name}</div><div>{c.country}</div><div className="truncate">{c.sourceUrl||'Missing source warning'}</div><div>{c.lastVerifiedAt||'Verification warning'}</div><div><Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">{c.dataQualityScore||'Needs Review'}</Badge></div><div>Internal deadline</div><div>Risk status</div><div>{c.commissions?.[0]?.internalExpected ? `${c.commissions[0].internalExpected}` : 'Where authorized'}</div><div><Link href={`/crm/course/${c.courseId}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[var(--alo-border)]">View</Button></Link></div></div>)}{courses.length===0 && <div className="p-8 text-center text-sm text-[var(--alo-text-muted)]">No courses match your current filters.</div>}</div></Card>
        )}
      </div>
    </div>
  );
}
