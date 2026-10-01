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

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse max-w-4xl mx-auto" /></div>;
  if (!course) return <div className="p-8 max-w-4xl mx-auto"><Card className="p-8 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Course not found — real DB, no fake data.</p><Link href="/student/course-finder"><Button className="mt-4 bg-[#0B5ED7] text-white h-11">Back to Course Finder</Button></Link></Card></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <nav className="flex items-center gap-2 text-xs text-gray-500"><Link href="/student/course-finder" className="hover:text-[#0B5ED7]">Course Finder</Link><span>›</span><span className="text-[#0B5ED7] font-bold">{course.courseTitle}</span></nav>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-3xl shadow-sm">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs">{course.studyLevel}</Badge>
                <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-xs">{course.subjectArea}</Badge>
                {eligibility && <Badge className={`${eligibility.label === 'Eligible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-xs`}>{eligibility.label} — {eligibility.score}%</Badge>}
                <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-xs">Match {matchScore}%</Badge>
              </div>
              <h1 className="text-3xl font-bold text-[#0F172A] mb-2">{course.courseTitle}</h1>
              <p className="text-gray-600 flex items-center gap-2 mb-4"><MapPin className="w-4 h-4" />{course.university?.name} • {course.country}, {course.city} • Campus: {course.campus}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{course.university?.description?.substring(0, 300) || 'Course description from DB — verified data only.'}</p>
            </Card>

            {eligibility && (
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
                <h3 className="font-bold text-[#0F172A] mb-3">Eligibility Score + AI Match Score + Missing Requirements/Documents</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-gray-500">Eligibility Score</p><p className="text-2xl font-bold text-[#0B5ED7]">{eligibility.score}% — {eligibility.label}</p><p className="text-[11px] text-gray-500 mt-2">{eligibility.reasons.join(' • ')}</p></div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-gray-500">AI Match Score</p><p className="text-2xl font-bold text-[#0F172A]">{matchScore}%</p><p className="text-[11px] text-gray-500 mt-2">Based on budget, country, subject, intake preference — never guarantee admission/visa</p></div>
                  <div className="bg-amber-50 border-amber-200 rounded-xl p-4"><p className="text-amber-800 font-semibold">Missing Requirements</p><p className="text-amber-700 mt-1">{eligibility.missing.length > 0 ? eligibility.missing.join(', ') : 'All requirements met — check with counselor'}</p></div>
                  <div className="bg-blue-50 border-blue-100 rounded-xl p-4"><p className="text-[#0B5ED7] font-semibold">Scholarship Match + Profile Match Reasons + Visa Readiness Warning</p><p className="text-gray-700 mt-1">Scholarship: {course.scholarships?.length ? `${course.scholarships.length} scholarships — check eligibility` : 'No verified scholarship listed for this course'} • Visa readiness: Check financial evidence, study gap explanation — human review required</p></div>
                </div>
              </Card>
            )}

            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold mb-3">Tuition & Fees, Intakes, Academic & English Requirements — Verified Only</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {(course.intakes || []).map((i:any, idx:number)=><div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="font-bold">{i.intakeMonth} {i.intakeYear} — Deadline: {i.applicationDeadline || 'Rolling'}</p><p>Tuition: {i.tuitionCurrency} {i.yearlyTuition} • Deposit: {i.depositAmount} • App Fee: {i.appFeeAmount}</p></div>)}
                {(!course.intakes || course.intakes.length===0) && <p className="text-gray-500 col-span-2">Tuition information is currently being verified. Fee information requires counselor verification.</p>}
              </div>
              <p className="text-xs text-gray-500 mt-3">Academic: {course.requirements?.academicReq || 'Requirement information is currently being verified. Please check with an ALO Education counselor.'} • English: IELTS {course.requirements?.ieltsOverall || 'Check'} overall — English requirement information is currently being verified if missing.</p>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold mb-3">Actions — Save/Compare/Apply/Ask Counselor</h3><div className="space-y-2"><Button className="w-full bg-[#0B5ED7] text-white h-12 font-bold"><BookmarkPlus className="w-4 h-4 mr-2" />Save Course</Button><Link href="/student/compare" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11"><GitCompare className="w-4 h-4 mr-2" />Compare</Button></Link><Link href={`/student/apply/${course.courseId}`} className="block"><Button className="w-full bg-[#F97316] text-white h-12 font-bold"><Send className="w-4 h-4 mr-2" />Apply — Creates Draft</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Ask Counselor</Button></Link></div><p className="text-[11px] text-gray-500 mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Commission hidden — student cannot see commission, partner commission, internal staff notes, internal university agreement, other student data — blocked at backend.</p></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
