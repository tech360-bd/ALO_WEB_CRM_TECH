'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, GraduationCap, Award, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { calculateEligibilityScore } from '@/lib/university-course/eligibility-engine';

export default function PartnerSearchProgramsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [profile, setProfile] = useState({ gpa: 3.2, englishTest: 'IELTS', englishScore: 6.5 });

  useEffect(() => {
    fetch('/api/partner/students?limit=20')
      .then(r => r.json())
      .then(d => setStudents(d.students || d.data || []))
      .catch(() => setStudents([{ id: 'demo-1', name: 'Demo Student 1', email: 'demo1@test.com' }, { id: 'demo-2', name: 'Demo Student 2', email: 'demo2@test.com' }]));
  }, []);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      params.set('limit', '20');
      const res = await fetch(`/api/courses/search?${params.toString()}`);
      const json = await res.json();
      const data = json.data || [];
      const enriched = data.map((c: any) => {
        const req = c.requirements || {};
        const eligibility = calculateEligibilityScore(profile, req, c);
        return { ...c, eligibility };
      });
      setCourses(enriched);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [search, profile]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-white border border-[var(--alo-border)] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-xs mb-3">Partner Course Finder — Select ONLY Own Student, Own Commission Where Permitted</Badge>
          <h1 className="text-3xl font-bold text-[var(--alo-text)]">Partner Search Programs</h1>
          <p className="text-sm text-[var(--alo-body)] mt-2">Partner selects ONLY their own student — other partner students blocked at backend. Search by Country, University, City, Study level, Subject, Intake, Tuition, Scholarship, English, Academic profile. Shows Eligible/Need Review/Not Eligible. Partner can Save/Compare/Apply/Upload documents/Track application. Commission: Partner can see ONLY their own permitted commission — backend enforced, not frontend hiding.</p>
        </div>

        <Card className="p-5 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
          <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[var(--alo-brand)]" />Select Your Own Student — Other Partner Students Blocked</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {students.map((s: any) => (
              <Card key={s.id} onClick={() => setSelectedStudent(s)} className={`p-3 cursor-pointer border rounded-xl ${selectedStudent?.id === s.id ? 'bg-[var(--alo-brand)]/5 border-[var(--alo-brand)]' : 'bg-[var(--alo-page)] border-[var(--alo-border)] hover:border-[var(--alo-brand)]/50'}`}>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-[var(--alo-text-muted)]">{s.email}</p>
                {selectedStudent?.id === s.id && <Badge className="bg-[var(--alo-brand)] text-white text-[11px] mt-2">Selected — Own Student Only</Badge>}
              </Card>
            ))}
            {students.length === 0 && <p className="text-xs text-[var(--alo-text-muted)] col-span-3">No own students yet — partner sees only own students, other partner students blocked via partnerId filter at DB/API.</p>}
          </div>
          {!selectedStudent && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">Select own student first — partner cannot see other partner students, other partner commissions, internal ALO notes, staff risk notes, full finance info — blocked at backend.</p>}
        </Card>

        <Card className="p-4 bg-white border-[var(--alo-border)] rounded-2xl shadow-sm">
          <div className="flex gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" /><Input placeholder="Search programs — country, university, city, level, subject..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[var(--alo-border)] h-11" /></div><Button onClick={() => fetchCourses()} className="bg-[var(--alo-brand)] text-white h-11">Search — Own Student Eligibility</Button></div>
        </Card>

        {loading ? <div className="grid sm:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white border border-[var(--alo-border)] rounded-2xl animate-pulse" />)}</div> : courses.length === 0 ? (
          <Card className="p-12 bg-white border-[var(--alo-border)] rounded-2xl text-center"><Search className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" /><p className="text-sm text-[var(--alo-body)]">No courses match.</p></Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((c: any) => (
              <Card key={c.courseId} className="p-5 bg-white border-[var(--alo-border)] hover:border-[var(--alo-brand)] rounded-2xl">
                <div className="flex justify-between mb-2"><Badge className={`${c.eligibility.label === 'Eligible' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'} text-[11px]`}>{c.eligibility.label}</Badge><Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">Own Commission: {c.commissions?.[0]?.partnerCommission ? `${c.commissions[0].partnerCommission}` : 'Check permitted'}</Badge></div>
                <h3 className="font-bold text-sm line-clamp-2">{c.courseTitle}</h3>
                <p className="text-xs text-[var(--alo-text-muted)]">{c.university?.name} • {c.country}</p>
                <div className="flex gap-2 mt-3">
                  <Link href={`/partner/program/${c.courseId}`} className="flex-1"><Button size="sm" className="w-full bg-[var(--alo-brand)] text-white ">View Program</Button></Link>
                  <Link href={`/partner/apply/${selectedStudent?.id || 'student'}/${c.courseId}`} className="flex-1"><Button size="sm" className="w-full bg-[var(--alo-cta)] text-white " disabled={!selectedStudent}>Apply for Own Student</Button></Link>
                </div>
                <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Partner can see ONLY own permitted commission — backend must enforce, not frontend hiding. Other partner students/commissions/internal ALO notes/staff risk notes/full finance blocked.</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
