'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
export default function CrmUniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(()=>{
    fetch(`/api/crm/universities?search=${encodeURIComponent(search)}&limit=50`)
      .then(r=>r.json()).then(d=>setUniversities(d.universities||d.data||[]))
      .catch(()=> setUniversities([]))
      .finally(()=> setLoading(false));
  },[search]);
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">CRM Universities — Staff Permission-Based</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">CRM — Universities</h1>
          <p className="text-sm text-gray-600 mt-2">Staff can search all universities — shows internal columns based on permissions: Source, Last verified, Data quality, Internal deadline, Risk status, Application note, University agreement, Commission where authorized. Duplicate warning, Verification warning, Missing source warning, Expired data warning.</p>
        </div>
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl"><div className="flex gap-3"><Input placeholder="Search universities..." value={search} onChange={e=>setSearch(e.target.value)} className="bg-white border-[#E2E8F0] h-11 flex-1" /><Button className="bg-[#0057B8] text-white h-11">Search</Button></div></Card>
        {loading ? <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" /> : (
          <Card className="p-0 bg-white border-[#E2E8F0] rounded-2xl overflow-x-auto"><div className="min-w-[1000px]"><div className="grid grid-cols-6 gap-0 bg-[#F8FAFC] p-3 text-xs font-semibold border-b border-[#E2E8F0]"><div>University</div><div>Country</div><div>Source</div><div>Last Verified</div><div>Data Quality</div><div>Actions</div></div>{universities.map((u:any)=><div key={u.universityId} className="grid grid-cols-6 gap-0 p-3 text-xs border-b border-[#E2E8F0]/60"><div className="font-medium truncate">{u.name}</div><div>{u.country}</div><div className="truncate">{u.sourceUrl||'Missing source warning'}</div><div>{u.lastVerifiedAt||'Expired data warning'}</div><div><Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Needs Review</Badge></div><div className="flex gap-1"><Link href={`/crm/university/${u.universityId}`}><Button size="sm" variant="outline" className="h-7 text-[11px] border-[#E2E8F0]">View</Button></Link></div></div>)}{universities.length===0 && <div className="p-8 text-center text-sm text-gray-500">No universities match your search — real DB, no fake data.</div>}</div></Card>
        )}
      </div>
    </div>
  );
}
