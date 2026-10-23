'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
export default function CrmCourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ fetch(`/api/courses/${encodeURIComponent(id)}`).then(r=>r.json()).then(d=>setCourse(d.data||d.course)).catch(()=>{}).finally(()=>setLoading(false)); },[id]);
  if(loading) return <div className="p-12 pt-24 text-center">Loading CRM Course Detail...</div>;
  if(!course) return <div className="p-8 pt-24 text-center">Course not found.</div>;
  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 space-y-6">
        <Card className="p-8 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">CRM Course Detail — Permission-Based Internal Fields</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">{course.courseTitle}</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">{course.university?.name} • {course.country} • {course.studyLevel} • Tuition: {course.tuitionFee ? `${course.currency} ${course.tuitionFee}` : 'Tuition information is currently being verified.'}</p>
          <div className="grid sm:grid-cols-2 gap-3 mt-6 text-xs">
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Source</p><p className="font-medium truncate">{course.sourceUrl||'Missing source warning'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Last Verified</p><p className="font-medium">{course.lastVerifiedAt||'Verification warning — expired data warning'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Data Quality</p><p className="font-medium">{course.dataQualityScore ? `${course.dataQualityScore}/100` : 'Needs Review — calculate internal quality score'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Commission</p><p className="font-medium">Where authorized — backend protected, public API never returns commission</p></div>
          </div>
          <Link href="/crm/course-finder"><Button variant="outline" className="mt-6 border-[var(--alo-border)] ">Back to CRM Course Finder</Button></Link>
        </Card>
      </div>
    </div>
  );
}
