'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Search, Calendar, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function ScholarshipsListing() {
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (countryFilter !== 'all') params.set('country', countryFilter);
    params.set('limit', '50');

    fetch(`/api/scholarships?${params.toString()}`)
      .then(r => r.json())
      .then(d => setScholarships(d.scholarships || []))
      .catch(() => setScholarships([]))
      .finally(() => setLoading(false));
  }, [search, countryFilter]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm">
          <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-xs mb-4">Verified Scholarships Only</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">Study Abroad Scholarships</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Find verified scholarships for Bangladeshi students — Chevening, Commonwealth, Fulbright, ALO Merit Grants, and country-specific funding opportunities. Only publish verified scholarship information.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/eligibility-check"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-6 font-bold">Check Eligibility</Button></Link>
            <Link href="/book-consultation"><Button variant="outline" className="border-[#E2E8F0] h-12 px-6">Book Consultation</Button></Link>
          </div>
        </div>

        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search scholarships..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-11" /></div>
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="all">All Countries</option><option value="UK">UK</option><option value="USA">USA</option><option value="Canada">Canada</option><option value="Australia">Australia</option><option value="Germany">Germany</option></select>
            <Button className="bg-[#0B5ED7] text-white h-11">Search — DB-driven</Button>
          </div>
        </Card>

        {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : scholarships.length === 0 ? (
          <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><Award className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No verified scholarships yet. Only publish verified scholarship information per spec.</p><p className="text-xs text-gray-500 mt-2">Information not currently verified. Please check with an ALO Education counselor.</p></Card>
        ) : (
          <>
            <p className="text-sm text-gray-500">{scholarships.length} scholarships found — DB-driven, verified only</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {scholarships.map((s: any) => (
                <Link key={s.id} href={`/scholarships/${s.slug}`}>
                  <Card className="p-6 bg-white border-[#E2E8F0] hover:border-[#0B5ED7] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20 text-[10px]">{s.fundingType || 'Scholarship'}</Badge>
                        <span className="text-[11px] text-gray-500">{s.country || 'Global'}</span>
                      </div>
                      <h3 className="font-bold text-[#0F172A] mb-2 line-clamp-2">{s.name || s.scholarshipName}</h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">{s.eligibility?.substring(0, 100) || s.overview?.substring(0, 100) || 'Check eligibility'}</p>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">Funding:</span><span className="font-bold text-[#0F172A]">{s.fundingAmount || `${s.currency || ''} ${s.amount || ''}` || 'Check'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Deadline:</span><span className="font-semibold text-[#F97316]">{s.deadline || (s.deadlineDate ? new Date(s.deadlineDate).toLocaleDateString() : 'Check official')}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">University:</span><span className="font-medium truncate max-w-[120px]">{s.university || s.universityData?.name || 'Multiple'}</span></div>
                        <p className="text-[10px] text-gray-500 pt-1 border-t border-[#E2E8F0] mt-1">Last verified: {s.lastVerifiedAt ? new Date(s.lastVerifiedAt).toLocaleDateString() : 'Not verified'} • {s.verificationStatus || 'pending'}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Button className="w-full bg-[#0B5ED7] text-white hover:bg-[#004494] h-11 text-xs font-bold">View Details <ArrowRight className="w-4 h-4 ml-1" /></Button>
                      <Button variant="outline" className="w-full border-[#E2E8F0] h-11 text-xs">Check Eligibility</Button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}

        <Card className="p-8 bg-gradient-to-r from-[#0B5ED7] to-[#003d80] rounded-3xl text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Find All Scholarships</h3>
          <p className="text-sm text-blue-100 mb-6">Only publish verified scholarship information — no fake claims</p>
          <Link href="/book-consultation"><Button className="bg-[#F97316] text-white hover:bg-[#EA580C] h-12 px-8 font-bold">Book Scholarship Consultation</Button></Link>
        </Card>
      </div>
    </div>
  );
}
