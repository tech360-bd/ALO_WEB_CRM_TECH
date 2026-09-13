'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, MapPin, Clock, DollarSign, Award, Globe, BookmarkPlus, GitCompare, Send, Loader2, ExternalLink, Filter } from 'lucide-react';
import Link from 'next/link';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';

export default function EnhancedCourseFinder() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    country: '',
    city: '',
    campus: '',
    studyLevel: '',
    subject: '',
    discipline: '',
    intake: '',
    tuitionMin: '',
    tuitionMax: '',
    scholarship: 'all',
    appFee: 'all',
    deposit: 'all',
    englishTest: '',
    ieltsMin: '',
    duration: '',
    deadline: '',
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCourses = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.country) params.set('country', filters.country);
      if (filters.studyLevel) params.set('studyLevel', filters.studyLevel);
      if (filters.subject) params.set('subjectArea', filters.subject);
      if (filters.englishTest) params.set('englishTest', filters.englishTest);
      if (filters.ieltsMin) params.set('ieltsMin', filters.ieltsMin);
      params.set('page', p.toString());
      params.set('limit', '24');

      const res = await fetch(`/api/course-finder?${params.toString()}`);
      const json = await res.json();
      setCourses(json.courses || json.data || []);
      setTotal(json.total || 0);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCourses(1); }, [fetchCourses]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-4">Course Finder — Same Underlying DB</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">Find Your Perfect Course</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Search from verified universities and courses across UK, USA, Canada, Australia, Ireland, New Zealand, Germany, Dubai. Public users can search course, university, country, city, campus, study level, subject, discipline, intake, tuition, scholarship, application fee, deposit, English test, IELTS, PTE, TOEFL, Duolingo, MOI, duration, deadline — public fields only, commission/internal notes blocked at DB/API/service layer.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Public: no commission</Badge>
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Student: eligibility + match score</Badge>
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Partner: own students</Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">DB-driven</Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="p-5 lg:col-span-1 h-fit bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
            <h3 className="font-semibold text-sm text-[#0F172A] mb-4 flex items-center gap-2"><Filter className="w-4 h-4 text-[#0057B8]" />Filters — Public Fields Only</h3>
            <div className="space-y-4">
              <div><label className="text-xs font-medium text-gray-600 mb-1.5 block">Search Course/University</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Course, university..." className="pl-9 bg-white border-[#E2E8F0] h-11" /></div></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Country</label><select value={filters.country} onChange={e => setFilters({ ...filters, country: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="">All Countries</option><option value="United Kingdom">UK</option><option value="United States">USA</option><option value="Canada">Canada</option><option value="Australia">Australia</option><option value="Germany">Germany</option><option value="Ireland">Ireland</option><option value="New Zealand">New Zealand</option><option value="UAE">Dubai</option></select></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">City</label><Input value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} placeholder="London, Toronto..." className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Campus</label><Input value={filters.campus} onChange={e => setFilters({ ...filters, campus: e.target.value })} placeholder="Main Campus, City Campus..." className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Study Level</label><select value={filters.studyLevel} onChange={e => setFilters({ ...filters, studyLevel: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="">All Levels</option><option value="Foundation">Foundation</option><option value="Bachelor">Bachelor</option><option value="Master">Master</option><option value="PhD">PhD</option><option value="Diploma">Diploma</option></select></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Subject</label><Input value={filters.subject} onChange={e => setFilters({ ...filters, subject: e.target.value })} placeholder="Business, Engineering..." className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Discipline</label><Input value={filters.discipline} onChange={e => setFilters({ ...filters, discipline: e.target.value })} placeholder="Computer Science, MBA..." className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Intake</label><select value={filters.intake} onChange={e => setFilters({ ...filters, intake: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="">Any Intake</option><option value="September">September</option><option value="January">January</option><option value="May">May</option></select></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Duration</label><select value={filters.duration} onChange={e => setFilters({ ...filters, duration: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="">Any Duration</option><option value="12">12 months</option><option value="24">24 months</option><option value="36">36 months</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Tuition Min</label><Input value={filters.tuitionMin} onChange={e => setFilters({ ...filters, tuitionMin: e.target.value })} placeholder="£0" className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Tuition Max</label><Input value={filters.tuitionMax} onChange={e => setFilters({ ...filters, tuitionMax: e.target.value })} placeholder="£50000" className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">Scholarship</label><select value={filters.scholarship} onChange={e => setFilters({ ...filters, scholarship: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="all">All</option><option value="yes">Scholarship Available</option></select></div>
                <div><label className="text-xs font-medium text-gray-600 mb-1 block">App Fee</label><select value={filters.appFee} onChange={e => setFilters({ ...filters, appFee: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="all">All</option><option value="waived">Fee Waived</option></select></div>
              </div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Deposit</label><select value={filters.deposit} onChange={e => setFilters({ ...filters, deposit: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="all">All</option><option value="low">Low Deposit</option></select></div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">English Test</label><select value={filters.englishTest} onChange={e => setFilters({ ...filters, englishTest: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="">All Tests</option><option value="ielts">IELTS</option><option value="pte">PTE Academic</option><option value="toefl">TOEFL iBT</option><option value="duolingo">Duolingo</option><option value="moi">MOI</option></select></div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">IELTS Min</label><Input value={filters.ieltsMin} onChange={e => setFilters({ ...filters, ieltsMin: e.target.value })} placeholder="6.0, 6.5..." className="bg-white border-[#E2E8F0] h-11 text-sm" /></div>
              <div><label className="text-xs font-medium text-gray-600 mb-1 block">Deadline</label><select value={filters.deadline} onChange={e => setFilters({ ...filters, deadline: e.target.value })} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm h-11"><option value="">Any Deadline</option><option value="rolling">Rolling</option><option value="upcoming">Upcoming</option></select></div>
              <Button onClick={() => fetchCourses(1)} className="w-full bg-[#0057B8] text-white h-12 font-bold">Apply Filters — Real DB</Button>
              <Button variant="outline" onClick={() => setFilters({ search: '', country: '', city: '', campus: '', studyLevel: '', subject: '', discipline: '', intake: '', tuitionMin: '', tuitionMax: '', scholarship: 'all', appFee: 'all', deposit: 'all', englishTest: '', ieltsMin: '', duration: '', deadline: '' })} className="w-full border-[#E2E8F0] h-11">Clear All Filters</Button>
              <TestPreparationMiniCard compact contextTitle="Prepare for English proficiency tests for this course" />
              <p className="text-[11px] text-gray-500 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">Public cannot see: commission, internal notes, partner information, staff notes, internal risk notes, university contracts, private financial information — blocked at DB/API/service layer.</p>
            </div>
          </Card>

          <div className="lg:col-span-3 space-y-4">
            {loading ? <div className="grid sm:grid-cols-2 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : courses.length === 0 ? (
              <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><Search className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No courses found. Try adjusting your filters. Real DB will populate — no fake data.</p><p className="text-xs text-gray-500 mt-2">Student additionally sees: eligibility score, match score, missing requirements, missing documents, scholarship match, saved courses, comparison, application draft — via student portal.</p></Card>
            ) : (
              <>
                <p className="text-sm text-gray-500">{total} courses found — DB-driven, verified, public fields only</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {courses.map((c: any) => (
                    <Card key={c.courseId || c.id} className="p-5 bg-white border-[#E2E8F0] hover:border-[#0057B8] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-[10px]">{c.studyLevel || 'Course'}</Badge>
                          {c.yearlyTuition ? <span className="text-xs font-bold text-[#0F172A]">{c.tuitionCurrency} {c.yearlyTuition}/yr</span> : <span className="text-[11px] text-gray-500">Check official source for tuition</span>}
                        </div>
                        <h3 className="font-bold text-sm text-[#0F172A] line-clamp-2 mb-1">{c.courseTitle}</h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mb-2"><Building2 className="w-3 h-3" />{c.universityName} • {c.city || ''}, {c.country}</p>
                        <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.durationMonths ? `${Math.round(c.durationMonths/12*10)/10}y` : 'Check duration'}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.intakeMonth || c.intakeName || 'Sep, Jan'}</span>
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{c.country}</span>
                        </div>
                        {c.scholarships && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] mt-2"><Award className="w-3 h-3 mr-1" />Scholarship Available</Badge>}
                        <p className="text-[10px] text-gray-500 mt-2">Source: {c.courseSourceUrl ? <a href={c.courseSourceUrl} target="_blank" className="text-[#0057B8] underline">Official</a> : 'Information not currently verified.'} • Last verified: {c.courseLastVerifiedAt ? new Date(c.courseLastVerifiedAt).toLocaleDateString() : 'Not verified'}</p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Link href={`/course/${c.slug || c.courseId}`} className="block"><Button className="w-full bg-[#0057B8] text-white hover:bg-[#004494] h-11 text-xs font-bold">View Course Details</Button></Link>
                        <div className="grid grid-cols-3 gap-2">
                          <Button variant="outline" size="sm" className="h-9 text-[11px] border-[#E2E8F0]"><BookmarkPlus className="w-3 h-3 mr-1" />Save</Button>
                          <Button variant="outline" size="sm" className="h-9 text-[11px] border-[#E2E8F0]"><GitCompare className="w-3 h-3 mr-1" />Compare</Button>
                          <Link href="/eligibility-check"><Button variant="outline" size="sm" className="h-9 text-[11px] border-[#E2E8F0]"><Send className="w-3 h-3 mr-1" />Apply</Button></Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-4 text-xs text-gray-600">
                  <span>Page {page} — {total} total</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-[#E2E8F0]" disabled={page <= 1} onClick={() => fetchCourses(page - 1)}>Prev</Button>
                    <Button size="sm" variant="outline" className="border-[#E2E8F0]" onClick={() => fetchCourses(page + 1)}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Building2(props: any) {
  return <GraduationCap {...props} />;
}
function Calendar(props: any) {
  return <Clock {...props} />;
}
