'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, GraduationCap, Award, Clock, FileText, Shield, BookOpen, DollarSign, Calendar, CheckCircle2, AlertTriangle, ArrowRight, Briefcase, Users } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import EnquiryForm from './EnquiryForm';
import FaqAccordion from './FaqAccordion';
import TestPreparationMiniCard from './TestPreparationMiniCard';

interface Props {
  slug: string;
}

export default function CourseDetailHub({ slug }: Props) {
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status: number | null; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/courses/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async r => {
        const body = await r.json().catch(() => null);
        if (!r.ok) {
          const err = new Error(body?.error || `Request failed (${r.status})`) as Error & { status?: number };
          err.status = r.status;
          throw err;
        }
        return body;
      })
      .then(d => setCourse(d.data || d.course))
      .catch((e: Error & { status?: number }) => {
        if (e.name === 'AbortError') return;
        setCourse(null);
        setError({ status: e.status ?? null, message: e.message });
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug, attempt]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error && error.status !== 404) return <div className="p-8 max-w-7xl mx-auto" role="alert"><Card className="p-8 bg-crm-danger-bg border border-crm-danger-border rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-crm-danger-text mx-auto mb-2" /><p className="text-sm font-semibold text-crm-danger-text">Course information could not be loaded right now.</p><p className="text-xs text-crm-danger-text mt-2">Please try again. If this continues, check with an ALO Education counselor.</p><div className="flex justify-center gap-3 mt-4"><Button onClick={() => setAttempt(a => a + 1)} className="bg-[var(--alo-brand)] text-white h-12">Try again</Button><Link href="/course-finder"><Button variant="outline" className="h-12 border-[var(--alo-border)]">Browse Courses</Button></Link></div></Card></div>;
  if (!course) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-crm-warning-text mx-auto mb-2" /><p className="text-sm font-semibold">A published, verified course record is not currently available.</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">No course facts are shown until an authorized source-linked record passes review.</p><Link href="/course-finder"><Button className="mt-4 bg-[var(--alo-brand)] text-white h-12">Browse Courses</Button></Link></Card></div>;

  const uni = course.university || {};
  const intakes = course.intakes || course.intakeFees || [];
  const req = course.requirements || course.allRequirements?.[0] || {};
  const scholarships = course.scholarships || course.scholarshipRecords || [];
  const similar = course.similarCourses || [];

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)] font-medium">
          <Link href="/" className="hover:text-[var(--alo-brand)]">Home</Link><span>›</span><Link href="/course-finder" className="hover:text-[var(--alo-brand)]">Course Finder</Link>{(uni.slug || uni.universityId) && <><span>›</span><Link href={`/universities/${encodeURIComponent(uni.slug || uni.universityId)}`} className="hover:text-[var(--alo-brand)]">{uni.name || 'University'}</Link></>}<span>›</span><span className="text-[var(--alo-brand)] font-bold">{course.courseTitle}</span>
        </nav>

        {/* Header */}
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs">{course.studyLevel || 'Study level not recorded'}</Badge>
            {course.subjectArea && <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)] text-xs">{course.subjectArea}</Badge>}
            {course.verificationStatus && <Badge variant={course.verificationStatus === 'VERIFIED' ? 'success' : 'warning'} className="text-[11px]">{course.verificationStatus} {course.lastVerifiedAt ? `• ${new Date(course.lastVerifiedAt).toLocaleDateString()}` : ''}</Badge>}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--alo-text)] tracking-tight mb-2">{course.courseTitle}</h1>
          <p className="text-lg text-[var(--alo-body)] flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-[var(--alo-brand)]" />{uni.name || course.universityName || 'University'} • {course.city || uni.city || ''}, {course.country || uni.country || ''}</p>
          <p className="text-sm text-[var(--alo-text-muted)] mb-6">{course.qualification || 'Qualification not recorded'} • {course.durationMonths ? `${Math.round(course.durationMonths/12*10)/10} years` : 'Duration not recorded'} • {course.deliveryMode || 'Study mode not recorded'} • Campus: {course.campus || uni.campusName || 'Not recorded'}</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-start gap-1"><Link href={`/apply/${encodeURIComponent(course.slug || course.courseId || slug)}`}><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-6 font-bold">Apply Now</Button></Link><span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Login / Register required</span></div>
            <Link href="/book-consultation"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Request Counseling</Button></Link>
            <Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Save Course</Button>
            <Link href="/compare"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Compare</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Ask Counselor</Button></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-[var(--alo-border)] text-xs">
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Tuition</p><p className="font-bold">{course.tuitionFee ? `${course.currency || 'Currency not recorded'} ${course.tuitionFee}` : 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Deposit</p><p className="font-bold">{course.depositAmount ? `${course.depositCurrency || 'Currency not recorded'} ${course.depositAmount}` : 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Application fee</p><p className="font-bold">{course.appFeeAmount ? `${course.appFeeCurrency || 'Currency not recorded'} ${course.appFeeAmount}` : 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Duration</p><p className="font-bold">{course.durationMonths ? `${course.durationMonths} months` : 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">IELTS</p><p className="font-bold text-[var(--alo-brand)]">{req.ieltsOverall > 0 ? `${req.ieltsOverall}${req.ieltsMinBand > 0 ? ` (minimum band ${req.ieltsMinBand})` : ''}` : 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Recorded intakes</p><p className="font-bold">{intakes.length > 0 ? intakes.map((i:any)=> `${i.intakeMonth} ${i.intakeYear}`).join(', ') : 'Not recorded'}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-4">Course Overview</h2>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed">{course.description || course.overview || 'No course overview is recorded for this page.'}</p>
              {course.subjectArea && <p className="mt-3 text-xs text-[var(--alo-body)]">Subject area recorded: {course.subjectArea}{course.disciplineArea ? ` · ${course.disciplineArea}` : ''}</p>}
              <p className="text-xs text-[var(--alo-text-muted)] mt-3">Official Course URL: {course.officialUrl ? <a href={course.officialUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{course.officialUrl}</a> : 'Information not currently verified. Please check with an ALO Education counselor.'}</p>
            </Card>

            {/* University Overview */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><Building2 className="w-5 h-5 text-[var(--alo-brand)]" />University Overview</h3><p className="text-sm text-[var(--alo-body)]">{[uni.name, uni.city, uni.country].filter(Boolean).join(' · ') || 'University details are not recorded on this course page.'}</p><p className="mt-2 text-sm text-[var(--alo-body)]">{uni.description ? uni.description.substring(0, 300) : 'University overview not recorded.'}</p>{(uni.slug || uni.universityId) && <Link href={`/universities/${encodeURIComponent(uni.slug || uni.universityId)}`} className="text-xs text-[var(--alo-brand)] underline mt-2 inline-block">View University Hub →</Link>}</Card>

            {/* Entry Requirements — Bachelor / Master (brand brief). The
                recorded requirement belongs to this course's own level; the
                other level is labelled honestly instead of being invented. */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--alo-brand)]" />Entry Requirements (Bachelor / Master)</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs mb-4">
                <div className="bg-[var(--alo-brand-pale)] border border-[var(--alo-border)] rounded-xl p-3">
                  <p className="text-[var(--alo-text-muted)] font-semibold">Bachelor (Undergraduate) entry requirement</p>
                  <p className="font-semibold mt-1">{/postgrad|master|mres|phd|doctor/i.test(course.studyLevel || '') ? 'Not applicable — this is a postgraduate course. See undergraduate courses at this university in the Course Finder.' : (req.academicReq || 'Not recorded')}</p>
                </div>
                <div className="bg-[var(--alo-cta-soft)] border border-[var(--alo-cta)]/25 rounded-xl p-3">
                  <p className="text-[var(--alo-text-muted)] font-semibold">Master (Postgraduate) entry requirement</p>
                  <p className="font-semibold mt-1">{/undergrad|bachelor|foundation/i.test(course.studyLevel || '') ? 'Not applicable — this is an undergraduate course. See postgraduate courses at this university in the Course Finder.' : (req.academicReq || 'Not recorded')}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Academic requirement (this course)</p><p className="font-semibold mt-1">{req.academicReq || 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Minimum score / grading system</p><p className="font-semibold mt-1">{req.minScore || req.gradingSystem || 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Work experience</p><p className="font-semibold mt-1">{req.workExperience || 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Portfolio / interview</p><p className="font-semibold mt-1">{req.verificationStatus?.toUpperCase() === 'VERIFIED' ? `Portfolio: ${req.portfolioRequired ? 'Required' : 'Not required in the verified record'} · Interview: ${req.interviewRequired ? 'Required' : 'Not required in the verified record'}` : 'Research required — no verified requirement record'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Prerequisite subjects</p><p className="font-semibold mt-1">{req.prerequisiteSubjects || 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Country-specific requirement</p><p className="font-semibold mt-1">{req.countrySpecificRequirement || 'Not recorded'}</p></div>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2">Requirement source: {req.officialRequirementUrl ? <a href={req.officialRequirementUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline break-all">{req.officialRequirementUrl}</a> : 'Not recorded'} · Status: {req.verificationStatus || 'RESEARCH_REQUIRED'} · Last checked: {req.lastCheckedAt || 'Not recorded'}</p>
            </Card>

            {/* English Requirements */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--alo-brand)]" />Recorded English requirements</h3>
              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-[var(--alo-brand-pale)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">IELTS</p><p className="font-bold text-[var(--alo-brand)] mt-1">Overall: {req.ieltsOverall > 0 ? req.ieltsOverall : 'Not recorded'} · Minimum band: {req.ieltsMinBand > 0 ? req.ieltsMinBand : 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">PTE Academic</p><p className="font-semibold mt-1">Overall: {req.pteOverall > 0 ? req.pteOverall : 'Not recorded'} · Minimum: {req.pteMinBand > 0 ? req.pteMinBand : 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">TOEFL iBT</p><p className="font-semibold mt-1">{req.toeflOverall > 0 ? `${req.toeflOverall} overall` : 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Duolingo (DET)</p><p className="font-semibold mt-1">{req.detOverall > 0 ? req.detOverall : 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">English test accepted</p><p className="font-semibold mt-1">{req.englishTest || 'Not recorded'}</p></div>
                <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)]">Medium of instruction</p><p className="font-semibold mt-1">{req.moiAccepted ? 'Accepted in this verified record' : 'Not recorded'}</p></div>
              </div>
              <p className="text-[11px] text-crm-warning-text mt-3 bg-crm-warning-bg border border-crm-warning-border rounded-xl p-2">Only recorded course-level values are shown. Missing test thresholds are not inferred; check the linked official source before applying.</p>
            </Card>

            {/* Tuition, Application Fee, Deposit, Scholarship, Intakes, Deadline */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-[var(--alo-brand)]" />Tuition, Fees, Scholarship, Intakes & Deadline — Verified Only</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {intakes.map((fee:any, i:number)=>(
                  <div key={i} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">
                    <p className="font-bold text-[var(--alo-text)]">{fee.intakeMonth} {fee.intakeYear} — {fee.intakeName || ''}</p>
                    <p className="mt-1">Tuition: {fee.yearlyTuition > 0 ? `${fee.tuitionCurrency || 'Currency not recorded'} ${fee.yearlyTuition}${fee.tuitionPeriod ? ` (${fee.tuitionPeriod})` : ''}` : 'Not recorded'}</p>
                    <p>Total tuition: {fee.totalTuition > 0 ? `${fee.tuitionCurrency || 'Currency not recorded'} ${fee.totalTuition}` : 'Not recorded'}</p>
                    <p>Deposit: {fee.depositAmount > 0 ? `${fee.depositCurrency || 'Currency not recorded'} ${fee.depositAmount}` : 'Not recorded'}</p>
                    <p>Application fee: {fee.appFeeAmount > 0 ? `${fee.appFeeCurrency || 'Currency not recorded'} ${fee.appFeeAmount}` : 'Not recorded'}</p>
                    <p>Deadline: {fee.applicationDeadline || 'Not recorded'}</p>
                    <p className="text-[11px] text-[var(--alo-text-muted)] mt-1">Source: {fee.feeSourceUrl || fee.intakeSourceUrl ? <a href={fee.feeSourceUrl || fee.intakeSourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">Official record</a> : 'Not recorded'} • {fee.verificationStatus || 'RESEARCH_REQUIRED'}</p>
                  </div>
                ))}
                {intakes.length===0 && <p className="text-sm text-[var(--alo-text-muted)] col-span-3">Information not currently verified. Please check with an ALO Education counselor for tuition, fees, intakes, deadlines.</p>}
              </div>
              {scholarships.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--alo-cta)]" />Scholarships for this Course</h4>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {scholarships.map((s:any)=>(
                      <div key={s.id} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 text-xs"><p className="font-semibold">{s.scholarshipName || s.name || 'Scholarship name not recorded'}</p><p className="text-[var(--alo-body)]">{s.scholarshipAmount > 0 ? `${s.scholarshipCurrency || 'Currency not recorded'} ${s.scholarshipAmount}` : 'Amount not recorded'}{s.coverageType || s.fundingType ? ` · ${s.coverageType || s.fundingType}` : ''}</p>{s.officialScholarshipUrl && <a href={s.officialScholarshipUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[11px] text-[var(--alo-brand)] underline">Official source</a>}</div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Career Outcomes, Internship, Placement, Co-op */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><Briefcase className="w-5 h-5 text-[var(--alo-brand)]" />Career Outcomes, Internship, Placement, Co-op</h3>
              <p className="text-sm text-[var(--alo-body)]">Career outcomes and placement details: {course.careerOutcomes || 'Not recorded'}.</p>
              <p className="text-xs text-[var(--alo-text-muted)] mt-2">Recorded options — work placement: {course.workPlacementAvailable ? 'Available' : 'Not recorded'} · co-op: {course.coOpAvailable ? 'Available' : 'Not recorded'} · sandwich year: {course.sandwichYearOption ? 'Available' : 'Not recorded'} · online study: {course.onlineOption ? 'Available' : 'Not recorded'}.</p>
              <p className="text-xs text-[var(--alo-text-muted)] mt-2">Verify options against the linked official course source; an empty field is not treated as unavailable.</p>
            </Card>

            {/* Application Guidance (not an institution checklist) */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h3 className="font-bold text-[var(--alo-text)] mb-3">Application guidance</h3>
              <p className="mb-4 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-3 text-xs leading-5 text-[var(--alo-brand-deep)]">The checklist below is general planning guidance, not a published requirement for this course. Confirm all steps and documents with the institution’s official admissions source.</p>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div><h4 className="font-semibold text-xs mb-2">Suggested planning sequence</h4><ol className="list-decimal list-inside space-y-1 text-xs text-[var(--alo-body)]"><li>Review the official course and entry-requirement source linked above.</li><li>Ask ALO to review your profile against the recorded criteria.</li><li>Confirm current documents, dates and submission channel with the institution.</li><li>Submit through the institution’s stated application route.</li></ol></div>
                <div><h4 className="font-semibold text-xs mb-2">Documents</h4><p className="text-xs leading-5 text-[var(--alo-body)]">A course-specific required-document list is not recorded here. Do not rely on a generic checklist; ask the institution for its current list.</p></div>
              </div>
              <p className="text-xs text-[var(--alo-text-muted)] mt-4 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">Visa rules are country- and route-specific and must be checked with the relevant government source. ALO does not guarantee visa outcomes. Course record source: {course.sourceUrl ? <a href={course.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline break-all">{course.sourceUrl}</a> : 'Not recorded'} · Last verified: {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toLocaleDateString() : 'Not recorded'} · Status: {course.verificationStatus || 'RESEARCH_REQUIRED'}</p>
            </Card>

            {/* Related Engine */}
            <RelatedContentEngine sourceType="course" sourceId={course.courseId || course.id} sourceSlug={course.slug || slug} country={course.country || uni.country} universityId={course.universityId || uni.universityId} subjectArea={course.subjectArea} studyLevel={course.studyLevel} title={`Similar Courses & Other Courses at ${uni.name || 'University'}`} />
            <RelatedContentEngine sourceType="course" sourceId={course.courseId || course.id} sourceSlug={course.slug || slug} country={course.country} universityId={course.universityId} title="Related Scholarships, English Tests, Resources, FAQs, Services" />
            <FaqAccordion targetType="course" targetSlug={course.slug || slug} title={`FAQs about ${course.courseTitle}`} limit={12} />

            {/* Course enquiry (spec 3.2) — the same fixed form structure used on
                university and scholarship pages, pre-filled with this course. */}
            <EnquiryForm
              context={{
                type: 'course',
                subject: course.courseTitle,
                institution: uni.name || course.universityName,
                country: course.country || uni.country,
                reference: course.slug || course.courseId,
              }}
            />

            <Card className="p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Apply for {course.courseTitle}</h3>
              <p className="text-sm text-[var(--alo-brand-pale)] mb-6 max-w-2xl mx-auto">Move from information → eligibility → course selection → consultation → application. Book consultation, save course, compare, ask counselor.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href={`/apply/${encodeURIComponent(course.slug || course.courseId || slug)}`}><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold">Apply Now</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)] h-12 px-8 font-bold">Request Counseling</Button></Link>
                <Link href="/compare"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-8">Compare Courses</Button></Link>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3">Quick Actions</h3><div className="space-y-2"><Link href={`/apply/${encodeURIComponent(course.slug || course.courseId || slug)}`} className="block"><Button className="w-full bg-[var(--alo-cta)] text-white h-12">Apply Now</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Request Counseling</Button></Link><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Save Course</Button><Link href="/compare" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Compare</Button></Link></div></Card>
            <TestPreparationMiniCard contextTitle={`English for ${course.courseTitle}`} recommendedTest={req.englishTest || (req.ieltsOverall > 0 ? `IELTS ${req.ieltsOverall}` : 'Test requirement not recorded')} targetScore={req.ieltsMinBand > 0 ? `Minimum band ${req.ieltsMinBand}` : 'Verify the official requirement'} />
            <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Sources & Verification</h3><div className="space-y-2 text-xs"><p><strong>Official URL:</strong> {course.officialUrl ? <a href={course.officialUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{course.officialUrl}</a> : 'Information not currently verified.'}</p><p><strong>Application URL:</strong> {course.officialApplicationUrl ? <a href={course.officialApplicationUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{course.officialApplicationUrl}</a> : 'Not verified'}</p><p><strong>Source URL:</strong> {course.sourceUrl ? <a href={course.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{course.sourceUrl}</a> : 'Not verified'}</p><p><strong>Verification:</strong> <Badge variant={course.verificationStatus === 'VERIFIED' ? 'success' : 'warning'} className="text-[11px]">{course.verificationStatus || 'NEEDS_REVIEW'}</Badge></p><p><strong>Last Verified:</strong> {course.lastVerifiedAt ? new Date(course.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'}</p></div></Card>
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
