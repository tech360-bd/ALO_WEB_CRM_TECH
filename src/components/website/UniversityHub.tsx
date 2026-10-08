'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, GraduationCap, Award, Users, Building2, Clock, FileText, Shield, BookOpen, DollarSign, Calendar, CheckCircle2, AlertTriangle, ArrowRight, Star, Briefcase, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import RelatedContentEngine from './RelatedContentEngine';
import FaqAccordion from './FaqAccordion';
import TestPreparationMiniCard from './TestPreparationMiniCard';

interface Props {
  slug: string;
}

export default function UniversityHub({ slug }: Props) {
  const [uni, setUni] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseListing, setCourseListing] = useState<any>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [coursePage, setCoursePage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/universities/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error(`Failed ${r.status}`);
        return r.json();
      })
      .then(d => setUni(d.data || d.university))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [slug]);

  useEffect(() => {
    const controller = new AbortController();
    setCourseLoading(true);
    const params = new URLSearchParams({
      intakeWindow: '2027-01:2028-01',
      coursePage: String(coursePage),
      courseLimit: '12',
    });
    fetch(`/api/universities/${encodeURIComponent(slug)}?${params.toString()}`, { signal: controller.signal })
      .then(async r => {
        const data = await r.json();
        if (!r.ok || data.success === false) throw new Error(data.error || `Failed ${r.status}`);
        return data;
      })
      .then(d => setCourseListing(d.data || d.university || null))
      .catch((e) => {
        if (e.name !== 'AbortError') setCourseListing({ error: e.message, popularCourses: [], intakeWindow: null });
      })
      .finally(() => {
        if (!controller.signal.aborted) setCourseLoading(false);
      });
    return () => controller.abort();
  }, [slug, coursePage]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !uni) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><p className="text-xs text-gray-500 mt-2">{error || 'University not found'}</p><Link href="/universities"><Button className="mt-4 bg-[#2563EB] text-white h-11">Browse Universities</Button></Link></Card></div>;

  const name = uni.name;
  const country = uni.country || 'Country not recorded';
  const city = uni.city || 'City not recorded';
  const website = uni.website || uni.officialUrl || '';
  const courses = courseListing?.popularCourses || [];
  const intakeWindow = courseListing?.intakeWindow;
  const courseTotal = intakeWindow?.totalCourses ?? 0;
  const courseTotalPages = intakeWindow?.totalPages ?? 0;
  const firstCourseNumber = courseTotal === 0 ? 0 : (coursePage - 1) * (intakeWindow?.pageSize || 12) + 1;
  const lastCourseNumber = Math.min(coursePage * (intakeWindow?.pageSize || 12), courseTotal);
  const scholarships = uni.scholarshipList || uni.scholarshipRecords || [];
  const rankings = uni.rankings || uni.rankingRecords || [];
  const tuition = uni.tuitionRange || 'Check official source';
  const ieltsMin = uni.ieltsMin || 'Check course requirements';

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-[#2563EB]">Home</Link><span>›</span><Link href="/universities" className="hover:text-[#2563EB]">Universities</Link><span>›</span><span className="text-gray-700">{country}</span><span>›</span><span className="text-[#2563EB] font-bold">{name}</span>
        </nav>

        {/* 1. University Header */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-10 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={`${uni.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-xs`}>
              {uni.verificationStatus === 'VERIFIED' ? 'Verified university record' : `Verification: ${uni.verificationStatus || 'not verified'}`}
            </Badge>
            {uni.worldRanking > 0 && <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] text-xs">World ranking recorded: #{uni.worldRanking}</Badge>}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-3">{name}</h1>
          <p className="text-lg text-gray-600 flex items-center gap-2 mb-6"><MapPin className="w-5 h-5 text-[#F97316]" />{city}, {country} {uni.founded ? `• Established ${uni.founded}` : ''}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Apply Through ALO</Button></Link>
            <Link href="#popular-courses"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">View Jan 2027–Jan 2028 Courses ({courseTotal})</Button></Link>
            <Link href="/compare"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Compare University</Button></Link>
            {website ? <a href={website} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6 flex gap-1.5"><Globe className="w-4 h-4" />Official Website</Button></a> : <Button variant="outline" disabled title="No official website URL is recorded" className="border-[#E2E8F0] h-12 px-6 flex gap-1.5"><Globe className="w-4 h-4" />Official website not recorded</Button>}
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-8 pt-6 border-t border-[#E2E8F0] text-xs">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase font-semibold">Country</p><p className="font-bold text-[#0F172A]">{country}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">City</p><p className="font-bold">{city}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Type</p><p className="font-bold">{uni.type || 'University'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">IELTS Min</p><p className="font-bold text-[#2563EB]">{ieltsMin}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Tuition</p><p className="font-bold">{tuition}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">International student count</p><p className="font-bold">{uni.intlStudents || 'Not recorded'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Scholarships</p><p className="font-bold text-emerald-600">{uni.scholarships ? 'Available' : 'Check'}</p></div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-gray-500 text-[10px] uppercase">Jan 2027–Jan 2028 courses</p><p className="font-bold">{courseLoading ? 'Loading…' : courseTotal}</p></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* 2. Overview */}
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center gap-2"><Building2 className="w-6 h-6 text-[#2563EB]" />University Overview</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{uni.description || `Information about ${name} — ${city}, ${country}. Official information should be verified via official university website. ${uni.officialUrl ? `Official URL: ${uni.officialUrl}` : ''}`}</p>
              {!uni.description && <p className="text-xs text-gray-500 mt-3 italic bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Information not currently verified. Please check with an ALO Education counselor.</p>}
              {uni.officialUrl && <p className="text-xs text-gray-500 mt-3">Official Source: <a href={uni.officialUrl} target="_blank" className="text-[#2563EB] underline">{uni.officialUrl}</a> {uni.lastVerifiedAt ? `• Last verified: ${new Date(uni.lastVerifiedAt).toLocaleDateString()}` : ''}</p>}
            </Card>

            {/* 3. Location + 4. Campus */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#F97316]" />Location</h3><p className="text-sm text-gray-700">{city}, {country}</p><p className="text-xs text-gray-500 mt-2">Campus: {uni.campusName || 'Main Campus'}</p><p className="text-xs text-gray-500">Official International Admissions URL: {uni.officialInternationalAdmissionsUrl ? <a href={uni.officialInternationalAdmissionsUrl} target="_blank" className="text-[#2563EB] underline">View</a> : 'Information not currently verified. Please check with an ALO Education counselor.'}</p></Card>
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><Home className="w-5 h-5 text-[#2563EB]" />Campus Information</h3><div className="space-y-2 text-sm">{(uni.campuses ? (typeof uni.campuses === 'string' ? (()=>{try{return JSON.parse(uni.campuses)}catch{return [uni.campusName]}})() : uni.campuses) : [uni.campusName || 'Main Campus']).map((c:any, i:number)=><div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs">{c}</div>)}<p className="text-xs text-gray-500">Official Course Search URL: {uni.officialCourseSearchUrl ? <a href={uni.officialCourseSearchUrl} target="_blank" className="text-[#2563EB] underline">View</a> : 'Information not currently verified. Please check with an ALO Education counselor.'}</p></div></Card>
            </div>

            {/* 5. Official Website + 6. International Student Info */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-[#2563EB]" />Official Website & International Student Information</h3><div className="grid sm:grid-cols-2 gap-4 text-sm"><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Official Website</p><a href={website} target="_blank" className="text-[#2563EB] font-semibold underline break-all">{website}</a></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">International Admissions</p>{uni.officialInternationalAdmissionsUrl ? <a href={uni.officialInternationalAdmissionsUrl} target="_blank" className="text-[#2563EB] underline">View Admissions Page</a> : <span className="text-xs">Information not currently verified. Please check with an ALO Education counselor.</span>}</div></div><p className="text-xs text-gray-500 mt-3">International Student Support: {uni.internationalStudentSupportSummary || 'Information not currently verified. Please check with an ALO Education counselor.'}</p></Card>

            {/* 7. Why Students Choose */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Why Students Choose {name}</h3><ul className="space-y-2 text-sm text-gray-700 list-disc list-inside"><li>Ranked institution with global recognition {rankings[0] ? `(Ranking: ${rankings[0].rankingTitle} ${rankings[0].rank} ${rankings[0].rankingYear})` : ''}</li><li>Wide range of courses across Business, Engineering, Computer Science, Health</li><li>Scholarships available for eligible international students</li><li>Post-study work rights per destination country policy</li><li>Official source verified where available</li></ul></Card>

            {/* 8. Complete intake-window course listing */}
            <Card id="popular-courses" className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2"><GraduationCap className="w-6 h-6 text-[#2563EB]" />Courses with intakes: January 2027 – January 2028</h2>
                  <p className="text-xs text-gray-600 mt-2">All matching active, published course records are paginated; no popular-course top-N limit is applied. Eligibility and intake-source status are shown per record.</p>
                </div>
                <Badge className="bg-slate-50 text-slate-700 border-slate-200">Institution code on file: {uni.universityCode?.trim() || 'Not recorded'}</Badge>
              </div>
              {intakeWindow && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950" role="status">
                  <p className="font-semibold">Code coverage is not certified by the stored text fields.</p>
                  <p className="mt-1">{intakeWindow.courseCodesRecorded} of {intakeWindow.totalCourses} listed course records have a non-empty course-code field; {intakeWindow.courseCodesMissing} have none. This is a field-presence count, not proof that every official code is present, active, or international-student applicable.</p>
                </div>
              )}
              {courseLoading && courses.length === 0 ? (
                <p className="text-sm text-gray-500" role="status">Loading approved course records and their recorded intake data…</p>
              ) : courseListing?.error ? (
                <p className="text-sm text-red-700" role="alert">Course data could not be loaded. {courseListing.error}</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-gray-600">No approved, verified course record with a matching intake was returned for this period. This may indicate a data-coverage gap; it does not establish that the university has no courses.</p>
              ) : (
                <div className={`grid sm:grid-cols-2 gap-4 ${courseLoading ? 'opacity-60' : ''}`} aria-busy={courseLoading}>
                  {courses.map((c: any) => {
                    // Keep the fee/intake record after the basic intake row so its source and verification metadata win when both models contain the same month.
                    const allIntakes = [...(c.courseIntakes || []), ...(c.intakes || [])];
                    const uniqueIntakes = Array.from(new Map(allIntakes.map((intake: any) => [`${intake.intakeYear}-${String(intake.intakeMonth).toLowerCase()}`, intake])).values());
                    const eligibility = String(c.internationalEligibility || 'not_verified').trim();
                    const eligibilityLabel = !eligibility || eligibility.toLowerCase() === 'not_verified' ? 'Not verified' : eligibility;
                    return (
                      <Card key={c.courseId || c.id} className="p-4 bg-[#F8FAFC] border-[#E2E8F0] rounded-xl h-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-white border-[#E2E8F0] text-[10px]">{c.studyLevel || 'Course level not recorded'}</Badge>
                          <Badge className={`${c.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{c.verificationStatus || 'NEEDS_REVIEW'}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm text-[#0F172A]">{c.courseTitle}</h3>
                        <p className="text-xs text-gray-600 mt-1">{c.qualification || 'Qualification not recorded'} • {c.durationMonths ? `${Math.round(c.durationMonths / 12 * 10) / 10} years` : 'Duration not recorded'}</p>
                        <dl className="grid grid-cols-1 gap-1 mt-3 text-xs">
                          <div><dt className="inline font-semibold">Course code on file:</dt><dd className="inline ml-1">{c.courseCode?.trim() || 'Not recorded'}</dd></div>
                          <div><dt className="inline font-semibold">International-student eligibility:</dt><dd className="inline ml-1">{eligibilityLabel}</dd></div>
                        </dl>
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-700">Intakes in the requested window</p>
                          {uniqueIntakes.length ? (
                            <ul className="mt-1 space-y-1 text-xs text-gray-600">
                              {uniqueIntakes.map((intake: any, index: number) => (
                                <li key={`${intake.intakeYear}-${intake.intakeMonth}-${index}`}>
                                  {intake.intakeMonth} {intake.intakeYear} — status: {intake.status || 'not recorded'}{intake.verificationStatus ? ` • verification: ${intake.verificationStatus}` : ' • intake verification not recorded'}
                                  {intake.intakeSourceUrl && <a href={intake.intakeSourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[#2563EB] underline">source</a>}
                                  {!intake.intakeSourceUrl && intake.feeSourceUrl && <a href={intake.feeSourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[#2563EB] underline">source</a>}
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-xs text-gray-500 mt-1">Intake details not recorded.</p>}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-3">Course source: {c.sourceUrl || c.officialUrl || 'Not recorded'}{c.lastVerifiedAt ? ` • Last checked ${new Date(c.lastVerifiedAt).toLocaleDateString()}` : ' • Verification date not recorded'}</p>
                        <Link href={`/course/${c.slug || c.courseId}`} className="mt-3 inline-flex text-xs font-semibold text-[#2563EB] underline">View course details →</Link>
                      </Card>
                    );
                  })}
                </div>
              )}
              {courseTotal > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                  <p className="text-xs text-gray-600">Showing {firstCourseNumber}–{lastCourseNumber} of {courseTotal} matching course records</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" disabled={coursePage <= 1 || courseLoading} onClick={() => setCoursePage((current) => Math.max(1, current - 1))} aria-label="Previous course page"><ChevronLeft className="size-4" />Previous</Button>
                    <span className="text-xs text-gray-600">Page {coursePage} of {courseTotalPages}</span>
                    <Button type="button" variant="outline" disabled={coursePage >= courseTotalPages || courseLoading} onClick={() => setCoursePage((current) => Math.min(courseTotalPages, current + 1))} aria-label="Next course page">Next<ChevronRight className="size-4" /></Button>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-gray-500 mt-4">This page reports only records currently present and approved in ALO’s database. Missing code or eligibility data is explicitly marked; complete jurisdiction-wide official-code coverage has not been independently established.</p>
            </Card>

            {/* 9. Entry Requirements + 10. English Requirements */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-[#2563EB]" />Entry Requirements</h3><div className="space-y-2 text-xs text-gray-700"><p><strong>Foundation:</strong> SSC/HSC with minimum GPA — check course page</p><p><strong>Bachelor:</strong> HSC/A-Level with minimum GPA 3.0 — varies</p><p><strong>Master:</strong> Bachelor degree with minimum 60% or CGPA 2.75+</p><p><strong>PhD:</strong> Master with Merit + Research Proposal</p><p className="text-[11px] text-gray-500 mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">Requirements vary by university and course. Check the specific course requirements. Official source: {uni.officialUrl ? <a href={uni.officialUrl} target="_blank" className="text-[#2563EB] underline">Official</a> : 'Information not currently verified.'}</p></div></Card>
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#2563EB]" />English Requirements</h3><div className="space-y-2 text-xs"><p><strong>IELTS:</strong> {ieltsMin} overall — min band varies</p><p><strong>PTE:</strong> Check course requirement — 58+ typical for Master</p><p><strong>TOEFL:</strong> Check official source</p><p><strong>Duolingo:</strong> Accepted where verified — 115+ typical</p><p><strong>MOI:</strong> {uni.ieltsMin ? 'Check course — MOI may be accepted' : 'Information not currently verified.'}</p><p className="text-[11px] text-gray-500 mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">Requirements vary by country, visa route, university and course. Official source verification required.</p></div></Card>
            </div>

            {/* 11. Tuition Fees + 12. Scholarships + 13. Intakes + 14. Application Fees + 15. Deposit */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm text-[#0F172A] mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#2563EB]" />Tuition Fees</h4><p className="text-lg font-bold text-[#0F172A]">{tuition}</p><p className="text-xs text-gray-500 mt-1">Official Tuition Fee URL: {uni.officialTuitionFeeUrl ? <a href={uni.officialTuitionFeeUrl} target="_blank" className="text-[#2563EB] underline">View</a> : 'Information not currently verified.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm text-[#0F172A] mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-[#F97316]" />Scholarships</h4><p className="text-sm font-semibold">{scholarships.length > 0 ? `${scholarships.length} scholarships available` : 'Scholarships available for eligible students'}</p><p className="text-xs text-gray-500 mt-1">{scholarships.slice(0,2).map((s:any)=> s.scholarshipName || s.name).join(', ') || 'Check scholarship directory'}</p><Link href={`/scholarships?university=${uni.universityId}`} className="text-xs text-[#2563EB] underline mt-2 inline-block">View Scholarships →</Link></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm text-[#0F172A] mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" />Intakes</h4><p className="text-sm">January 2027 – January 2028</p><p className="text-xs text-gray-500 mt-1">{courseLoading ? 'Loading matching intake records…' : `${courseTotal} matching course records with a recorded intake in this window.`}</p></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">Application Fees</h4><p className="text-sm">Check official source — varies by course. Some partner universities waive application fee via ALO.</p><p className="text-xs text-gray-500 mt-1">Official Application URL: {uni.officialCourseSearchUrl ? <a href={uni.officialCourseSearchUrl} target="_blank" className="text-[#2563EB] underline">View</a> : 'Information not currently verified.'}</p></Card>
              <Card className="p-5 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">Deposit Information</h4><p className="text-sm">Tuition deposit typically £2,000-£5,000 or 50% for CAS/I-20/COE request — check offer letter and official source.</p><p className="text-xs text-gray-500 mt-1">Deposit varies by university and course. Check specific course requirements.</p></Card>
            </div>

            {/* 16. Required Documents + 17. Application Process + 18. Deadlines */}
            <Card className="p-6 md:p-8 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center gap-2"><FileText className="w-5 h-6 text-[#2563EB]" />Required Documents, Application Process & Deadlines</h2>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div><h4 className="font-semibold mb-2">Documents</h4><ul className="space-y-1.5 text-xs list-disc list-inside text-gray-700"><li>Valid Passport</li><li>Academic Certificates & Transcripts</li><li>IELTS/PTE/TOEFL/Duolingo score</li><li>SOP & CV</li><li>2 Reference Letters</li><li>Work Experience (if applicable)</li><li>Bank Solvency & Financial Evidence</li></ul></div>
                <div><h4 className="font-semibold mb-2">Application Process</h4><ol className="space-y-1.5 text-xs list-decimal list-inside text-gray-700"><li>Check Eligibility</li><li>Select Program</li><li>Submit Documents</li><li>Receive Offer</li><li>Pay Deposit</li><li>CAS/I-20/COE</li><li>Visa File Prep</li><li>Pre-Departure</li></ol></div>
                <div><h4 className="font-semibold mb-2">Important Deadlines</h4><p className="text-xs text-gray-600">Application deadlines vary by intake. September intake typically closes Jan-Mar for competitive programs. Check official source for verified deadlines.</p><p className="text-[11px] text-gray-500 mt-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2">Source: Official university page — Last verified: {uni.lastVerifiedAt ? new Date(uni.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'}</p></div>
              </div>
            </Card>

            {/* 19. Career / Placement + 20. International Student Support + 21. Accommodation + 22. Student Life */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#2563EB]" />Career / Placement</h3><p className="text-sm text-gray-700">Many courses include optional 1-year industrial placement or internship module. Check course detail for placementOption flag. Career outcomes vary by course.</p><p className="text-xs text-gray-500 mt-2">Source: Official course page — verify placement availability.</p></Card>
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-[#2563EB]" />International Student Support</h3><p className="text-sm text-gray-700">{uni.internationalStudentSupportSummary || 'International student support services available — check official university international student support page for verified information.'}</p><p className="text-xs text-gray-500 mt-2">Official International URL: {uni.officialInternationalAdmissionsUrl ? <a href={uni.officialInternationalAdmissionsUrl} target="_blank" className="text-[#2563EB] underline">View</a> : 'Information not currently verified.'}</p></Card>
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-2">Accommodation Information</h3><p className="text-sm text-gray-700">University accommodation and private housing options available in {city}. Costs vary by location and type. Check official accommodation page for verified information.</p><p className="text-xs text-gray-500 mt-2">Information not currently verified. Please check with an ALO Education counselor for accommodation guidance.</p></Card>
              <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-2">Student Life in {city}</h3><p className="text-sm text-gray-700">Student life, transport, job opportunities, living costs in {city}, {country}. Check country guide for verified living cost and work rights.</p><Link href={`/destinations/${country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="text-xs text-[#2563EB] underline mt-2 inline-block">View {country} Guide →</Link></Card>
            </div>

            {/* 23. Country Information */}
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-[#2563EB]" />Country Information — {country}</h3><p className="text-sm text-gray-700">Study in {country} — intakes, work rights, post-study routes, living costs. Requirements vary by visa route, university and course. Check official government sources for verified visa requirements.</p><div className="flex gap-2 mt-4"><Link href={`/destinations/${country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}><Button size="sm" className="bg-[#2563EB] text-white h-11">View {country} Guide</Button></Link><Link href="/course-finder"><Button size="sm" variant="outline" className="border-[#E2E8F0] h-11">Find Courses in {country}</Button></Link></div></Card>

            {/* 24. Related Courses + 25. Related Scholarships + 26. FAQs + 27. Book Consultation + 28. Apply Through ALO */}
            <RelatedContentEngine sourceType="university" sourceId={uni.universityId || uni.id} sourceSlug={uni.slug || slug} country={country} universityId={uni.universityId || uni.id} title={`Related Courses at ${name}`} />
            <RelatedContentEngine sourceType="university" sourceId={uni.universityId || uni.id} sourceSlug={uni.slug || slug} country={country} universityId={uni.universityId || uni.id} title={`Related Scholarships for ${name}`} />
            <FaqAccordion targetType="university" targetSlug={uni.slug || slug} title={`FAQs about ${name}`} limit={12} />

            <Card className="p-8 bg-gradient-to-r from-[#2563EB] to-[#003d80] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Apply to {name} Through ALO</h3>
              <p className="text-sm text-blue-100 mb-6 max-w-2xl mx-auto">Book free consultation, check eligibility, save course, compare, ask counselor — move from information → eligibility → course selection → consultation → application</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Check Eligibility</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white text-[#2563EB] hover:bg-blue-50 h-12 px-8 font-bold">Book Free Consultation</Button></Link>
                <Link href={`/course-finder?university=${uni.universityId}`}><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-8">View All Courses</Button></Link>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm"><h3 className="font-bold text-[#0F172A] mb-3">Quick Actions</h3><div className="space-y-2"><Link href="/eligibility-check" className="block"><Button className="w-full bg-[#F97316] text-white h-11">Check Eligibility</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Book Consultation</Button></Link><Link href={`/course-finder?university=${uni.universityId}`} className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">View Courses</Button></Link><Link href="/compare" className="block"><Button variant="outline" className="w-full border-[#E2E8F0] h-11">Compare</Button></Link></div></Card>
            <TestPreparationMiniCard contextTitle={`English for ${name}`} recommendedTest={`IELTS ${ieltsMin} / PTE`} targetScore={`${ieltsMin} overall`} />
            <Card className="p-6 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Sources & Verification</h3><div className="space-y-2 text-xs"><p><strong>Official URL:</strong> {uni.officialUrl ? <a href={uni.officialUrl} target="_blank" className="text-[#2563EB] underline break-all">{uni.officialUrl}</a> : 'Information not currently verified.'}</p><p><strong>Source URL:</strong> {uni.sourceUrl ? <a href={uni.sourceUrl} target="_blank" className="text-[#2563EB] underline break-all">{uni.sourceUrl}</a> : 'Not verified'}</p><p><strong>Verification Status:</strong> <Badge className={`${uni.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[10px]`}>{uni.verificationStatus || 'NEEDS_REVIEW'}</Badge></p><p><strong>Last Verified:</strong> {uni.lastVerifiedAt ? new Date(uni.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
