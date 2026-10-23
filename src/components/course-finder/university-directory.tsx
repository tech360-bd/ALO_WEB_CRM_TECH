'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search, Building2, MapPin, Globe, Trophy, ExternalLink,
  BookOpen, SearchX, SlidersHorizontal,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { COUNTRIES, COUNTRY_FLAGS } from './types';
import type { University } from './types';

const MOCK_UNIVERSITIES: University[] = [
  {
    id: 'u1', name: 'University of Oxford', country: 'UK', city: 'Oxford',
    type: 'Public', ranking: 1, tuitionMin: 28000, tuitionMax: 45000,
    tuitionCurrency: 'GBP', website: 'https://ox.ac.uk', courseCount: 156,
  },
  {
    id: 'u2', name: 'University of Melbourne', country: 'Australia', city: 'Melbourne',
    type: 'Public', ranking: 14, tuitionMin: 35000, tuitionMax: 55000,
    tuitionCurrency: 'AUD', website: 'https://unimelb.edu.au', courseCount: 320,
  },
  {
    id: 'u3', name: 'University of Toronto', country: 'Canada', city: 'Toronto',
    type: 'Public', ranking: 21, tuitionMin: 45000, tuitionMax: 68000,
    tuitionCurrency: 'CAD', website: 'https://utoronto.ca', courseCount: 280,
  },
  {
    id: 'u4', name: 'TU Munich', country: 'Germany', city: 'Munich',
    type: 'Public', ranking: 37, tuitionMin: 200, tuitionMax: 5000,
    tuitionCurrency: 'EUR', website: 'https://tum.de', courseCount: 180,
  },
  {
    id: 'u5', name: 'University College Dublin', country: 'Ireland', city: 'Dublin',
    type: 'Public', ranking: 171, tuitionMin: 18000, tuitionMax: 30000,
    tuitionCurrency: 'EUR', website: 'https://ucd.ie', courseCount: 145,
  },
  {
    id: 'u6', name: 'MIT', country: 'USA', city: 'Cambridge',
    type: 'Private', ranking: 1, tuitionMin: 55000, tuitionMax: 60000,
    tuitionCurrency: 'USD', website: 'https://mit.edu', courseCount: 95,
  },
  {
    id: 'u7', name: 'University of Auckland', country: 'New Zealand', city: 'Auckland',
    type: 'Public', ranking: 68, tuitionMin: 25000, tuitionMax: 38000,
    tuitionCurrency: 'NZD', website: 'https://auckland.ac.nz', courseCount: 210,
  },
  {
    id: 'u8', name: 'University of Tokyo', country: 'Japan', city: 'Tokyo',
    type: 'Public', ranking: 28, tuitionMin: 4000, tuitionMax: 8000,
    tuitionCurrency: 'JPY', website: 'https://u-tokyo.ac.jp', courseCount: 175,
  },
  {
    id: 'u9', name: 'Universiti Malaya', country: 'Malaysia', city: 'Kuala Lumpur',
    type: 'Public', ranking: 60, tuitionMin: 5000, tuitionMax: 12000,
    tuitionCurrency: 'MYR', website: 'https://um.edu.my', courseCount: 190,
  },
  {
    id: 'u10', name: 'Seoul National University', country: 'South Korea', city: 'Seoul',
    type: 'Public', ranking: 29, tuitionMin: 5000, tuitionMax: 9000,
    tuitionCurrency: 'KRW', website: 'https://snu.ac.kr', courseCount: 165,
  },
  {
    id: 'u11', name: 'University of Copenhagen', country: 'Denmark', city: 'Copenhagen',
    type: 'Public', ranking: 32, tuitionMin: 0, tuitionMax: 15000,
    tuitionCurrency: 'EUR', website: 'https://ku.dk', courseCount: 120,
  },
  {
    id: 'u12', name: 'IIT Delhi', country: 'India', city: 'New Delhi',
    type: 'Public', ranking: 150, tuitionMin: 800, tuitionMax: 2000,
    tuitionCurrency: 'USD', website: 'https://iitd.ac.in', courseCount: 85,
  },
];

const typeColors: Record<string, string> = {
  Public: 'bg-emerald-100 text-emerald-700',
  Private: 'bg-violet-100 text-violet-700',
};

function UniversityCard({ uni }: { uni: University }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-[var(--alo-border)]">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[var(--alo-text)] text-sm leading-snug truncate">
              {COUNTRY_FLAGS[uni.country]} {uni.name}
            </h3>
          </div>
          <Badge variant="secondary" className={typeColors[uni.type] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}>
            {uni.type}
          </Badge>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--alo-text-muted)]">
          <MapPin className="size-3.5 text-[var(--alo-text-muted)]" />
          <span>{uni.city}, {uni.country}</span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--alo-body)]">
          {uni.ranking > 0 && (
            <div className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-amber-500" />
              <span>Rank #{uni.ranking}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <BookOpen className="size-3.5 text-[var(--alo-text-muted)]" />
            <span>{uni.courseCount} courses</span>
          </div>
        </div>

        {/* Tuition Range */}
        <div className="text-xs text-[var(--alo-text-muted)]">
          <span className="font-medium text-[var(--alo-body)]">Tuition:</span>{' '}
          {uni.tuitionMin === 0 ? (
            <span className="text-emerald-600 font-medium">Free / Tuition-free</span>
          ) : (
            <span>
              {uni.tuitionCurrency} {uni.tuitionMin.toLocaleString()} – {uni.tuitionMax.toLocaleString()}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
 variant="outline"
 size="sm"
 className="flex-1 "
 onClick={() => toast.info('Browsing courses at ' + uni.name)}
          >
            <BookOpen className="size-3 mr-1" />
            View Courses
          </Button>
          <Button
 variant="outline"
 size="sm"
 className=" "
 onClick={() => window.open(uni.website, '_blank')}
          >
            <Globe className="size-3 mr-1" />
            Website
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UniversityCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function UniversityDirectory() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');

  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (countryFilter !== 'all') params.set('country', countryFilter);

      const res = await fetch(`/api/universities?${params.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUniversities(data.universities || []);
    } catch {
      setUniversities(MOCK_UNIVERSITIES);
    } finally {
      setLoading(false);
    }
  }, [search, countryFilter]);

  useEffect(() => { fetchUniversities(); }, [fetchUniversities]);

  const filteredUnis = universities.filter((u) => {
    if (countryFilter !== 'all' && u.country !== countryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="size-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">University Directory</h1>
          <p className="text-emerald-100 mt-2 text-sm sm:text-base">
            Browse universities across {COUNTRIES.length} countries
          </p>

          {/* Search */}
          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-[var(--alo-text-muted)]" />
            <Input
              placeholder="Search universities, cities, or countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-12 text-base bg-white text-[var(--alo-text)] border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Country Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--alo-body)]">Country:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={countryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCountryFilter('all')}
              className={
                countryFilter === 'all'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs'
                  : 'h-7 text-xs'
              }
            >
              All
            </Button>
            {COUNTRIES.map((c) => (
              <Button
                key={c}
                variant={countryFilter === c ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCountryFilter(c)}
                className={
                  countryFilter === c
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs'
                    : 'h-7 text-xs'
                }
              >
                {COUNTRY_FLAGS[c]} {c}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <UniversityCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredUnis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-[var(--alo-surface-muted)] flex items-center justify-center mb-4">
              <SearchX className="size-10 text-[var(--alo-placeholder)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--alo-body)]">No universities found</h3>
            <p className="text-sm text-[var(--alo-text-muted)] mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--alo-text-muted)]">
              <span className="font-medium text-[var(--alo-body)]">{filteredUnis.length}</span>{' '}
              {filteredUnis.length === 1 ? 'university' : 'universities'} found
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnis.map((uni) => (
                <UniversityCard key={uni.id} uni={uni} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}