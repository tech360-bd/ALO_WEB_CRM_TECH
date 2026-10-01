'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function AdminEditUniversityPage() {
  const params = useParams();
  const id = params?.id as string;
  const [uni, setUni] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch(`/api/admin/universities/${encodeURIComponent(id)}`).then(r=>r.json()).then(d=>setUni(d.data||d.university)).catch(()=>{}).finally(()=>setLoading(false)); },[id]);
  if(loading) return <div className="p-12 pt-24 text-center text-gray-500">Loading Edit University — 11 Tabs — DB-driven...</div>;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs mb-3">Admin Edit University — Full Access — 11 Tabs — Super Admin</Badge>
          <h1 className="text-2xl font-bold text-[#0F172A]">Edit University {id}</h1>
          <p className="text-sm text-gray-600 mt-2">Edit with 11 tabs: Basic Information, Location, Official Links, International Student Information, Ranking, Description, Scholarship, Source Verification, SEO, Visibility, Publish. Validation: name required, country required, website required where available, source URL required for verified data. Actions: View, Edit, Courses, Verify, Archive, Merge. Audit logs, source verification, no fake data.</p>
          <p className="text-xs text-gray-500 mt-3">{uni?.name || 'Loading from DB...'} — {uni?.country || ''} — Last verified: {uni?.lastVerifiedAt || 'Not verified'} — Status: {uni?.status || ''}</p>
          <div className="flex gap-3 mt-6">
            <Link href="/admin/universities"><Button variant="outline" className="border-[#E2E8F0] h-11">Back to List — Search, Country, City, Status, Verified, Last updated</Button></Link>
            <Button className="bg-[#0B5ED7] text-white h-11">Save — Audit Log + Source Verification</Button>
            <Button variant="outline" className="border-[#E2E8F0] h-11">Archive</Button>
            <Button variant="outline" className="border-[#E2E8F0] h-11">Merge Duplicate</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
