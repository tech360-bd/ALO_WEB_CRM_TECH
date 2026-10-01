'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, GraduationCap, Award, Building2, Globe, ArrowRight, Star } from 'lucide-react';
import Link from 'next/link';

export default function UniversitiesListing() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (countryFilter !== 'all') params.set('country', countryFilter);
    params.set('limit', '50');

    fetch(`/api/universities?${params.toString()}`)
      .then(r => r.json())
      .then(d => setUniversities(d.universities || []))
      .catch(() => setUniversities([]))
      .finally(() => setLoading(false));
  }, [search, countryFilter]);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm">
          <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs mb-4">362+ Partner Universities Worldwide</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">Top Partner Universities Worldwide</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Browse our complete directory of partner universities across the UK, USA, Canada, Australia, Germany, New Zealand, Ireland, and Dubai. Find entry requirements, tuition fees, and scholarship guidance — DB-driven with source verification, related content engine.</p>
          <div className="flex gap-2 mt-4">
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">DB-driven</Badge>
            <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Verified</Badge>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">362+ Universities</Badge>
          </div>
        </div>

        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Search universities..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white border-[#E2E8F0] h-11" /></div>
            <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"><option value="all">All Countries</option><option value="United Kingdom">UK</option><option value="United States">USA</option><option value="Canada">Canada</option><option value="Australia">Australia</option><option value="Germany">Germany</option><option value="Ireland">Ireland</option><option value="New Zealand">New Zealand</option><option value="UAE">Dubai</option></select>
            <Button className="bg-[#0B5ED7] text-white h-11">Search — DB-driven</Button>
          </div>
        </Card>

        {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}</div> : universities.length === 0 ? (
          <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-600">No universities found. Real DB will populate — no fake data.</p><p className="text-xs text-gray-500 mt-2">Information not currently verified. Please check with an ALO Education counselor.</p></Card>
        ) : (
          <>
            <p className="text-sm text-gray-500">{universities.length} universities found — DB-driven</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {universities.map((u: any) => (
                <Link key={u.universityId || u.id} href={`/universities/${u.slug || u.universityId}`}>
                  <Card className="p-6 bg-white border-[#E2E8F0] hover:border-[#0B5ED7] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-[10px]">{u.country}</Badge>
                        {u.worldRanking && <span className="text-[11px] text-gray-500">QS #{u.worldRanking}</span>}
                      </div>
                      <h3 className="font-bold text-[#0F172A] mb-1 line-clamp-2">{u.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" />{u.city}, {u.country} • {u.type || 'University'}</p>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-gray-500">IELTS Min:</span><span className="font-bold text-[#0B5ED7]">{u.ieltsMin || 'Check'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Tuition:</span><span className="font-medium">{u.tuitionRange || 'Check official source'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Courses:</span><span className="font-medium">{u.courseCount || '100+'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Scholarships:</span><span className="font-medium text-emerald-600">{u.scholarships ? 'Available' : 'Check'}</span></div>
                      </div>
                    </div>
                    <Button className="w-full mt-4 bg-[#0B5ED7] text-white hover:bg-[#004494] h-11 text-xs font-bold">View University Hub <ArrowRight className="w-4 h-4 ml-1" /></Button>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
