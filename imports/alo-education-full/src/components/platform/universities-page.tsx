'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, GraduationCap, MapPin, Trophy, DollarSign, RefreshCw, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type University = {
  slug: string; name: string; countrySlug: string; city?: string; ranking?: number;
  logo?: string; tuitionRange?: string; scholarshipAvailable?: boolean;
  country?: { name: string; shortName?: string; flag?: string; slug: string };
  courseCount?: number;
};

type CountryOption = { slug: string; name: string; flag?: string };

const RANKING_RANGES = [
  { key: 'all', label: 'Any Ranking' },
  { key: '1-50', label: 'Top 50' },
  { key: '51-100', label: '51–100' },
  { key: '101-200', label: '101–200' },
  { key: '201-500', label: '201–500' },
  { key: '500+', label: '500+' },
];

export function UniversitiesPage({ onBack, onNavigate, onLeadOpen }: { onBack: () => void; onNavigate: (page: string, slug?: string) => void; onLeadOpen: () => void }) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [rankRange, setRankRange] = useState('all');
  const [scholarship, setScholarship] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (country !== 'all') params.set('country', country);
    params.set('limit', '50');
    fetch(`/api/universities?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data?.universities) { setUniversities(data.universities); setTotal(data.total || 0); }
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [search, country, fetchKey]);

  useEffect(() => {
    fetch('/api/countries').then(r => r.json()).then(d => { if (d?.countries) setCountries(d.countries); }).catch(() => {});
  }, []);

  const handleRetry = useCallback(() => { setLoading(true); setError(false); setFetchKey(k => k + 1); }, []);

  let filtered = universities;
  if (rankRange !== 'all') {
    const [lo, hi] = rankRange.includes('+') ? [parseInt(rankRange), Infinity] : rankRange.split('-').map(Number);
    filtered = filtered.filter(u => u.ranking && u.ranking >= lo && u.ranking <= hi);
  }
  if (scholarship) filtered = filtered.filter(u => u.scholarshipAvailable);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <button onClick={onBack} className="fixed top-20 left-4 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm shadow-md rounded-full px-4 py-2 text-sm font-medium text-[#101828] hover:bg-white transition-all" aria-label="Go back">
        <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center -mt-16 md:-mt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC] via-[#101828] to-[#F37021]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 py-28 md:py-36 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">400+ Partner Universities</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Find Your University</h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">Browse partner universities across 18 countries. Compare programs, fees, rankings, and entry requirements.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search universities..." className="pl-10 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="w-[180px] rounded-full text-sm"><SelectValue placeholder="All Countries" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(c => <SelectItem key={c.slug} value={c.slug}>{c.flag} {c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={rankRange} onValueChange={setRankRange}>
              <SelectTrigger className="w-[150px] rounded-full text-sm"><SelectValue placeholder="Ranking" /></SelectTrigger>
              <SelectContent>{RANKING_RANGES.map(r => <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>)}</SelectContent>
            </Select>
            <button onClick={() => setScholarship(!scholarship)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${scholarship ? 'bg-[#F37021] text-white' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'}`}>
              Scholarship Only
            </button>
            <span className="ml-auto text-sm text-[#555555]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-8 md:py-12 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error ? (
            <div className="text-center py-20"><p className="text-[#555555] mb-4">Failed to load universities.</p><Button onClick={handleRetry} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button></div>
          ) : loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (<div key={i} className="space-y-3"><Skeleton className="h-44 w-full rounded-2xl" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /></div>))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20"><GraduationCap className="h-12 w-12 text-[#0066CC]/30 mx-auto mb-4" /><p className="text-[#555555]">No universities match your filters.</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map(u => (
                <Card key={u.slug} className="border-0 shadow-md rounded-2xl overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all" onClick={() => onNavigate('university', u.slug)}>
                  <div className="h-36 bg-gradient-to-br from-[#0066CC]/8 to-[#F37021]/8 flex items-center justify-center relative">
                    {u.logo ? <img src={u.logo} alt={u.name} className="h-20 object-contain" /> : <GraduationCap className="h-12 w-12 text-[#0066CC]/20" />}
                    {u.scholarshipAvailable && <Badge className="absolute top-3 right-3 bg-[#F37021] text-white text-xs">Scholarship</Badge>}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-[#101828] text-sm leading-tight line-clamp-2">{u.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#555555]">
                      <MapPin className="h-3 w-3" />
                      <span>{u.city}{u.country?.name ? `, ${u.country.name}` : ''}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {u.ranking && <div className="flex items-center gap-1 text-xs"><Trophy className="h-3 w-3 text-[#F37021]" /><span className="font-medium text-[#F37021]">#{u.ranking}</span></div>}
                      {u.tuitionRange && <div className="flex items-center gap-1 text-xs"><DollarSign className="h-3 w-3 text-[#0066CC]" /><span className="text-[#0066CC]">{u.tuitionRange}</span></div>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
