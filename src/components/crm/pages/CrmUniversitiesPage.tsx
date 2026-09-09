'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Search, ExternalLink, Star, MapPin, GraduationCap,
  Globe, Award, ChevronLeft, ChevronRight, Building2,
} from 'lucide-react';

interface UniversityData {
  id: string;
  universityId: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  worldRanking: number;
  type: string;
  founded: number;
  students: string;
  intlStudents: string;
  ieltsMin: number;
  tuitionRange: string;
  scholarships: boolean;
  featured: boolean;
  website: string;
  officialUrl: string;
  description: string;
}

const COUNTRIES = [
  'all', 'United Kingdom', 'Australia', 'Canada', 'United States',
  'Germany', 'New Zealand', 'Ireland', 'Malaysia',
];

const countryFlag = (c: string) => {
  const map: Record<string, string> = {
    'United Kingdom': '🇬🇧', 'Australia': '🇦🇺', 'Canada': '🇨🇦',
    'United States': '🇺🇸', 'Germany': '🇩🇪', 'New Zealand': '🇳🇿',
    'Ireland': '🇮🇪', 'Malaysia': '🇲🇾',
  };
  return map[c] || '🌍';
};

export default function CrmUniversitiesPage() {
  const [universities, setUniversities] = useState<UniversityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const doFetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '24' });
        if (search) params.set('search', search);
        if (country !== 'all') params.set('country', country);
        const res = await fetch(`/api/crm/universities?${params}`);
        const data = await res.json();
        if (data.success) {
          setUniversities(data.data);
          setTotalPages(data.pagination.pages);
          setTotal(data.pagination.total);
        }
      } catch { /* keep existing */ }
      setLoading(false);
    };
    doFetch();
  }, [search, country, page]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Universities</h1>
          <p className="text-sm text-alo-text-secondary mt-1">
            {total} universities across 8 countries with course, fee, and requirement data
          </p>
        </div>
        <Badge variant="brand" className="text-xs w-fit">
          <Building2 className="w-3 h-3 mr-1" /> Live Database
        </Badge>
      </div>

      {/* Search & Filter */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" />
              <Input placeholder="Search universities, cities, countries..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={country} onValueChange={(v) => { setCountry(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === 'all' ? 'All Countries' : `${countryFlag(c)} ${c}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-alo-border rounded-xl">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : universities.length === 0 ? (
        <Card className="border border-alo-border rounded-xl">
          <CardContent className="p-12 text-center">
            <Building2 className="w-12 h-12 text-alo-text-muted/30 mx-auto mb-3" />
            <p className="text-alo-text font-medium">No universities found</p>
            <p className="text-sm text-alo-text-muted mt-1">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {universities.map((uni) => (
              <Card key={uni.id} className={`bg-white rounded-xl border hover:border-alo-brand/30 hover:shadow-sm transition-all ${uni.featured ? 'border-alo-brand/50' : 'border-alo-border'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {uni.featured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                        <h3 className="text-sm font-semibold text-alo-text truncate">{uni.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-alo-text-secondary">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{countryFlag(uni.country)} {uni.city}, {uni.country}</span>
                      </div>
                    </div>
                    {uni.worldRanking > 0 && (
                      <Badge variant={uni.worldRanking <= 50 ? 'brand' : uni.worldRanking <= 100 ? 'default' : 'muted'} className="text-[10px] shrink-0">
                        QS #{uni.worldRanking}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-alo-text-muted line-clamp-2 mb-3 leading-relaxed">{uni.description}</p>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
                    <div className="flex items-center gap-1.5 text-alo-text-secondary">
                      <Globe className="w-3 h-3 shrink-0" />
                      <span>{uni.students} students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-alo-text-secondary">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span>{uni.intlStudents} intl</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-alo-text-secondary">
                      <Award className="w-3 h-3 shrink-0" />
                      <span>IELTS {uni.ieltsMin}+</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-alo-text-secondary">
                      <span className="font-medium text-alo-text">{uni.tuitionRange}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-alo-border">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="muted" className="text-[10px]">{uni.type}</Badge>
                      <Badge variant="muted" className="text-[10px]">Est. {uni.founded}</Badge>
                      {uni.scholarships && (
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                          Scholarships
                        </Badge>
                      )}
                    </div>
                    {uni.officialUrl && (
                      <a href={uni.officialUrl} target="_blank" rel="noopener noreferrer" className="text-alo-brand hover:text-alo-brand/80 text-xs font-medium flex items-center gap-0.5">
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-alo-text-muted">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}