'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Building2, ArrowRight, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UniversityListingItem {
  id: string;
  name: string;
  slug: string;
  country: string;
  city?: string;
  type?: string;
  worldRanking?: number;
  ranking?: number;
  rankingProvider?: string;
  rankingYear?: number;
  lastVerifiedAt?: string | null;
  _count?: { courses: number };
}

const PAGE_SIZE = 24;
// Must match the stored `country` values exactly (the filter is an exact match).
// Aligned with the university master data (data/01_ALO_UNIVERSITY_MASTER.csv).
const COUNTRIES = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland',
  'New Zealand', 'Germany', 'France', 'Netherlands', 'Italy',
  'Malta', 'Cyprus', 'South Korea', 'UAE',
];

export default function UniversitiesListing() {
  const [universities, setUniversities] = useState<UniversityListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search.trim()) params.set('search', search.trim());
      if (countryFilter) params.set('countries', countryFilter);

      try {
        const response = await fetch(`/api/course-finder/universities?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load universities');
        setUniversities(Array.isArray(data.universities) ? data.universities : []);
        setTotal(Number.isFinite(data.total) ? data.total : 0);
        setTotalPages(Math.max(1, Number.isFinite(data.totalPages) ? data.totalPages : 1));
      } catch (requestError) {
        if (requestError instanceof Error && requestError.name !== 'AbortError') {
          setError(requestError.message);
          setUniversities([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, countryFilter, page]);

  const changeSearch = (value: string) => { setSearch(value); setPage(1); };
  const changeCountry = (value: string) => { setCountryFilter(value); setPage(1); };


  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-8">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 md:p-12 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-4">{total ? `${total} Partner Universities Worldwide` : 'Partner Universities Worldwide'}</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F172A] tracking-tight mb-4">Top Partner Universities Worldwide</h1>
          <p className="text-base md:text-lg text-gray-600 max-w-3xl leading-relaxed">Browse partner universities across the UK, USA, Canada, Australia, Germany, New Zealand, Ireland, and Dubai. Find entry requirements, tuition fees, and scholarship guidance.</p>
          <div className="flex gap-2 mt-4">


            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{total ? `${total} Universities` : 'Live Directory'}</Badge>
          </div>
        </div>

        <Card className="p-4 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
              <Input
                placeholder="Search university, city, or country…"
                value={search}
                onChange={event => changeSearch(event.target.value)}
                className="pl-9 bg-white border-[#E2E8F0] h-11"
                aria-label="Search universities"
              />
            </div>
            <select
              value={countryFilter}
              onChange={event => changeCountry(event.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm h-11"
              aria-label="Filter universities by country"
            >
              <option value="">All countries</option>
              {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>
        </Card>

        {loading && universities.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading universities" aria-busy="true">
            {[...Array(6)].map((_, index) => <div key={index} className="h-48 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl animate-pulse" />)}
          </div>
        ) : error ? (
          <Card className="p-10 bg-red-50 border-red-200 rounded-2xl text-center" role="alert">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="font-semibold text-red-900">University data could not be loaded.</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </Card>
        ) : universities.length === 0 ? (
          <Card className="p-12 bg-[#F8FAFC] border-[#E2E8F0] rounded-2xl text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No university records matched these filters.</p>
            <p className="text-xs text-gray-500 mt-2">Try a different search or country filter.</p>
          </Card>
        ) : (
          <>
            <p className="text-sm text-gray-500">{total !== null && total > universities.length ? `Showing ${universities.length} of ${total} universities` : `${universities.length} universities found`}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {universities.map(university => {
                const ranking = university.worldRanking ?? university.ranking ?? 0;
                return (
                <Link key={university.id} href={`/universities/${university.slug || university.id}`}>
                  <Card className="p-6 bg-white border-[#E2E8F0] hover:border-[#0057B8] hover:shadow-md transition-all rounded-2xl h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-[10px]">{university.country}</Badge>
                        {ranking > 0 ? <span className="text-[11px] text-gray-500">{university.rankingProvider || 'Ranking'} {university.rankingYear || ''} #{ranking}</span> : <span className="text-[11px] text-gray-500">Ranking not recorded</span>}
                      </div>
                      <h2 className="font-bold text-[#0F172A] mb-1 line-clamp-2">{university.name}</h2>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" aria-hidden="true" />{university.city || 'City not recorded'}, {university.country} • {university.type || 'Type not recorded'}</p>
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-1 text-xs">
                        <div className="flex justify-between gap-2"><span className="text-gray-500">Verified courses in directory</span><span className="font-medium">{university._count?.courses ?? 'Not reported'}</span></div>
                        <div className="flex justify-between gap-2"><span className="text-gray-500">Last verified</span><span className="font-medium">{university.lastVerifiedAt ? new Date(university.lastVerifiedAt).toLocaleDateString() : 'Not recorded'}</span></div>
                      </div>
                    </div>
                    <span className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-[#0057B8] text-white h-11 text-xs font-bold">
                      View University Information <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </span>
                  </Card>
                </Link>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <Button type="button" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(current => Math.max(1, current - 1))} aria-label="Previous universities page"><ChevronLeft className="size-4" />Previous</Button>
                <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
                <Button type="button" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage(current => Math.min(totalPages, current + 1))} aria-label="Next universities page">Next<ChevronRight className="size-4" /></Button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
