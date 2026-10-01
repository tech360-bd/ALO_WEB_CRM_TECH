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
  useEffect(()=>{
    fetch(`/api/courses/search?search=${encodeURIComponent(search)}&limit=50`)
      .then(r=>r.json()).then(d=>setCourses(d.data||[]))
      .catch(()=> setCourses([]))
      .finally(()=> setLoading(false));
  },[search]);
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs mb-3">CRM Course Finder — Staff Internal Columns + Warnings</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">CRM — Course Finder</h1>
          <p className="text-sm text-gray-600 mt-2">Staff can search all courses — shows internal columns based on permissions: Source, Last verified, Data quality, Internal deadline, Risk status, Application note, University agreement, Commission where authorized. Add duplicate warning, verification warning, missing source warning, expired data warning. Same DB as public finder.</p>
        </div>
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl"><div className="flex gap-3"><Input placeholder="Search courses — same DB..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white border-[#E2E8F0] h-11 flex-1" /><Button className="bg-[#0B5ED7] text-white h-11">Search — Staff</Button></div></Card>
        {loading ? <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" /> : (
          <Card className="p-0 bg-white border-[#E2E8F0] rounded-2xl overflow-x-auto"><div className="min-w-[1400px]"><div className="grid grid-cols-10 gap-0 bg-[#F8FAFC] p-3 text-xs font-semibold border-b border-[#E2E8F0]"><div>Course</div><div>University</div><div>Country</div><div>Source</div><div>Last Verified</div><div>Data Quality</div><div>Int Deadline</div><div>Risk</div><div>Commission</div><div>Actions</div></div>{courses.map((c:any)=><div key={c.courseId} className="grid grid-cols-10 gap-0 p-3 text-xs border-b border-[#E2E8F0]/60"><div className="font-medium truncate">{c.courseTitle}</div><div className="truncate">{c.university?.name}</div><div>{c.country}</div><div className="truncate">{c.sourceUrl||'Missing source warning'}</div><div>{c.lastVerifiedAt||'Verification warning'}</div><div><Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{c.dataQualityScore||'Needs Review'}</Badge></div><div>Internal deadline</div><div>Risk status</div><div>{c.commissions?.[0]?.internalExpected ? `${c.commissions[0].internalExpected}` : 'Where authorized'}</div><div><Link href={`/crm/course/${c.courseId}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">View</Button></Link></div></div>)}{courses.length===0 && <div className="p-8 text-center text-sm text-gray-500">No courses match your current filters — real DB.</div>}</div></Card>
        )}
      </div>
    </div>
  );
}
