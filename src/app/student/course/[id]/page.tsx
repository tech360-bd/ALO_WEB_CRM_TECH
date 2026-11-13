'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BookmarkPlus, GitCompare, Send, MapPin, Clock, DollarSign, Award } from 'lucide-react';
import Link from 'next/link';
import { calculateEligibilityScore, calculateMatchScore } from '@/lib/university-course/eligibility-engine';

export default function StudentCourseDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile] = useState({ nationality: 'Bangladeshi', highestQualification: 'Bachelor', gpa: 3.2, englishTest: 'IELTS', englishScore: 6.5, preferredCountry: 'United Kingdom', preferredSubject: 'Business', budgetMax: 20000 });
  const [eligibility, setEligibility] = useState<any>(null);
  const [matchScore, setMatchScore] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/courses/${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        const c = d.data || d.course;
        setCourse(c);
        const req = c?.requirements || c?.allRequirements?.[0] || {};
        const elig = calculateEligibilityScore(profile, req, c);
        setEligibility(elig);
        setMatchScore(calculateMatchScore(profile, c, elig.score));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-4xl mx-auto" /></div>;
  if (!course) return <div className="p-8 max-w-4xl mx-auto"><Card className="p-8 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-crm-warning-text mx-auto mb-2" /><p className="text-sm">Course not found.</p><Link href="/student/course-finder"><Button className="mt-4 bg-[var(--alo-brand)] text-white ">Back to Course Finder</Button></Link></Card></div>;

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-xs text-[var(--alo-text-muted)]"><Link href="/student/course-finder" className="hover:text-[var(--alo-brand)]">Course Finder</Link><span>›</span><span className="text-[var(--alo-brand)] font-bold">{course.courseTitle}</span></nav>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-3xl shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs">{course.studyLevel}</Badge>
                <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-xs">{course.subjectArea}</Badge>
                {eligibility && <Badge className={`${eligibility.label === 'Eligible' ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border' : 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border'} text-xs`}>{eligibility.label} — {eligibility.score}%</Badge>}
                <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-xs">Match {matchScore}%</Badge>
              </div>
              <h1 className="text-3xl font-bold text-[var(--alo-text)] mb-2">{course.courseTitle}</h1>
              <p className="text-[var(--alo-body)] flex items-center gap-2 mb-4"><MapPin className="w-4 h-4" />{course.university?.name} • {course.country}, {course.city} • Campus: {course.campus}</p>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed">{course.university?.description?.substring(0, 300) || 'Course description from DB — verified data only.'}</p>
            </Card>

            {eligibility && (
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
                <h3 className="font-bold text-[var(--alo-text)] mb-3">Eligibility Score + AI Match Score + Missing Requirements/Documents</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4"><p className="text-[var(--alo-text-muted)]">Eligibility Score</p><p className="text-2xl font-bold text-[var(--alo-brand)]">{eligibility.score}% — {eligibility.label}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-2">{eligibility.reasons.join(' • ')}</p></div>
                  <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4"><p className="text-[var(--alo-text-muted)]">AI Match Score</p><p className="text-2xl font-bold text-[var(--alo-text)]">{matchScore}%</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Based on budget, country, subject, intake preference — never guarantee admission/visa</p></div>
                  <div className="bg-crm-warning-bg border-crm-warning-border rounded-xl p-4"><p className="text-crm-warning-text font-semibold">Missing Requirements</p><p className="text-crm-warning-text mt-1">{eligibility.missing.length > 0 ? eligibility.missing.join(', ') : 'All requirements met — check with counselor'}</p></div>
                  <div className="bg-[var(--alo-brand-pale)] border-[var(--alo-border)] rounded-xl p-4"><p className="text-[var(--alo-brand)] font-semibold">Scholarship Match + Profile Match Reasons + Visa Readiness Warning</p><p className="text-[var(--alo-body)] mt-1">Scholarship: {course.scholarships?.length ? `${course.scholarships.length} scholarships — check eligibility` : 'No verified scholarship listed for this course'} • Visa readiness: Check financial evidence, study gap explanation — human review required</p></div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold mb-3">Tuition & Fees, Intakes, Academic & English Requirements — Verified Only</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {(course.intakes || []).map((i:any, idx:number)=><div key={idx} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="font-bold">{i.intakeMonth} {i.intakeYear} — Deadline: {i.applicationDeadline || 'Rolling'}</p><p>Tuition: {i.tuitionCurrency} {i.yearlyTuition} • Deposit: {i.depositAmount} • App Fee: {i.appFeeAmount}</p></div>)}
                {(!course.intakes || course.intakes.length===0) && <p className="text-[var(--alo-text-muted)] col-span-2">Tuition information is currently being verified. Fee information requires counselor verification.</p>}
              </div>
              <p className="text-xs text-[var(--alo-text-muted)] mt-3">Academic: {course.requirements?.academicReq || 'Requirement information is currently being verified. Please check with an ALO Education counselor.'} • English: IELTS {course.requirements?.ieltsOverall || 'Check'} overall — English requirement information is currently being verified if missing.</p>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold mb-3">Actions — Save/Compare/Apply/Ask Counselor</h3><div className="space-y-2"><Button className="w-full bg-[var(--alo-brand)] text-white h-12 font-bold"><BookmarkPlus className="w-4 h-4 mr-2" />Save Course</Button><Link href="/student/compare" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] "><GitCompare className="w-4 h-4 mr-2" />Compare</Button></Link><Link href={`/student/apply/${course.courseId}`} className="block"><Button className="w-full bg-[var(--alo-cta)] text-white h-12 font-bold"><Send className="w-4 h-4 mr-2" />Apply — Creates Draft</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] ">Ask Counselor</Button></Link></div><p className="text-[11px] text-[var(--alo-text-muted)] mt-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">Commission hidden — student cannot see commission, partner commission, internal staff notes, internal university agreement, other student data — blocked at backend.</p></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
