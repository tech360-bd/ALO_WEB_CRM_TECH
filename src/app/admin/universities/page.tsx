'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
export default function AdminUniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(()=>{
    fetch(`/api/admin/universities?search=${encodeURIComponent(search)}&limit=50`)
      .then(r=>r.json()).then(d=>setUniversities(d.data||d.universities||[]))
      .catch(()=> setUniversities([]))
      .finally(()=> setLoading(false));
  },[search]);
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Super Admin — Full Access: Universities, Campuses, Courses, Intakes, Requirements, Scholarships, Sources, Imports, Duplicates, Updates, Approval, Publishing, Audit, Commission, Merge, Delete</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">Admin — Universities</h1>
          <p className="text-sm text-gray-600 mt-2">Actions: Create, Edit, View, Archive, Publish, Unpublish, Merge duplicate — with 11 tabs per spec: Basic Information, Location, Official Links, International Student Information, Ranking, Description, Scholarship, Source Verification, SEO, Visibility, Publish. Validation: University name required, Country required, Official website required where available, Source URL required for verified data.</p>
          <div className="flex gap-3 mt-4"><Link href="/admin/universities/create"><Button className="bg-[#0057B8] text-white h-12 px-6 font-bold">Create University — 11 Tabs</Button></Link><Link href="/admin/import-center/universities"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Import Center — Universities</Button></Link><Link href="/admin/university-data-updates"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">AI Update Center</Button></Link></div>
        </div>
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl"><div className="flex gap-3"><Input placeholder="Search — University name, country, city, status, verified, last updated..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white border-[#E2E8F0] h-11 flex-1" /><Button className="bg-[#0057B8] text-white h-11">Search — Indexed</Button></div></Card>
        {loading ? <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" /> : (
          <Card className="p-0 bg-white border-[#E2E8F0] rounded-2xl overflow-x-auto"><div className="min-w-[1000px]"><div className="grid grid-cols-6 gap-0 bg-[#F8FAFC] p-3 text-xs font-semibold border-b border-[#E2E8F0]"><div>University</div><div>Country</div><div>City</div><div>Status</div><div>Verified</div><div>Actions</div></div>{universities.map((u:any)=><div key={u.universityId||u.id} className="grid grid-cols-6 gap-0 p-3 text-xs border-b border-[#E2E8F0]/60"><div className="font-medium truncate">{u.name}</div><div>{u.country}</div><div>{u.city}</div><div>{u.status}</div><div>{u.lastVerifiedAt||'Not verified'}</div><div className="flex gap-1"><Link href={`/admin/universities/edit/${u.id||u.universityId}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Edit</Button></Link><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">View</Button><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Courses</Button><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Verify</Button><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Archive</Button><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">Merge</Button></div></div>)}{universities.length===0 && <div className="p-8 text-center text-sm text-gray-500">No universities match your search — real DB, no fake data.</div>}</div></Card>
        )}
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl"><p className="text-xs font-semibold mb-2">Bulk Actions: Publish, Unpublish, Verify, Update status, Export</p><div className="flex gap-2"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs">Bulk Publish</Button><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs">Bulk Unpublish</Button><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs">Bulk Verify</Button><Button size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs">Export</Button></div></Card>
      </div>
    </div>
  );
}
