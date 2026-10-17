'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, GraduationCap, MapPin, Clock, Award, BookmarkPlus, GitCompare, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { calculateEligibilityScore, calculateMatchScore } from '@/lib/university-course/eligibility-engine';

export default function StudentCourseFinderPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>({ nationality: 'Bangladeshi', highestQualification: 'Bachelor', gpa: 3.2, englishTest: 'IELTS', englishScore: 6.5, preferredCountry: 'United Kingdom', preferredSubject: 'Business', budgetMax: 20000 });
  const [search, setSearch] = useState('');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (profile.preferredCountry) params.set('country', profile.preferredCountry);
      params.set('limit', '24');
      const res = await fetch(`/api/courses/search?${params.toString()}`);
      const json = await res.json();
      const data = json.data || [];
      // Calculate eligibility and match for each
      const enriched = data.map((c: any) => {
        const req = c.requirements || {};
        const eligibility = calculateEligibilityScore(profile, req, c);
        const match = calculateMatchScore(profile, c, eligibility.score);
        return { ...c, eligibility, matchScore: match };
      });
      setCourses(enriched);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, profile]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Student Course Finder — Same DB + Personalized Logic</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Find Courses — Personalized for You</h1>
          <p className="text-sm text-gray-600 max-w-3xl">Same database as public finder. Add personalized logic based on your profile: Nationality, Education country, Highest qualification, GPA/CGPA, English test/score, Study gap, Work experience, Backlogs, Budget, Preferred country/subject/intake. Calculates Eligibility Score + AI Match Score. Labels: Eligible, Likely Eligible, Need Review, Not Eligible, Missing Information. Never guarantee admission or visa.</p>
          <div className="grid md:grid-cols-4 gap-3 mt-6">
            <Input placeholder="Highest Qualification" value={profile.highestQualification} onChange={e => setProfile({ ...profile, highestQualification: e.target.value })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
            <Input placeholder="GPA e.g. 3.2" value={profile.gpa} onChange={e => setProfile({ ...profile, gpa: parseFloat(e.target.value) || 0 })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
            <Input placeholder="English Test e.g. IELTS" value={profile.englishTest} onChange={e => setProfile({ ...profile, englishTest: e.target.value })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
            <Input placeholder="English Score e.g. 6.5" value={profile.englishScore} onChange={e => setProfile({ ...profile, englishScore: parseFloat(e.target.value) || 0 })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-3">
            <Input placeholder="Preferred Country" value={profile.preferredCountry} onChange={e => setProfile({ ...profile, preferredCountry: e.target.value })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
            <Input placeholder="Preferred Subject" value={profile.preferredSubject} onChange={e => setProfile({ ...profile, preferredSubject: e.target.value })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
            <Input placeholder="Budget Max e.g. 20000" value={profile.budgetMax} onChange={e => setProfile({ ...profile, budgetMax: parseFloat(e.target.value) || 0 })} className="bg-white border-[#E2E8F0] h-11 text-sm" />
          </div>
        </div>

        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search courses — same DB..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-11" /></div><Button onClick={() => fetchCourses()} className="bg-[#0057B8] text-white h-11">Search — Personalized</Button></div>
        </Card>

        {loading ? <div className="grid sm:grid-cols-2 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : courses.length === 0 ? (
          <Card className="p-12 bg-white border-[#E2E8F0] rounded-2xl text-center"><Search className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No courses match your current filters — real DB, no fake data.</p></Card>
        ) : (
          <>
            <p className="text-sm text-gray-500">{courses.length} courses — with Eligibility Score + AI Match Score</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {courses.map((c: any) => (
                <Card key={c.courseId} className="p-5 bg-white border-[#E2E8F0] hover:border-[#0057B8] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${c.eligibility.label === 'Eligible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : c.eligibility.label === 'Likely Eligible' ? 'bg-blue-50 text-blue-700 border-blue-100' : c.eligibility.label === 'Need Review' ? 'bg-amber-50 text-amber-700 border-amber-200' : c.eligibility.label === 'Not Eligible' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'} text-[10px]`}>{c.eligibility.label} — {c.eligibility.score}%</Badge>
                      <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Match {c.matchScore}%</Badge>
                    </div>
                    <h3 className="font-bold text-sm text-[#0F172A] line-clamp-2 mb-1">{c.courseTitle}</h3>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{c.university?.name} • {c.country}</p>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1 text-[11px]">
                      <p><strong>Eligibility:</strong> {c.eligibility.reasons.slice(0, 2).join(' • ')}</p>
                      {c.eligibility.missing.length > 0 && <p className="text-amber-700"><strong>Missing:</strong> {c.eligibility.missing.join(', ')}</p>}
                      <p><strong>Tuition:</strong> {c.currency} {c.tuitionFee} • <strong>Scholarship:</strong> {c.scholarships?.length ? `${c.scholarships.length} available` : 'Check'} • <strong>Intake:</strong> {c.intakes?.[0]?.intakeMonth || 'Sep, Jan'}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Link href={`/student/course/${c.courseId}`} className="block"><Button className="w-full bg-[#0057B8] text-white h-11 text-xs font-bold">View Course + Eligibility</Button></Link>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="h-9 text-[11px] border-[#E2E8F0]"><BookmarkPlus className="w-3 h-3 mr-1" />Save</Button>
                      <Link href="/student/compare"><Button variant="outline" size="sm" className="h-9 text-[11px] border-[#E2E8F0]"><GitCompare className="w-3 h-3 mr-1" />Compare</Button></Link>
                      <Link href={`/student/apply/${c.courseId}`}><Button variant="outline" size="sm" className="h-9 text-[11px] border-[#E2E8F0]"><Send className="w-3 h-3 mr-1" />Apply</Button></Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
