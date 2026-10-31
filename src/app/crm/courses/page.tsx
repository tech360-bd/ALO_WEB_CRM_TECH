'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
export default function CrmCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(()=>{
    fetch(`/api/crm/courses?search=${encodeURIComponent(search)}&limit=50`)
      .then(r=>r.json()).then(d=>setCourses(d.courses||d.data||[]))
      .catch(()=> setCourses([]))
      .finally(()=> setLoading(false));
  },[search]);
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">CRM Courses — Staff Permission-Based</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">CRM — Courses</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Staff can search all courses — internal columns based on permissions: Source, Last verified, Data quality, Internal deadline, Risk status, Application note, University agreement, Commission where authorized. Add duplicate warning, verification warning, missing source warning, expired data warning.</p>
        </div>
        <Card className="p-4 bg-white border-[var(--alo-border)] rounded-2xl"><div className="flex gap-3"><Input placeholder="Search courses..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white border-[var(--alo-border)] h-11 flex-1" /><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-brand)] text-white ">Search</Button></div></Card>
        {loading ? <div className="h-32 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" /> : (
          <Card className="p-0 bg-white border-[var(--alo-border)] rounded-2xl overflow-x-auto"><div className="min-w-[1200px]"><div className="grid grid-cols-8 gap-0 bg-[var(--alo-page)] p-3 text-xs font-semibold border-b border-[var(--alo-border)]"><div>Course</div><div>University</div><div>Country</div><div>Source</div><div>Last Verified</div><div>Data Quality</div><div>Status</div><div>Actions</div></div>{courses.map((c:any)=><div key={c.courseId} className="grid grid-cols-8 gap-0 p-3 text-xs border-b border-[var(--alo-border)]/60"><div className="font-medium truncate">{c.courseTitle}</div><div className="truncate">{c.university?.name||c.universityName}</div><div>{c.country}</div><div className="truncate">{c.sourceUrl||'Missing source'}</div><div>{c.lastVerifiedAt||'Expired'}</div><div><Badge className="bg-crm-warning-bg text-crm-warning-text border-crm-warning-border text-[11px]">Needs Review</Badge></div><div>{c.status}</div><div className="flex gap-1"><Link href={`/crm/course/${c.courseId}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[var(--alo-border)]">View</Button></Link></div></div>)}{courses.length===0 && <div className="p-8 text-center text-sm text-[var(--alo-text-muted)]">No courses match your current filters.</div>}</div></Card>
        )}
      </div>
    </div>
  );
}
