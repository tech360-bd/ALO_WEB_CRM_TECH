'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function StudentApplyPage() {
  const params = useParams();
  const courseId = params?.course_id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses/${encodeURIComponent(courseId)}`)
      .then(r => r.json())
      .then(d => setCourse(d.data || d.course))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-4xl mx-auto" /></div>;

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Student application</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Apply for Course</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Complete your application profile (Form B) before applying. Your application will be saved as a draft; it is not sent to the university automatically.</p>
        </div>

        {course ? (
          <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <h3 className="font-bold text-[var(--alo-text)] mb-2">{course.courseTitle}</h3>
            <p className="text-xs text-[var(--alo-text-muted)]">{course.university?.name} • {course.country} • {course.studyLevel} • Tuition: {course.tuitionFee ? `${course.currency} ${course.tuitionFee}` : 'Check with counselor'}</p>
            <p className="mt-4 text-sm text-[var(--alo-body)]">For available intakes and the application checklist, continue to the dedicated application page.</p>
            <Link href={`/apply/${encodeURIComponent(course.slug || course.courseId || courseId)}`} className="block mt-6">
              <Button className="w-full bg-[var(--alo-cta)] text-white h-12 font-bold">Continue to Apply Now</Button>
            </Link>
          </Card>
        ) : (
          <Card className="p-8 bg-white border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-crm-warning-text mx-auto mb-2" /><p className="text-sm">Course not found — check with counselor.</p></Card>
        )}

        <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Document Checklist Preview</h4><ul className="text-xs text-[var(--alo-body)] list-disc list-inside space-y-1"><li>Passport</li><li>Academic certificates</li><li>Academic transcripts</li><li>English test</li><li>CV</li><li>SOP</li><li>Recommendation letters</li><li>Portfolio (if required)</li><li>Work experience (if required)</li></ul><p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Do not claim document mandatory unless DB/source says so.</p></Card>
      </div>
    </div>
  );
}
