'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function CrmUniversityDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [uni, setUni] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch(`/api/universities/${encodeURIComponent(id)}`).then(r=>r.json()).then(d=>setUni(d.data||d.university)).catch(()=>{}).finally(()=>setLoading(false)); },[id]);
  if(loading) return <div className="p-12 pt-24 text-center">Loading CRM University Detail...</div>;
  if(!uni) return <div className="p-8 pt-24 text-center">University not found.</div>;
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">CRM University Detail — Permission-Based Fields</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">{uni.name}</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">{uni.city}, {uni.country} • {uni.totalCourses || 0} courses • Last verified: {uni.lastVerifiedAt || 'Not verified'} • Source: {uni.sourceUrl || 'Missing source warning'}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6 text-xs">
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Internal Notes</p><p className="font-medium">Staff-only — permission-based</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">University Agreement</p><p className="font-medium">Staff-only where authorized</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Commission</p><p className="font-medium">Where authorized — backend protected</p></div>
            <div className="bg-amber-50 border-amber-200 rounded-xl p-3"><p className="text-amber-800 font-semibold">Warnings</p><p className="text-amber-700">Duplicate warning, Verification warning, Missing source warning, Expired data warning</p></div>
          </div>
          <Link href="/crm/universities"><Button variant="outline" className="mt-6 border-[var(--alo-border)] ">Back to CRM Universities</Button></Link>
        </Card>
      </div>
    </div>
  );
}
