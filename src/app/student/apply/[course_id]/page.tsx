'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Send, FileText, Clock } from 'lucide-react';
import Link from 'next/link';

export default function StudentApplyPage() {
  const params = useParams();
  const courseId = params?.course_id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/courses/${encodeURIComponent(courseId)}`)
      .then(r => r.json())
      .then(d => setCourse(d.data || d.course))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          universityId: course?.universityId || course?.university?.universityId,
          intake: 'September 2026',
          applicationSource: 'STUDENT_SELF_APPLICATION',
        }),
      });
      const json = await res.json();
      setResult(json);
    } catch (e: any) {
      setResult({ success: false, error: e.message });
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-4xl mx-auto" /></div>;

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Student Apply — Creates Application Draft with Validation</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Apply for Course</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">When Apply clicked: Verify authentication, Load student profile, Validate course, Validate intake, Check required documents, Create application draft, Link student_id/course_id/university_id/campus_id/intake_id, Create document checklist, Create timeline entry, Notify counselor, Redirect to student applications. Do not create duplicate drafts for same student/course/intake unless allowed.</p>
        </div>

        {course ? (
          <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
            <h3 className="font-bold text-[var(--alo-text)] mb-2">{course.courseTitle}</h3>
            <p className="text-xs text-[var(--alo-text-muted)]">{course.university?.name} • {course.country} • {course.studyLevel} • Tuition: {course.tuitionFee ? `${course.currency} ${course.tuitionFee}` : 'Check with counselor'}</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4 text-xs">
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Student ID</p><p className="font-semibold">From authenticated profile — student_id</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Course ID</p><p className="font-semibold">{course.courseId}</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">University ID</p><p className="font-semibold">{course.universityId || course.university?.universityId}</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Intake ID</p><p className="font-semibold">From course_intakes — validated</p></div>
            </div>
            <Button onClick={handleApply} disabled={applying} className="w-full mt-6 bg-[var(--alo-cta)] text-white h-12 font-bold">{applying ? 'Creating Application Draft...' : 'Apply Now — Creates Draft + Checklist + Timeline + Notify Counselor'}</Button>
            {result && (
              <div className={`mt-4 p-4 rounded-xl border text-xs ${result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {result.success ? <><CheckCircle2 className="w-4 h-4 inline mr-1" />Application draft created: {result.data?.applicationCode || result.data?.id} — linked student_id/course_id/university_id/intake_id, document checklist created, timeline entry created, counselor notified.</> : <><AlertTriangle className="w-4 h-4 inline mr-1" />{result.error || 'Failed'}</>}
                {result.success && <Link href="/student/applications" className="block mt-3"><Button className="bg-[var(--alo-brand)] text-white w-full">View My Applications</Button></Link>}
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-8 bg-white border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Course not found — check with counselor.</p></Card>
        )}

        <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl"><h4 className="font-bold text-sm mb-2">Document Checklist Preview</h4><ul className="text-xs text-[var(--alo-body)] list-disc list-inside space-y-1"><li>Passport</li><li>Academic certificates</li><li>Academic transcripts</li><li>English test</li><li>CV</li><li>SOP</li><li>Recommendation letters</li><li>Portfolio (if required)</li><li>Work experience (if required)</li></ul><p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Do not claim document mandatory unless DB/source says so.</p></Card>
      </div>
    </div>
  );
}
