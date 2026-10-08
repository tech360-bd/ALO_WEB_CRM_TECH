'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, GraduationCap, Award, Clock, FileText, Shield, BookOpen, DollarSign, Calendar, CheckCircle2, AlertTriangle, ArrowRight, Briefcase, Users } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import FaqAccordion from './FaqAccordion';
import TestPreparationMiniCard from './TestPreparationMiniCard';

interface Props {
  slug: string;
}

export default function CourseDetailHub({ slug }: Props) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${encodeURIComponent(slug)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed ${r.status}`);
        return r.json();
      })
      .then(d => setCourse(d.data || d.course))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !course) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm font-semibold">A published, verified course record is not currently available.</p><p className="text-xs text-gray-500 mt-2">No course facts are shown until an authorized source-linked record passes review.</p><Link href="/course-finder"><Button className="mt-4 bg-[#2563EB] text-white h-11">Browse Courses</Button></Link></Card></div>;

  const uni = course.university || {};
  const intakes = course.intakes || course.intakeFees || [];
  const req = course.requirements || course.allRequirements?.[0] || {};
  const scholarships = course.scholarships || course.scholarshipRecords || [];
  const similar = course.similarCourses || [];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#2563EB]">Home</Link><span>›</span><Link href="/course-finder" className="hover:text-[#2563EB]">Course Finder</Link>{uni.slug && <><span>›</span><Link href={`/universities/${uni.slug}`} className="hover:text-[#2563EB]">{uni.name || 'University'}</Link></>}<span>›</span><span className="text-[#2563EB] font-bold">{course.courseTitle}</span>
        </nav>

        {/* Header */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20 text-xs">{course.studyLevel || 'Study level not recorded'}</Badge>
            {course.subjectArea && <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] text-xs">{course.subjectArea}</Badge>}
            {course.verificationStatus && <Badge className={`${course.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{course.verificationStatus} {course.lastVerifiedAt ? `• ${new Date(course.lastVerifiedAt).toLocaleDateString()}` : ''}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A] tracking-tight mb-2">{course.courseTitle}</h1>
          <p className="text-lg text-gray-600 flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-[#2563EB]" />{uni.name || course.universityName || 'University'} • {course.city || uni.city || ''}, {course.country || uni.country || ''}</p>
          <p className="text-sm text-gray-500 mb-6">{course.qualification || 'Qualification not recorded'} • {course.durationMonths ? `${Math.round(course.durationMonths/12*10)/10} years` : 'Duration not recorded'} • {course.deliveryMode || 'Study mode not recorded'} • Campus: {course.campus || uni.campusName || 'Not recorded'}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Apply Now</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Book Free Consultation</Button></Link>
            <Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Save Course</Button>
            <Link href="/compare"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Compare</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Ask Counselor</Button></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-[#E2E8F0] text-xs">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Tuition</p><p className="font-bold">{course.tuitionFee ? `${course.currency || 'Currency not recorded'} ${course.tuitionFee}` : 'Not recorded'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Deposit</p><p className="font-bold">{course.depositAmount ? `${course.depositCurrency || 'Currency not recorded'} ${course.depositAmount}` : 'Not recorded'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Application fee</p><p className="font-bold">{course.appFeeAmount ? `${course.appFeeCurrency || 'Currency not recorded'} ${course.appFeeAmount}` : 'Not recorded'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Duration</p><p className="font-bold">{course.durationMonths ? `${course.durationMonths} months` : 'Not recorded'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">IELTS</p><p className="font-bold text-[#2563EB]">{req.ieltsOverall > 0 ? `${req.ieltsOverall}${req.ieltsMinBand > 0 ? ` (minimum band ${req.ieltsMinBand})` : ''}` : 'Not recorded'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Recorded intakes</p><p className="font-bold">{intakes.length > 0 ? intakes.map((i:any)=> `${i.intakeMonth} ${i.intakeYear}`).join(', ') : 'Not recorded'}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">Course Overview</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{course.description || course.overview || 'No course overview is recorded for this page.'}</p>
              {course.subjectArea && <p className="mt-3 text-xs text-slate-600">Subject area recorded: {course.subjectArea}{course.disciplineArea ? ` · ${course.disciplineArea}` : ''}</p>}
              <p className="text-xs text-gray-500 mt-3">Official Course URL: {course.officialUrl ? <a href={course.officialUrl} target="_blank" className="text-[#2563EB] underline break-all">{course.officialUrl}</a> : 'Information not currently verified. Please check with an ALO Education counselor.'}</p>
            </Card>

            {/* University Overview */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-[#2563EB]" />University Overview</h3><p className="text-sm text-gray-700">{[uni.name, uni.city, uni.country].filter(Boolean).join(' · ') || 'University details are not recorded on this course page.'}</p><p className="mt-2 text-sm text-gray-600">{uni.description ? uni.description.substring(0, 300) : 'University overview not recorded.'}</p>{uni.slug && <Link href={`/universities/${uni.slug}`} className="text-xs text-[#2563EB] underline mt-2 inline-block">View University Hub →</Link>}</Card>

            {/* Academic Requirements */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#2563EB]" />Recorded academic requirements</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Academic requirement</p><p className="font-semibold mt-1">{req.academicReq || 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Minimum score / grading system</p><p className="font-semibold mt-1">{req.minScore || req.gradingSystem || 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Work experience</p><p className="font-semibold mt-1">{req.workExperience || 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Portfolio / interview</p><p className="font-semibold mt-1">{req.verificationStatus?.toUpperCase() === 'VERIFIED' ? `Portfolio: ${req.portfolioRequired ? 'Required' : 'Not required in the verified record'} · Interview: ${req.interviewRequired ? 'Required' : 'Not required in the verified record'}` : 'Research required — no verified requirement record'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Prerequisite subjects</p><p className="font-semibold mt-1">{req.prerequisiteSubjects || 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Country-specific requirement</p><p className="font-semibold mt-1">{req.countrySpecificRequirement || 'Not recorded'}</p></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">Requirement source: {req.officialRequirementUrl ? <a href={req.officialRequirementUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline break-all">{req.officialRequirementUrl}</a> : 'Not recorded'} · Status: {req.verificationStatus || 'RESEARCH_REQUIRED'} · Last checked: {req.lastCheckedAt || 'Not recorded'}</p>
            </Card>

            {/* English Requirements */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#2563EB]" />Recorded English requirements</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3"><p className="text-gray-500">IELTS</p><p className="font-bold text-[#2563EB] mt-1">Overall: {req.ieltsOverall > 0 ? req.ieltsOverall : 'Not recorded'} · Minimum band: {req.ieltsMinBand > 0 ? req.ieltsMinBand : 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">PTE Academic</p><p className="font-semibold mt-1">Overall: {req.pteOverall > 0 ? req.pteOverall : 'Not recorded'} · Minimum: {req.pteMinBand > 0 ? req.pteMinBand : 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">TOEFL iBT</p><p className="font-semibold mt-1">{req.toeflOverall > 0 ? `${req.toeflOverall} overall` : 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Duolingo (DET)</p><p className="font-semibold mt-1">{req.detOverall > 0 ? req.detOverall : 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">English test accepted</p><p className="font-semibold mt-1">{req.englishTest || 'Not recorded'}</p></div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500">Medium of instruction</p><p className="font-semibold mt-1">{req.moiAccepted ? 'Accepted in this verified record' : 'Not recorded'}</p></div>
              </div>
              <p className="text-[11px] text-gray-500 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2">Only recorded course-level values are shown. Missing test thresholds are not inferred; check the linked official source before applying.</p>
            </Card>

            {/* Tuition, Application Fee, Deposit, Scholarship, Intakes, Deadline */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#2563EB]" />Tuition, Fees, Scholarship, Intakes & Deadline — Verified Only</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {intakes.map((fee:any, i:number)=>(
                  <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">
                    <p className="font-bold text-[#0F172A]">{fee.intakeMonth} {fee.intakeYear} — {fee.intakeName || ''}</p>
                    <p className="mt-1">Tuition: {fee.yearlyTuition > 0 ? `${fee.tuitionCurrency || 'Currency not recorded'} ${fee.yearlyTuition}${fee.tuitionPeriod ? ` (${fee.tuitionPeriod})` : ''}` : 'Not recorded'}</p>
                    <p>Total tuition: {fee.totalTuition > 0 ? `${fee.tuitionCurrency || 'Currency not recorded'} ${fee.totalTuition}` : 'Not recorded'}</p>
                    <p>Deposit: {fee.depositAmount > 0 ? `${fee.depositCurrency || 'Currency not recorded'} ${fee.depositAmount}` : 'Not recorded'}</p>
                    <p>Application fee: {fee.appFeeAmount > 0 ? `${fee.appFeeCurrency || 'Currency not recorded'} ${fee.appFeeAmount}` : 'Not recorded'}</p>
                    <p>Deadline: {fee.applicationDeadline || 'Not recorded'}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Source: {fee.feeSourceUrl || fee.intakeSourceUrl ? <a href={fee.feeSourceUrl || fee.intakeSourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline">Official record</a> : 'Not recorded'} • {fee.verificationStatus || 'RESEARCH_REQUIRED'}</p>
                  </div>
                ))}
                {intakes.length===0 && <p className="text-sm text-gray-500 col-span-3">Information not currently verified. Please check with an ALO Education counselor for tuition, fees, intakes, deadlines.</p>}
              </div>
              {scholarships.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-[#F97316]" />Scholarships for this Course</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {scholarships.map((s:any)=>(
                      <div key={s.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 text-xs"><p className="font-semibold">{s.scholarshipName || s.name || 'Scholarship name not recorded'}</p><p className="text-gray-600">{s.scholarshipAmount > 0 ? `${s.scholarshipCurrency || 'Currency not recorded'} ${s.scholarshipAmount}` : 'Amount not recorded'}{s.coverageType || s.fundingType ? ` · ${s.coverageType || s.fundingType}` : ''}</p>{s.officialScholarshipUrl && <a href={s.officialScholarshipUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[10px] text-[#2563EB] underline">Official source</a>}</div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Career Outcomes, Internship, Placement, Co-op */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#2563EB]" />Career Outcomes, Internship, Placement, Co-op</h3>
              <p className="text-sm text-gray-700">Career outcomes and placement details: {course.careerOutcomes || 'Not recorded'}.</p>
              <p className="text-xs text-gray-500 mt-2">Recorded options — work placement: {course.workPlacementAvailable ? 'Available' : 'Not recorded'} · co-op: {course.coOpAvailable ? 'Available' : 'Not recorded'} · sandwich year: {course.sandwichYearOption ? 'Available' : 'Not recorded'} · online study: {course.onlineOption ? 'Available' : 'Not recorded'}.</p>
              <p className="text-xs text-gray-500 mt-2">Verify options against the linked official course source; an empty field is not treated as unavailable.</p>
            </Card>

            {/* Application Guidance (not an institution checklist) */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[#0F172A] mb-3">Application guidance</h3>
              <p className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">The checklist below is general planning guidance, not a published requirement for this course. Confirm all steps and documents with the institution’s official admissions source.</p>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div><h4 className="font-semibold text-xs mb-2">Suggested planning sequence</h4><ol className="list-decimal list-inside space-y-1 text-xs text-gray-700"><li>Review the official course and entry-requirement source linked above.</li><li>Ask ALO to review your profile against the recorded criteria.</li><li>Confirm current documents, dates and submission channel with the institution.</li><li>Submit through the institution’s stated application route.</li></ol></div>
                <div><h4 className="font-semibold text-xs mb-2">Documents</h4><p className="text-xs leading-5 text-gray-700">A course-specific required-document list is not recorded here. Do not rely on a generic checklist; ask the institution for its current list.</p></div>
              </div>
              <p className="text-xs text-gray-500 mt-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Visa rules are country- and route-specific and must be checked with the relevant government source. ALO does not guarantee visa outcomes. Course record source: {course.sourceUrl ? <a href={course.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline break-all">{course.sourceUrl}</a> : 'Not recorded'} · Last verified: {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toLocaleDateString() : 'Not recorded'} · Status: {course.verificationStatus || 'RESEARCH_REQUIRED'}</p>
            </Card>

            {/* Related Engine */}
            <RelatedContentEngine sourceType="course" sourceId={course.courseId || course.id} sourceSlug={course.slug || slug} country={course.country || uni.country} universityId={course.universityId || uni.universityId} subjectArea={course.subjectArea} studyLevel={course.studyLevel} title={`Similar Courses & Other Courses at ${uni.name || 'University'}`} />
            <RelatedContentEngine sourceType="course" sourceId={course.courseId || course.id} sourceSlug={course.slug || slug} country={course.country} universityId={course.universityId} title="Related Scholarships, English Tests, Resources, FAQs, Services" />
            <FaqAccordion targetType="course" targetSlug={course.slug || slug} title={`FAQs about ${course.courseTitle}`} limit={12} />

            <Card className="p-8 bg-gradient-to-r from-[#2563EB] to-[#003d80] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Apply for {course.courseTitle}</h3>
              <p className="text-sm text-blue-100 mb-6 max-w-2xl mx-auto">Move from information → eligibility → course selection → consultation → application. Book consultation, save course, compare, ask counselor.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Apply Now</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white text-[#2563EB] hover:bg-blue-50 h-12 px-8 font-bold">Book Free Consultation</Button></Link>
                <Link href="/compare"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-8">Compare Courses</Button></Link>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Quick Actions</h3><div className="space-y-2"><Link href="/eligibility-check" className="block"><Button className="w-full bg-[#F97316] text-white h-11">Apply Now</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Book Free Consultation</Button></Link><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Save Course</Button><Link href="/compare" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Compare</Button></Link></div></Card>
            <TestPreparationMiniCard contextTitle={`English for ${course.courseTitle}`} recommendedTest={req.englishTest || (req.ieltsOverall > 0 ? `IELTS ${req.ieltsOverall}` : 'Test requirement not recorded')} targetScore={req.ieltsMinBand > 0 ? `Minimum band ${req.ieltsMinBand}` : 'Verify the official requirement'} />
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Sources & Verification</h3><div className="space-y-2 text-xs"><p><strong>Official URL:</strong> {course.officialUrl ? <a href={course.officialUrl} target="_blank" className="text-[#2563EB] underline break-all">{course.officialUrl}</a> : 'Information not currently verified.'}</p><p><strong>Application URL:</strong> {course.officialApplicationUrl ? <a href={course.officialApplicationUrl} target="_blank" className="text-[#2563EB] underline break-all">{course.officialApplicationUrl}</a> : 'Not verified'}</p><p><strong>Source URL:</strong> {course.sourceUrl ? <a href={course.sourceUrl} target="_blank" className="text-[#2563EB] underline break-all">{course.sourceUrl}</a> : 'Not verified'}</p><p><strong>Verification:</strong> <Badge className={`${course.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{course.verificationStatus || 'NEEDS_REVIEW'}</Badge></p><p><strong>Last Verified:</strong> {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for Building2 icon
function Building2(props: any) {
  return <GraduationCap {...props} />;
}
