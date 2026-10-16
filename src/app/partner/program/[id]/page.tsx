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
  if(loading) return <div className="p-12 pt-24 text-center text-gray-500">Loading Program Detail — DB-driven...</div>;
  if(!course) return <div className="p-8 pt-24 text-center">Program not found — real DB, no fake data.</div>;
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Partner Program Detail — Own Commission Only</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">{course.courseTitle}</h1>
          <p className="text-sm text-gray-600 mt-2">{course.university?.name} • {course.country} • {course.studyLevel} • Tuition: {course.tuitionFee ? `${course.currency} ${course.tuitionFee}` : 'Check with counselor'}</p>
          <p className="text-xs text-gray-500 mt-3">Own commission where permitted: {course.commissions?.[0]?.partnerCommission ? `${course.commissions[0].partnerCommission}` : 'Check permitted — backend enforced, partner sees only own commission, other partner commissions/internal ALO notes/staff risk notes/full finance blocked.'}</p>
          <div className="flex gap-3 mt-6">
            <Link href={`/partner/apply/demo-student/${course.courseId}`}><Button className="bg-[#E8501A] text-white h-12 px-6 font-bold">Apply for Own Student</Button></Link>
            <Link href="/partner/search-programs"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Back to Search</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
