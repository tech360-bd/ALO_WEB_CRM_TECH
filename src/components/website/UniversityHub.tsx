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
import Image from 'next/image';
import { getCountryDestination } from '@/lib/country-destinations-data';
import EnquiryForm from './EnquiryForm';

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
      catalogue: 'international',
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
        if (e.name !== 'AbortError') setCourseListing({ error: e.message, popularCourses: [], internationalCourseCatalog: null });
      })
      .finally(() => {
        if (!controller.signal.aborted) setCourseLoading(false);
      });
    return () => controller.abort();
  }, [slug, coursePage]);

  if (loading) return <div className="p-12 text-center"><div className="h-64 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl animate-pulse max-w-7xl mx-auto" /></div>;
  if (error || !uni) return <div className="p-8 max-w-7xl mx-auto"><Card className="p-8 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl text-center"><AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm">Information not currently verified. Please check with an ALO Education counselor.</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">{error || 'University not found'}</p><Link href="/universities"><Button className="mt-4 bg-[var(--alo-brand)] text-white h-12">Browse Universities</Button></Link></Card></div>;

  const name = uni.name;
  const country = uni.country || 'Country not recorded';
  const city = uni.city || 'City not recorded';
  const website = uni.website || uni.officialUrl || '';
  const courses = courseListing?.popularCourses || [];
  const internationalCourseCatalog = courseListing?.internationalCourseCatalog;
  const courseTotal = internationalCourseCatalog?.totalCourses ?? 0;
  const courseTotalPages = internationalCourseCatalog?.totalPages ?? 0;
  const coursePageSize = internationalCourseCatalog?.pageSize || 12;
  const firstCourseNumber = courseTotal === 0 ? 0 : (coursePage - 1) * coursePageSize + 1;
  const lastCourseNumber = Math.min(coursePage * coursePageSize, courseTotal);
  const scholarships = uni.scholarshipList || uni.scholarshipRecords || [];
  const rankings = uni.rankings || uni.rankingRecords || [];
  const campusList: string[] = (() => {
    let campuses: unknown = uni.campuses;
    if (typeof campuses === 'string') {
      try { campuses = JSON.parse(campuses); } catch { return []; }
    }
    return Array.isArray(campuses)
      ? campuses.filter((campus: unknown): campus is string => typeof campus === 'string' && campus.trim().length > 0)
      : [];
  })();
  const tuition = uni.tuitionRange || null;
  const ieltsMin = Number(uni.ieltsMin) > 0 ? Number(uni.ieltsMin) : null;
  const countryGuideSlug = getCountryDestination(String(country || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'))?.slug || null;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[var(--alo-text-muted)] font-medium">
          <Link href="/" className="hover:text-[var(--alo-brand)]">Home</Link><span>›</span><Link href="/universities" className="hover:text-[var(--alo-brand)]">Universities</Link><span>›</span><span className="text-[var(--alo-body)]">{country}</span><span>›</span><span className="text-[var(--alo-brand)] font-bold">{name}</span>
        </nav>

        {/* 1. University Header */}
        <div className="overflow-hidden rounded-3xl border border-[var(--alo-border)] bg-white shadow-sm">
          <div className="relative h-52 sm:h-72">
            <Image src="/images/hero/study-abroad-hero.png" alt="Students planning their international education" fill sizes="(max-width: 1280px) 100vw, 1280px" className="object-cover" priority />
          </div>
          <div className="p-6 md:p-10">
          <p className="mb-3 text-xs font-semibold tracking-wide text-[var(--alo-text-muted)]">ALO university reference: {uni.universityId || uni.id || 'Not recorded'}</p>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={`${uni.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-xs`}>
              {uni.verificationStatus === 'VERIFIED' ? 'Verified university record' : `Verification: ${uni.verificationStatus || 'not verified'}`}
            </Badge>
            {uni.worldRanking > 0 && <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)] text-xs">World ranking recorded: #{uni.worldRanking}</Badge>}
          </div>
          <h1 className="font-heading text-[30px] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[36px] lg:text-[42px] text-[var(--alo-text)] mb-3">{name}</h1>
          <p className="text-lg text-[var(--alo-body)] flex items-center gap-2 mb-6"><MapPin className="w-5 h-5 text-[var(--alo-cta)]" />{city}, {country} {uni.founded ? `• Established ${uni.founded}` : ''}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/eligibility-check"><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-6 font-bold">Apply Through ALO</Button></Link>
            <Link href="#popular-courses"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">View International Courses ({courseTotal})</Button></Link>
            <Link href="/compare"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6">Compare University</Button></Link>
            {website ? <a href={website} target="_blank" rel="noopener noreferrer"><Button variant="outline" className="border-[var(--alo-border)] h-12 px-6 flex gap-1.5"><Globe className="w-4 h-4" />Official Website</Button></a> : <Button variant="outline" disabled title="No official website URL is recorded" className="border-[var(--alo-border)] h-12 px-6 flex gap-1.5"><Globe className="w-4 h-4" />Official website not recorded</Button>}
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-8 pt-6 border-t border-[var(--alo-border)] text-xs">
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase font-semibold">Country</p><p className="font-bold text-[var(--alo-text)]">{country}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">City</p><p className="font-bold">{city}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Institution type</p><p className="font-bold">{uni.type || 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">IELTS minimum</p><p className="font-bold text-[var(--alo-brand)]">{ieltsMin ?? 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Tuition range</p><p className="font-bold">{tuition || 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">International student count</p><p className="font-bold">{uni.intlStudents || 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Scholarships</p><p className="font-bold text-emerald-600">{uni.scholarships ? 'Availability recorded' : 'Not recorded'}</p></div>
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-[var(--alo-text-muted)] text-[11px] uppercase">Verified international courses</p><p className="font-bold">{courseLoading ? 'Loading…' : courseTotal}</p></div>
          </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* 2. Overview */}
            <Card className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h2 className="text-2xl font-bold text-[var(--alo-text)] mb-4 flex items-center gap-2"><Building2 className="w-6 h-6 text-[var(--alo-brand)]" />University Overview</h2>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed">{uni.description || 'No university overview is recorded for this page.'}</p>
              {!uni.description && <p className="text-xs text-[var(--alo-text-muted)] mt-3 italic bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">Information not currently verified. Please check with an ALO Education counselor.</p>}
              {uni.officialUrl && <p className="text-xs text-[var(--alo-text-muted)] mt-3">Official Source: <a href={uni.officialUrl} target="_blank" className="text-[var(--alo-brand)] underline">{uni.officialUrl}</a> {uni.lastVerifiedAt ? `• Last verified: ${new Date(uni.lastVerifiedAt).toLocaleDateString()}` : ''}</p>}
            </Card>

            {/* 3. Location + 4. Campus */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-[var(--alo-cta)]" />Location</h3><p className="text-sm text-[var(--alo-body)]">{[city !== 'City not recorded' ? city : '', country !== 'Country not recorded' ? country : ''].filter(Boolean).join(', ') || 'Location not recorded'}</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">Campus: {uni.campusName || 'Not recorded'}</p><p className="text-xs text-[var(--alo-text-muted)]">Official International Admissions URL: {uni.officialInternationalAdmissionsUrl ? <a href={uni.officialInternationalAdmissionsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">View</a> : 'Not recorded'}</p></Card>
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><Home className="w-5 h-5 text-[var(--alo-brand)]" />Campus Information</h3><div className="space-y-2 text-sm">{campusList.length ? campusList.map((campus, index) => <div key={`${campus}-${index}`} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 text-xs">{campus}</div>) : <p className="text-xs text-[var(--alo-text-muted)]">Campus locations are not recorded.</p>}<p className="text-xs text-[var(--alo-text-muted)]">Official Course Search URL: {uni.officialCourseSearchUrl ? <a href={uni.officialCourseSearchUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">View</a> : 'Not recorded'}</p></div></Card>
            </div>

            {/* 5. Official Website + 6. International Student Info */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-[var(--alo-brand)]" />Official Website & International Student Information</h3><div className="grid sm:grid-cols-2 gap-4 text-sm"><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Official Website</p>{website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] font-semibold underline break-all">{website}</a> : <span className="text-xs text-[var(--alo-text-muted)]">Official website URL is not recorded.</span>}</div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">International Admissions</p>{uni.officialInternationalAdmissionsUrl ? <a href={uni.officialInternationalAdmissionsUrl} target="_blank" className="text-[var(--alo-brand)] underline">View Admissions Page</a> : <span className="text-xs">Information not currently verified. Please check with an ALO Education counselor.</span>}</div></div><p className="text-xs text-[var(--alo-text-muted)] mt-3">International Student Support: {uni.internationalStudentSupportSummary || 'Information not currently verified. Please check with an ALO Education counselor.'}</p></Card>

            {/* Verified record summary */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3">What this record confirms</h3><ul className="space-y-2 text-sm text-[var(--alo-body)]">{rankings.length > 0 ? <li>• {rankings.length} ranking record{rankings.length === 1 ? '' : 's'} are recorded and displayed with their available source metadata.</li> : <li>• No ranking record is currently available in the published university profile.</li>}{courseTotal > 0 ? <li>• {courseTotal} active, published, source-linked and verified course record{courseTotal === 1 ? '' : 's'} have an explicit positive international-eligibility status.</li> : <li>• No published, verified course record with an explicit positive international-eligibility status was returned; this does not establish that no courses exist.</li>}{scholarships.length > 0 ? <li>• {scholarships.length} active, verified scholarship record{scholarships.length === 1 ? '' : 's'} are linked to this profile.</li> : <li>• No verified scholarship records are linked to this profile.</li>}</ul><p className="mt-3 text-[11px] text-[var(--alo-text-muted)]">These are database coverage facts, not a promotional ranking or a claim of complete institutional coverage.</p></Card>

            {/* Complete paginated catalogue of verified international-eligible course records */}
            <Card id="popular-courses" className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2"><GraduationCap className="w-6 h-6 text-[var(--alo-brand)]" />Verified courses open to international students</h2>
                  <p className="text-xs text-[var(--alo-body)] mt-2">All matching source-linked, verified, published records with explicit positive international eligibility are paginated across study levels. Listing does not require an intake in a particular year, and the database count is not an exhaustive-catalogue certification.</p>
                </div>
                <Badge className="bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]">Institution code on file: {uni.universityCode?.trim() || 'Not recorded'}</Badge>
              </div>
              {internationalCourseCatalog && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-950" role="status" aria-live="polite">
                  <p className="font-semibold">Catalogue coverage: {internationalCourseCatalog.catalogueCoverageStatus || 'RESEARCH_REQUIRED'}</p>
                  <p className="mt-1">Showing {courseTotal} source-linked, verified, published course records with explicit positive international eligibility, regardless of intake year. {internationalCourseCatalog.courseRecordsNotCurrentlyPublishable || 0} of {internationalCourseCatalog.candidateCourseRecords || 0} CRM course records are not currently published and verified; {internationalCourseCatalog.eligibilityNotConfirmedCourseRecords || 0} records do not have an explicit positive international-eligibility status.</p>
                  <p className="mt-1">{internationalCourseCatalog.verifiedInternationalCoursesWithoutVerifiedIntake || 0} verified eligible course records have no linked source-verified intake/fee record. The course remains listed; no intake or fee is inferred. These are database counts, not a count of every course in the institution’s official catalogue.</p>
                </div>
              )}
              {internationalCourseCatalog && (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-950" role="status">
                  <p className="font-semibold">Course-code coverage is not certified by stored text fields.</p>
                  <p className="mt-1">{internationalCourseCatalog.courseCodesRecorded} of {courseTotal} listed eligible course records have a non-empty course-code field; {internationalCourseCatalog.courseCodesMissing} have none. This is a field-presence count, not proof that every official code is present, active, or international-student applicable.</p>
                </div>
              )}
              {courseLoading && courses.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)]" role="status">Loading verified international course records…</p>
              ) : courseListing?.error ? (
                <p className="text-sm text-red-700" role="alert">Course data could not be loaded. {courseListing.error}</p>
              ) : courses.length === 0 ? (
                <p className="text-sm text-[var(--alo-body)]">No published, source-linked course record with verified explicit international eligibility was returned. This may indicate a data-coverage gap; it does not establish that the university has no internationally eligible courses.</p>
              ) : (
                <div className={`grid sm:grid-cols-2 gap-4 ${courseLoading ? 'opacity-60' : ''}`} aria-busy={courseLoading}>
                  {courses.map((c: any) => {
                    // Keep the fee/intake record after the basic intake row so its source and verification metadata win when both models contain the same month.
                    const allIntakes = [...(c.courseIntakes || []), ...(c.intakes || [])];
                    const uniqueIntakes = Array.from(new Map(allIntakes.map((intake: any) => [`${intake.intakeYear}-${String(intake.intakeMonth).toLowerCase()}`, intake])).values());
                    const eligibility = String(c.internationalEligibility || 'not_verified').trim();
                    const eligibilityLabel = !eligibility || eligibility.toLowerCase() === 'not_verified' ? 'Not verified' : eligibility;
                    return (
                      <Card key={c.courseId || c.id} className="p-4 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-xl h-full">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className="bg-white border-[var(--alo-border)] text-[11px]">{c.studyLevel || 'Course level not recorded'}</Badge>
                          <Badge className={`${c.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[11px]`}>{c.verificationStatus || 'NEEDS_REVIEW'}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm text-[var(--alo-text)]">{c.courseTitle}</h3>
                        <p className="text-xs text-[var(--alo-body)] mt-1">{c.qualification || 'Qualification not recorded'} • {c.durationMonths ? `${Math.round(c.durationMonths / 12 * 10) / 10} years` : 'Duration not recorded'}</p>
                        <dl className="grid grid-cols-1 gap-1 mt-3 text-xs">
                          <div><dt className="inline font-semibold">Course code on file:</dt><dd className="inline ml-1">{c.courseCode?.trim() || 'Not recorded'}</dd></div>
                          <div><dt className="inline font-semibold">International-student eligibility:</dt><dd className="inline ml-1">{eligibilityLabel}</dd></div>
                        </dl>
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-[var(--alo-body)]">Source-verified intake and fee records (all years)</p>
                          {uniqueIntakes.length ? (
                            <ul className="mt-1 space-y-1 text-xs text-[var(--alo-body)]">
                              {uniqueIntakes.map((intake: any, index: number) => (
                                <li key={`${intake.intakeYear}-${intake.intakeMonth}-${index}`}>
                                  {intake.intakeMonth} {intake.intakeYear} — status: {intake.status || 'not recorded'}{intake.verificationStatus ? ` • verification: ${intake.verificationStatus}` : ' • intake verification not recorded'}
                                  {intake.intakeSourceUrl && <a href={intake.intakeSourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[var(--alo-brand)] underline">source</a>}
                                  {!intake.intakeSourceUrl && intake.feeSourceUrl && <a href={intake.feeSourceUrl} target="_blank" rel="noopener noreferrer" className="ml-1 text-[var(--alo-brand)] underline">source</a>}
                                </li>
                              ))}
                            </ul>
                          ) : <p className="text-xs text-[var(--alo-text-muted)] mt-1">No source-verified intake or fee record is linked. Course eligibility is recorded separately.</p>}
                        </div>
                        <p className="text-[11px] text-[var(--alo-text-muted)] mt-3">Course source: {c.sourceUrl || c.officialUrl || 'Not recorded'}{c.lastVerifiedAt ? ` • Last checked ${new Date(c.lastVerifiedAt).toLocaleDateString()}` : ' • Verification date not recorded'}</p>
                        <Link href={`/course/${c.slug || c.courseId}`} className="mt-3 inline-flex text-xs font-semibold text-[var(--alo-brand)] underline">View course details →</Link>
                      </Card>
                    );
                  })}
                </div>
              )}
              {courseTotal > 0 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--alo-border)] pt-4">
                  <p className="text-xs text-[var(--alo-body)]">Showing {firstCourseNumber}–{lastCourseNumber} of {courseTotal} matching course records</p>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" disabled={coursePage <= 1 || courseLoading} onClick={() => setCoursePage((current) => Math.max(1, current - 1))} aria-label="Previous course page"><ChevronLeft className="size-4" />Previous</Button>
                    <span className="text-xs text-[var(--alo-body)]">Page {coursePage} of {courseTotalPages}</span>
                    <Button type="button" variant="outline" disabled={coursePage >= courseTotalPages || courseLoading} onClick={() => setCoursePage((current) => Math.min(courseTotalPages, current + 1))} aria-label="Next course page">Next<ChevronRight className="size-4" /></Button>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-4">This page reports only records currently present and approved in ALO’s database. Missing code or eligibility data is explicitly marked; complete jurisdiction-wide official-code coverage has not been independently established.</p>
            </Card>

            {/* Course-specific requirements are shown only where recorded and sourced. */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><FileText className="w-5 h-5 text-[var(--alo-brand)]" />Academic entry requirements</h3><p className="text-sm text-[var(--alo-body)]">University-wide academic thresholds are not recorded here. Course-level entry criteria must be checked on the linked course record and its official source.</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2">No minimum GPA or qualification is inferred from another course or institution.</p></Card>
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--alo-brand)]" />English requirements</h3><p className="text-sm text-[var(--alo-body)]">University-wide test thresholds and waivers are not recorded. A course-specific verified requirement may appear on the corresponding course page.</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2">IELTS: {ieltsMin ?? 'Not recorded'} overall at university profile level. No other test score or minimum band is inferred.</p></Card>
            </div>

            {/* 11. Tuition Fees + 12. Scholarships + 13. Intakes + 14. Application Fees + 15. Deposit */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm text-[var(--alo-text)] mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[var(--alo-brand)]" />Tuition range</h4><p className="text-lg font-bold text-[var(--alo-text)]">{tuition || 'Not recorded'}</p><p className="text-xs text-[var(--alo-text-muted)] mt-1">Official tuition source: {uni.officialTuitionFeeUrl ? <a href={uni.officialTuitionFeeUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">View</a> : 'Not recorded'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm text-[var(--alo-text)] mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-[var(--alo-cta)]" />Scholarship records</h4><p className="text-sm font-semibold">{scholarships.length > 0 ? `${scholarships.length} active, verified record${scholarships.length === 1 ? '' : 's'}` : 'No verified scholarship record linked'}</p><p className="text-xs text-[var(--alo-text-muted)] mt-1">{scholarships.slice(0,2).map((s:any)=> s.scholarshipName || s.name).filter(Boolean).join(', ') || 'Coverage may be incomplete; no scholarship is inferred.'}</p><Link href={`/scholarships?university=${encodeURIComponent(uni.universityId || '')}`} className="text-xs text-[var(--alo-brand)] underline mt-2 inline-block">Search scholarship records →</Link></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm text-[var(--alo-text)] mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" />Verified intake records</h4><p className="text-sm">All years, when source-backed</p><p className="text-xs text-[var(--alo-text-muted)] mt-1">{courseLoading ? 'Loading verified intake records…' : `${courses.reduce((count: number, course: any) => count + (course.intakes?.length || 0), 0)} source-verified intake/fee records are attached to the current course page.`}</p></Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">Application fee</h4><p className="text-sm">A university-wide application fee is not recorded. Check the current course and application source.</p><p className="text-xs text-[var(--alo-text-muted)] mt-1">Official application URL: {uni.officialCourseSearchUrl ? <a href={uni.officialCourseSearchUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">View</a> : 'Not recorded'}</p></Card>
              <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h4 className="font-bold text-sm mb-2">Deposit information</h4><p className="text-sm">No university-wide deposit amount is recorded in this profile.</p><p className="text-xs text-[var(--alo-text-muted)] mt-1">Use a source-linked course/intake record or official offer to confirm a deposit; amounts are not estimated.</p></Card>
            </div>

            {/* Generic guidance is explicitly distinguished from institution requirements. */}
            <Card className="p-6 md:p-8 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
              <h2 className="text-xl font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><FileText className="w-5 h-6 text-[var(--alo-brand)]" />Application information and evidence gaps</h2>
              <p className="mb-4 rounded-xl border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-3 text-xs leading-5 text-[var(--alo-brand-deep)]">This university profile does not contain a verified universal document checklist or application deadline. Course-level requirements and dates differ and are shown only when present in a source-linked record.</p>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div><h4 className="font-semibold mb-2">Required documents</h4><p className="text-xs leading-5 text-[var(--alo-body)]">Not recorded at university level. Confirm the current list with the specific course and official admissions source.</p></div>
                <div><h4 className="font-semibold mb-2">General planning steps</h4><ol className="space-y-1.5 text-xs list-decimal list-inside text-[var(--alo-body)]"><li>Review the linked official source.</li><li>Check the verified course-level record.</li><li>Confirm deadlines, documents and submission route with the institution.</li><li>Submit using the route specified by the official source.</li></ol></div>
                <div><h4 className="font-semibold mb-2">Important deadlines</h4><p className="text-xs text-[var(--alo-body)]">No university-wide application cutoff is recorded. Dates for individual courses appear only when present in verified intake records.</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-2 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2">University source last checked: {uni.lastVerifiedAt ? new Date(uni.lastVerifiedAt).toLocaleDateString() : 'Not recorded'}.</p></div>
              </div>
            </Card>

            {/* Institution-specific outcomes and services are surfaced only when recorded. */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-2 flex items-center gap-2"><Briefcase className="w-5 h-5 text-[var(--alo-brand)]" />Career and placement information</h3><p className="text-sm text-[var(--alo-body)]">No university-wide placement or employment outcome summary is recorded. Course-level placement options appear only where a course record provides them.</p></Card>
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-2 flex items-center gap-2"><Users className="w-5 h-5 text-[var(--alo-brand)]" />International student support</h3><p className="text-sm text-[var(--alo-body)]">{uni.internationalStudentSupportSummary || 'Support information is not recorded in this profile.'}</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">Official international admissions URL: {uni.officialInternationalAdmissionsUrl ? <a href={uni.officialInternationalAdmissionsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--alo-brand)] underline">View source</a> : 'Not recorded'}</p></Card>
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-2">Accommodation information</h3><p className="text-sm text-[var(--alo-body)]">Accommodation options and costs are not recorded in this profile.</p></Card>
              <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-2">Student life</h3><p className="text-sm text-[var(--alo-body)]">Student-life details for this institution are not recorded here.</p>{countryGuideSlug && <Link href={`/destinations/${countryGuideSlug}`} className="text-xs text-[var(--alo-brand)] underline mt-2 inline-block">View {country} destination guide →</Link>}</Card>
            </div>

            {/* Country-specific policy facts remain on the linked destination page. */}
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-[var(--alo-brand)]" />Destination information — {country}</h3><p className="text-sm text-[var(--alo-body)]">Visa rules, work rights and living costs are country-specific. This university profile does not restate those facts.</p><div className="flex gap-2 mt-4">{countryGuideSlug && <Link href={`/destinations/${countryGuideSlug}`}><Button size="sm" className="bg-[var(--alo-brand)] text-white h-12">View {country} guide</Button></Link>}<Link href={`/course-finder${uni.universityId ? `?university=${encodeURIComponent(uni.universityId)}` : ''}`}><Button size="sm" variant="outline" className="border-[var(--alo-border)] h-12">Search recorded courses</Button></Link></div></Card>

            {/* 24. Related Courses + 25. Related Scholarships + 26. FAQs + 27. Book Consultation + 28. Apply Through ALO */}
            <RelatedContentEngine sourceType="university" sourceId={uni.universityId || uni.id} sourceSlug={uni.slug || slug} country={country} universityId={uni.universityId || uni.id} title={`Related Courses at ${name}`} />
            <RelatedContentEngine sourceType="university" sourceId={uni.universityId || uni.id} sourceSlug={uni.slug || slug} country={country} universityId={uni.universityId || uni.id} title={`Related Scholarships for ${name}`} />
            <FaqAccordion targetType="university" targetSlug={uni.slug || slug} title={`FAQs about ${name}`} limit={12} />

            {/* Enquiry form (spec 3.2) — identical structure to the course and
                scholarship enquiry forms, pre-filled with this university. */}
            <EnquiryForm
              context={{
                type: 'university',
                subject: name,
                institution: [uni.city, country].filter(Boolean).join(', '),
                country,
                reference: uni.universityId || uni.slug || slug,
              }}
            />

            <Card className="p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-3xl text-white text-center">
              <h3 className="text-2xl font-bold mb-2">Apply to {name} Through ALO</h3>
              <p className="text-sm text-[var(--alo-brand-pale)] mb-6 max-w-2xl mx-auto">Request consultation, check eligibility, save course, compare, ask counselor — move from information → eligibility → course selection → consultation → application</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/eligibility-check"><Button className="bg-[var(--alo-cta)] text-white hover:bg-[var(--alo-cta-hover)] h-12 px-8 font-bold">Check Eligibility</Button></Link>
                <Link href="/book-consultation"><Button variant="outline" className="bg-white text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)] h-12 px-8 font-bold">Request Consultation</Button></Link>
                <Link href={`/course-finder?university=${uni.universityId}`}><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-8">View All Courses</Button></Link>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm"><h3 className="font-bold text-[var(--alo-text)] mb-3">Quick Actions</h3><div className="space-y-2"><Link href="/eligibility-check" className="block"><Button className="w-full bg-[var(--alo-cta)] text-white h-12">Check Eligibility</Button></Link><Link href="/book-consultation" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Book Consultation</Button></Link><Link href={`/course-finder?university=${uni.universityId}`} className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">View Courses</Button></Link><Link href="/compare" className="block"><Button variant="outline" className="w-full border-[var(--alo-border)] h-12">Compare</Button></Link></div></Card>
            <TestPreparationMiniCard contextTitle={`English for ${name}`} recommendedTest={ieltsMin ? `IELTS ${ieltsMin}` : 'Test requirement not recorded'} targetScore={ieltsMin ? `Recorded overall score: ${ieltsMin}` : 'Verify the official course requirement'} />
            <Card className="p-6 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-2xl"><h3 className="font-bold text-sm mb-3">Official Sources & Verification</h3><div className="space-y-2 text-xs"><p><strong>Official URL:</strong> {uni.officialUrl ? <a href={uni.officialUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{uni.officialUrl}</a> : 'Information not currently verified.'}</p><p><strong>Source URL:</strong> {uni.sourceUrl ? <a href={uni.sourceUrl} target="_blank" className="text-[var(--alo-brand)] underline break-all">{uni.sourceUrl}</a> : 'Not verified'}</p><p><strong>Verification Status:</strong> <Badge className={`${uni.verificationStatus === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[11px]`}>{uni.verificationStatus || 'NEEDS_REVIEW'}</Badge></p><p><strong>Last Verified:</strong> {uni.lastVerifiedAt ? new Date(uni.lastVerifiedAt).toLocaleDateString() : 'Information not currently verified.'}</p></div></Card>
          </div>
        </div>
      </div>
    </div>
  );
}
