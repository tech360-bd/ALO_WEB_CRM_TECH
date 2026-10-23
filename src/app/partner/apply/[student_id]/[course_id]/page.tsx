'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function PartnerApplyPage() {
  const params = useParams();
  const studentId = params?.student_id as string;
  const courseId = params?.course_id as string;
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, courseId, applicationSource: 'PARTNER_APPLICATION', partnerId: 'own-partner' }) });
      const json = await res.json();
      setResult(json);
    } catch(e:any){ setResult({ success:false, error:e.message }); } finally{ setApplying(false); }
  };
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Partner Apply — Own Student Only, Own Commission Where Permitted</Badge>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">Apply for Student {studentId} — Course {courseId}</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Partner can apply for own students only — other partner students blocked at backend via partnerId. Creates application draft with student_id/course_id/university_id/intake_id linked, document checklist, timeline, counselor notification. Commission: own permitted only.</p>
          <Button onClick={handleApply} disabled={applying} className="w-full mt-6 bg-[var(--alo-cta)] text-black h-12 font-bold">{applying ? 'Applying...' : 'Apply — Creates Draft + Checklist + Timeline'}</Button>
          {result && <div className={`mt-4 p-4 rounded-xl border text-xs ${result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>{result.success ? `Application created: ${result.data?.applicationCode || result.data?.id}` : result.error}<Link href="/partner/dashboard" className="block mt-3"><Button className="bg-[var(--alo-brand)] text-white w-full">View Applications</Button></Link></div>}
        </Card>
      </div>
    </div>
  );
}
