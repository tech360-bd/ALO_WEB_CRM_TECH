'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function PartnerProgramDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch(`/api/courses/${encodeURIComponent(id)}`).then(r=>r.json()).then(d=>setCourse(d.data||d.course)).catch(()=>{}).finally(()=>setLoading(false)); },[id]);
  if(loading) return <div className="p-12 pt-24 text-center text-[var(--alo-text-muted)]">Loading Program Detail — DB-driven...</div>;
  if(!course) return <div className="p-8 pt-24 text-center">Program not found.</div>;
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Partner Program Detail — Own Commission Only</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">{course.courseTitle}</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">{course.university?.name} • {course.country} • {course.studyLevel} • Tuition: {course.tuitionFee ? `${course.currency} ${course.tuitionFee}` : 'Check with counselor'}</p>
          <p className="text-xs text-[var(--alo-text-muted)] mt-3">Own commission where permitted: {course.commissions?.[0]?.partnerCommission ? `${course.commissions[0].partnerCommission}` : 'Check permitted — backend enforced, partner sees only own commission, other partner commissions/internal ALO notes/staff risk notes/full finance blocked.'}</p>
          <div className="flex gap-3 mt-6">
            <Link href={`/partner/apply/demo-student/${course.courseId}`}><Button className="bg-[var(--alo-cta)] text-black h-12 px-6 font-bold">Apply for Own Student</Button></Link>
            <Link href="/partner/search-programs"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Back to Search</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
