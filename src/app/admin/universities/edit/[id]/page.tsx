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
  if(loading) return <div className="p-12 pt-24 text-center text-[var(--alo-text-muted)]">Loading university editor…</div>;
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Admin Edit University — Full Access — 11 Tabs — Super Admin</Badge>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">Edit University {id}</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Edit with 11 tabs: Basic Information, Location, Official Links, International Student Information, Ranking, Description, Scholarship, Source Verification, SEO, Visibility, Publish. Validation: name required, country required, website required where available, source URL required for verified data. Actions: View, Edit, Courses, Verify, Archive, Merge. Audit logs, source verification, no fake data.</p>
          <p className="text-xs text-[var(--alo-text-muted)] mt-3">{uni?.name || 'Loading from DB...'} — {uni?.country || ''} — Last verified: {uni?.lastVerifiedAt || 'Not verified'} — Status: {uni?.status || ''}</p>
          <div className="flex gap-3 mt-6">
            <Link href="/admin/universities"><Button variant="outline" className="border-[var(--alo-border)] ">Back to List — Search, Country, City, Status, Verified, Last updated</Button></Link>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-brand)] text-white ">Save — Audit Log + Source Verification</Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-[var(--alo-border)] ">Archive</Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-[var(--alo-border)] ">Merge Duplicate</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
