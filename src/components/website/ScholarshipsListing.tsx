'use client';

// ============================================================================
// SCHOLARSHIP DIRECTORY (spec §13-§16) — premium discovery page.
// Hero: "Find Scholarships for Your Study Abroad Journey"
// Full filter system (§15), honest cards (§16) with computed status badge,
// every card links to /scholarships/{slug} — no dead cards, no fabricated
// data; unpublished records never render (API only returns PUBLISHED/active).
// ============================================================================

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { computeScholarshipStatus, SCHOLARSHIP_STATUS_BADGES } from '@/lib/scholarships/status-engine';

const FUNDING_TYPES = ['', 'full_funding', 'partial', 'tuition_waiver', 'living_stipend'] as const;
const SCHOLARSHIP_TYPES = ['', 'merit_based', 'need_based', 'athletic', 'country_specific', 'university_specific', 'other'] as const;
const AMOUNT_BANDS = [
  { value: 'all', label: 'Any amount' },
  { value: 'under5k', label: 'Under 5,000' },
  { value: '5k-15k', label: '5,000 – 15,000' },
  { value: 'above15k', label: 'Above 15,000' },
] as const;

const STATUS_CHIP: Record<string, string> = {
  OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSING_SOON: 'bg-amber-50 text-amber-700 border-amber-200',
  UPCOMING: 'bg-blue-50 text-blue-700 border-blue-200',
  CLOSED: 'bg-red-50 text-red-700 border-red-200',
  NEEDS_VERIFICATION: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ScholarshipsListing() {
  const [all, setAll] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // §15 filters
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [university, setUniversity] = useState('all');
  const [studyLevel, setStudyLevel] = useState('all');
  const [subject, setSubject] = useState('all');
  const [scholarshipType, setScholarshipType] = useState('');
  const [fundingType, setFundingType] = useState('');
  const [amountBand, setAmountBand] = useState('all');
  const [openOnly, setOpenOnly] = useState(false);
  const [fullyFundedOnly, setFullyFundedOnly] = useState(false);
  const [partialOnly, setPartialOnly] = useState(false);
  const [tuitionReductionOnly, setTuitionReductionOnly] = useState(false);
  const [meritOnly, setMeritOnly] = useState(false);
  const [needOnly, setNeedOnly] = useState(false);
  const [internationalOnly, setInternationalOnly] = useState(false);
  const [intake, setIntake] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (search) params.set('search', search);
    if (country !== 'all') params.set('country', country);
    if (university !== 'all') params.set('universityId', university);
    if (studyLevel !== 'all') params.set('studyLevel', studyLevel);
    if (subject !== 'all') params.set('subject', subject);
    if (fundingType) params.set('fundingType', fundingType);
    if (scholarshipType) params.set('scholarshipType', scholarshipType);
    if (intake) params.set('intake', intake);
    if (openOnly) params.set('applicationOpen', 'true');

    setLoading(true);
    fetch(`/api/scholarships?${params.toString()}`)
      .then(r => r.json())
      .then(d => setAll(d.scholarships || []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, [search, country, university, studyLevel, subject, fundingType, scholarshipType, intake, openOnly]);

  // Distinct university options from loaded data (honest — never fabricated)
  const universities = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of all) {
      const key = s.universityId || s.university;
      if (key && s.university) m.set(key, s.university);
    }
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);

  // Client-side refinements (§15: amount bands, fully/partial/tuition-reduction,
  // merit/need, international, computed application status)
  const filtered = useMemo(() => {
    return all.filter((s) => {
      if (fullyFundedOnly && !/full/i.test(String(s.fundingType || '') + ' ' + String(s.fundingAmount || ''))) return false;
      if (partialOnly && !/partial/i.test(String(s.fundingType || ''))) return false;
      if (tuitionReductionOnly && !/tuition|waiver/i.test(String(s.fundingType || ''))) return false;
      if (meritOnly && !/merit/i.test(String(s.scholarshipType || ''))) return false;
      if (needOnly && !/need/i.test(String(s.scholarshipType || ''))) return false;
      if (internationalOnly && !/international/i.test(String(s.nationalityRequirements || '') + ' ' + String(s.eligibility || ''))) return false;
      const n = Number(s.fundingAmountNumber || s.amount || 0);
      if (amountBand === 'under5k' && !(n > 0 && n < 5000)) return false;
      if (amountBand === '5k-15k' && !(n >= 5000 && n <= 15000)) return false;
      if (amountBand === 'above15k' && !(n > 15000)) return false;
      if (openOnly) {
        const st = computeScholarshipStatus(s);
        if (st !== 'OPEN' && st !== 'CLOSING_SOON') return false;
      }
      return true;
    });
  }, [all, amountBand, openOnly, fullyFundedOnly, partialOnly, tuitionReductionOnly, meritOnly, needOnly, internationalOnly]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        {/* Hero — spec §14 exact copy */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm">
          <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-xs mb-4">Verified Scholarships Only</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">Find Scholarships for Your Study Abroad Journey</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Discover verified scholarship opportunities and understand their eligibility, funding, deadlines and application requirements.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Check My Scholarship Eligibility</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Book Free Consultation</Button></Link>
          </div>
        </div>

        {/* Filters — spec §15 */}
        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm" aria-label="Scholarship filters">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search scholarships by name, university or keyword..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-11" aria-label="Search scholarships" /></div>
            <select aria-label="Country" value={country} onChange={e => setCountry(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="all">All Countries</option>{['UK','USA','Canada','Australia','Germany'].map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select aria-label="University" value={university} onChange={e => setUniversity(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="all">All Universities</option>{universities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
            <select aria-label="Study level" value={studyLevel} onChange={e => setStudyLevel(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="all">All Study Levels</option><option value="undergraduate">Undergraduate</option><option value="postgraduate">Postgraduate</option><option value="phd">PhD</option><option value="foundation">Foundation</option></select>
            <select aria-label="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="all">All Subjects</option>{['business','engineering','computer-science','health','law','arts'].map(s => <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>)}</select>
            <select aria-label="Scholarship type" value={scholarshipType} onChange={e => setScholarshipType(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="">Any Scholarship Type</option>{SCHOLARSHIP_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select>
            <select aria-label="Funding type" value={fundingType} onChange={e => setFundingType(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="">Any Funding Type</option>{FUNDING_TYPES.filter(Boolean).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}</select>
            <select aria-label="Amount" value={amountBand} onChange={e => setAmountBand(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11">{AMOUNT_BANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}</select>
            <Input aria-label="Intake" placeholder="Intake (e.g. September 2027)" value={intake} onChange={e => setIntake(e.target.value)} className="bg-white border-[#E2E8F0] h-11" />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs">
            {[
              ['Application open', openOnly, setOpenOnly],
              ['Fully funded', fullyFundedOnly, setFullyFundedOnly],
              ['Partially funded', partialOnly, setPartialOnly],
              ['Tuition reduction', tuitionReductionOnly, setTuitionReductionOnly],
              ['Merit-based', meritOnly, setMeritOnly],
              ['Need-based', needOnly, setNeedOnly],
              ['International students', internationalOnly, setInternationalOnly],
            ].map(([label, val, set]: any) => (
              <label key={label} className="inline-flex items-center gap-1.5 cursor-pointer select-none min-h-[32px]">
                <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="w-3.5 h-3.5 accent-[#2563EB]" />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </Card>

        {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : filtered.length === 0 ? (
          <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><Award className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No scholarships match these filters yet.</p><p className="text-xs text-gray-500 mt-2">ALO publishes only verified scholarship information — widen the filters or check back after new verifications.</p></Card>
        ) : (
          <>
            <p className="text-sm text-gray-500" role="status">{filtered.length} scholarship{filtered.length === 1 ? '' : 's'} found</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s: any) => {
                const st = computeScholarshipStatus(s);
                const badge = SCHOLARSHIP_STATUS_BADGES[st];
                return (
                  <Card key={s.id} className="p-6 bg-white border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-[10px]">{s.scholarshipType ? String(s.scholarshipType).replace(/_/g, ' ') : (s.fundingType || 'Scholarship')}</Badge>
                        <Badge className={`text-[10px] border ${STATUS_CHIP[st]}`}>{badge.label}</Badge>
                      </div>
                      <h3 className="font-bold text-[#0F172A] mb-1.5 line-clamp-2">{s.name || s.scholarshipName}</h3>
                      <p className="text-[11px] text-gray-500 mb-2">{s.university || 'Multiple universities'} • {s.country || 'Global'}</p>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{s.eligibility?.substring(0, 120) || s.overview?.substring(0, 120) || 'Eligibility summary — view details'}</p>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex justify-between gap-2"><span className="text-gray-500">Funding:</span><span className="font-bold text-[#0F172A] text-right">{s.fundingAmount || `${s.currency || ''} ${s.amount || ''}`.trim() || 'Funding varies. Check official scholarship terms.'}</span></div>
                        {s.fundingType && <div className="flex justify-between gap-2"><span className="text-gray-500">Funding type:</span><span className="font-medium text-right">{String(s.fundingType).replace(/_/g, ' ')}</span></div>}
                        <div className="flex justify-between gap-2"><span className="text-gray-500">Deadline:</span><span className="font-semibold text-[#F97316] text-right">{s.deadline || (s.deadlineDate ? new Date(s.deadlineDate).toLocaleDateString() : 'See official source')}</span></div>
                        <p className="text-[10px] text-gray-500 pt-1 border-t border-[#E2E8F0] mt-1">Last verified: {s.lastVerifiedAt ? new Date(s.lastVerifiedAt).toLocaleDateString() : 'Not verified'} • {s.verificationStatus || 'pending'}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link href={`/scholarships/${s.slug}`} aria-label={`View details of ${s.name}`}><Button className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] h-11 text-xs font-bold">View Details <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
                      <Link href="/eligibility-check" aria-label={`Check eligibility for ${s.name}`}><Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">Check Eligibility</Button></Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Final CTA — spec §24 */}
        <Card className="p-8 bg-gradient-to-r from-[#2563EB] to-[#003d80] rounded-3xl text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Start?</h3>
          <p className="text-sm text-blue-100 mb-6">Never promise scholarship success — but a correct strategy and verified information improve your genuine chances.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Check My Scholarship Eligibility</Button></Link>
            <Link href="/course-finder"><Button className="bg-white text-[#2563EB] hover:bg-blue-50 h-12 px-6 font-bold">Find Matching Courses</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 h-12 px-6">Book Free Consultation</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
